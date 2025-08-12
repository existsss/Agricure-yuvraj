// authService.ts
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db'; // <-- You must have a MongoDB connection helper
import { UserProfile } from './supabaseClient'; // Keep type for compatibility

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

export const authService = {
  // Sign up new user
  async signUp(data: SignUpData) {
    try {
      const db = await getDb();
      const users = db.collection('user_profiles');

      // Check if email exists
      const existing = await users.findOne({ email: data.email });
      if (existing) throw new Error('Email already registered');

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Insert new user
      const result = await users.insertOne({
        full_name: data.fullName,
        email: data.email,
        farm_location: data.farmLocation,
        password_hash: hashedPassword,
        created_at: new Date(),
      });

      return { data: { user: { id: result.insertedId } }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in user
  async signIn(data: SignInData) {
    try {
      const db = await getDb();
      const users = db.collection('user_profiles');

      const user = await users.findOne({ email: data.email });
      if (!user) throw new Error('Invalid credentials');

      const match = await bcrypt.compare(data.password, user.password_hash);
      if (!match) throw new Error('Invalid credentials');

      // Create token (replace with your secret)
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });

      return { data: { user, token }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out user
  async signOut() {
    // In JWT-based auth, sign out is handled client-side by deleting the token.
    return { error: null };
  },

  // Get current user (by token)
  async getCurrentUser(token?: string) {
    try {
      if (!token) return { user: null, error: 'No token provided' };

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const db = await getDb();
      const user = await db.collection('user_profiles').findOne({ _id: new ObjectId(decoded.id) });

      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const db = await getDb();
      const data = await db.collection('user_profiles').findOne({ _id: new ObjectId(userId) });
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const db = await getDb();
      const result = await db.collection('user_profiles')
        .findOneAndUpdate(
          { _id: new ObjectId(userId) },
          { $set: updates },
          { returnDocument: 'after' }
        );

      return { data: result.value, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // No onAuthStateChange in MongoDB
  onAuthStateChange() {
    console.warn('Auth state change listener is not supported in MongoDB directly.');
    return () => {};
  }
};
