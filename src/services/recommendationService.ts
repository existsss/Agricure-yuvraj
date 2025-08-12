import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the interface for the recommendation document
export interface FertilizerRecommendation extends Document {
  user_id: string;
  field_name: string;
  field_size: number;
  field_size_unit: string;
  crop_type: string;
  soil_type: string;
  soil_ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  primary_fertilizer: string;
  secondary_fertilizer?: string;
  ml_prediction: string;
  confidence_score: number;
  cost_estimate?: string;
  status?: 'pending' | 'applied' | 'scheduled';
  created_at?: Date;
}

// Create schema
const FertilizerRecommendationSchema = new Schema<FertilizerRecommendation>(
  {
    user_id: { type: String, required: true },
    field_name: { type: String, required: true },
    field_size: { type: Number, required: true },
    field_size_unit: { type: String, required: true },
    crop_type: { type: String, required: true },
    soil_type: { type: String, required: true },
    soil_ph: { type: Number, required: true },
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    soil_moisture: { type: Number, required: true },
    primary_fertilizer: { type: String, required: true },
    secondary_fertilizer: { type: String },
    ml_prediction: { type: String, required: true },
    confidence_score: { type: Number, required: true },
    cost_estimate: { type: String },
    status: { type: String, enum: ['pending', 'applied', 'scheduled'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Create model
const FertilizerRecommendationModel: Model<FertilizerRecommendation> =
  mongoose.models.FertilizerRecommendation ||
  mongoose.model<FertilizerRecommendation>('FertilizerRecommendation', FertilizerRecommendationSchema);

// CreateRecommendationData interface (same as before)
export interface CreateRecommendationData {
  user_id: string;
  field_name: string;
  field_size: number;
  field_size_unit: string;
  crop_type: string;
  soil_type: string;
  soil_ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  primary_fertilizer: string;
  secondary_fertilizer?: string;
  ml_prediction: string;
  confidence_score: number;
  cost_estimate?: string;
  status?: 'pending' | 'applied' | 'scheduled';
}

// Service object
export const recommendationService = {
  // Create new recommendation
  async createRecommendation(data: CreateRecommendationData) {
    try {
      const recommendation = await FertilizerRecommendationModel.create(data);
      return { data: recommendation, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get user's recommendations
  async getUserRecommendations(userId: string) {
    try {
      const recommendations = await FertilizerRecommendationModel.find({ user_id: userId })
        .sort({ created_at: -1 });
      return { data: recommendations, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get a single recommendation by id
  async getRecommendationById(id: string) {
    try {
      const recommendation = await FertilizerRecommendationModel.findById(id);
      return { data: recommendation, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Update recommendation status
  async updateRecommendationStatus(recommendationId: string, status: 'pending' | 'applied' | 'scheduled') {
    try {
      const updated = await FertilizerRecommendationModel.findByIdAndUpdate(
        recommendationId,
        { status },
        { new: true }
      );
      return { data: updated, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Delete recommendation
  async deleteRecommendation(recommendationId: string) {
    try {
      await FertilizerRecommendationModel.findByIdAndDelete(recommendationId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get recent recommendations (for overview)
  async getRecentRecommendations(userId: string, limit: number = 5) {
    try {
      const recommendations = await FertilizerRecommendationModel.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(limit);
      return { data: recommendations, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
