import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from './db'; // Your MongoDB connection helper
import { UserProfile } from './types'; // Keep same type as before

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  farmLocation?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret';

export const authService = {
  // Sign up new user
  async signUp(data: SignUpData) {
    try {
      const db = getDb();
      const users = db.collection('user_profiles');

      const existing = await users.findOne({ email: data.email });
      if (existing) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const userDoc = {
        full_name: data.fullName,
        email: data.email,
        password_hash: hashedPassword,
        farm_location: data.farmLocation || null,
        created_at: new Date()
      };

      const result = await users.insertOne(userDoc);

      const token = jwt.sign({ id: result.insertedId }, JWT_SECRET, { expiresIn: '7d' });

      return {
        data: {
          user: { id: result.insertedId, email: data.email },
          token
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in user
  async signIn(data: SignInData) {
    try {
      const db = getDb();
      const users = db.collection('user_profiles');

      const user = await users.findOne({ email: data.email });
      if (!user) throw new Error('Invalid email or password');

      const match = await bcrypt.compare(data.password, user.password_hash);
      if (!match) throw new Error('Invalid email or password');

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

      return {
        data: {
          user: { id: user._id, email: user.email },
          token
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out user — handled client-side by removing token
  async signOut() {
    return { error: null };
  },

  // Get current user from token
  async getCurrentUser(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const db = getDb();
      const users = db.collection('user_profiles');

      const user = await users.findOne({ _id: new ObjectId(decoded.id) });
      if (!user) throw new Error('User not found');

      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const db = getDb();
      const users = db.collection('user_profiles');

      const user = await users.findOne({ _id: new ObjectId(userId) });
      if (!user) throw new Error('User not found');

      return { data: user as unknown as UserProfile, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const db = getDb();
      const users = db.collection('user_profiles');

      if (updates.password) {
        updates.password_hash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      const result = await users.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result.value) throw new Error('User not found');

      return { data: result.value, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // No built-in auth state change — stubbed for compatibility
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // You could implement WebSocket-based state changes here if needed
    return { unsubscribe: () => {} };
  }
};
