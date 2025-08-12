import { MongoClient, Db } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("Missing MongoDB connection string in environment variables");
}

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db; // reuse existing connection

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || "mydatabase"); // replace if needed

  console.log("✅ Connected to MongoDB");
  return db;
}

// Types for our database collections
export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  farm_location?: string;
  phone_number?: string;
  farm_size?: number;
  farm_size_unit?: string;
  created_at: string;
  updated_at: string;
}

export interface FertilizerRecommendation {
  id: string;
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
  status: "pending" | "applied" | "scheduled";
  created_at: string;
}
