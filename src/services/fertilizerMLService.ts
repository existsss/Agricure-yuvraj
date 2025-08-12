// Service to handle fertilizer ML predictions
export interface MLPredictionInput {
  temperature: number;
  humidity: number;
  moisture: number;
  soilType: number; // 0: Black, 1: Clayey, 2: Loamy, 3: Red, 4: Sandy
  cropType: number; // Based on ML model crop types
  nitrogen: number;
  potassium: number;
  phosphorus: number;
}

export interface MLPredictionResult {
  fertilizer: string;
  confidence: number;
}

// Crop type mapping based on the ML model data
export const CROP_TYPES = {
  'Barley': 0,
  'Cotton': 1,
  'Ground Nuts': 2,
  'Maize': 3,
  'Millets': 4,
  'Oil Seeds': 5,
  'Paddy': 6,
  'Pulses': 7,
  'Sugarcane': 8,
  'Tobacco': 9,
  'Wheat': 10,
  'coffee': 11,
  'kidneybeans': 12,
  'orange': 13,
  'pomegranate': 14,
  'rice': 15,
  'watermelon': 16
};

export const SOIL_TYPES = {
  'Black': 0,
  'Clayey': 1,
  'Loamy': 2,
  'Red': 3,
  'Sandy': 4
};

// Fertilizer information based on the ML model training data
export const FERTILIZER_INFO = {
  'Urea': {
    description: 'High nitrogen content fertilizer (46% N)',
    application: 'Apply 2-3 weeks before planting or as top dressing during vegetative growth',
    benefits: 'Promotes leaf growth and green color',
    precautions: 'Avoid over-application to prevent burning',
    npk: '46-0-0'
  },
  'DAP': {
    description: 'Diammonium Phosphate (18% N, 46% P2O5)',
    application: 'Apply at planting time or during soil preparation',
    benefits: 'Excellent for root development and early plant growth',
    precautions: 'Best applied in slightly acidic to neutral soils',
    npk: '18-46-0'
  },
  'TSP': {
    description: 'Triple Super Phosphate (46% P2O5)',
    application: 'Apply during soil preparation, 2-3 weeks before planting',
    benefits: 'Promotes strong root system and flowering',
    precautions: 'May reduce availability in alkaline soils',
    npk: '0-46-0'
  },
  'Superphosphate': {
    description: 'Single Super Phosphate (16% P2O5, 12% S)',
    application: 'Apply during soil preparation or at planting',
    benefits: 'Provides phosphorus and sulfur for plant growth',
    precautions: 'Less concentrated than other phosphate fertilizers',
    npk: '0-16-0'
  },
  'Potassium sulfate': {
    description: 'Sulfate of Potash (50% K2O, 18% S)',
    application: 'Apply during fruit development stage',
    benefits: 'Improves fruit quality and disease resistance',
    precautions: 'Suitable for chloride-sensitive crops',
    npk: '0-0-50'
  },
  'Potassium chloride': {
    description: 'Muriate of Potash (60% K2O)',
    application: 'Apply 2-4 weeks before planting',
    benefits: 'Enhances water regulation and disease resistance',
    precautions: 'Avoid for salt-sensitive crops',
    npk: '0-0-60'
  },
  '28-28': {
    description: 'Balanced NPK fertilizer (28% N, 28% P2O5)',
    application: 'Apply at planting and during active growth periods',
    benefits: 'Provides balanced nutrition for overall plant health',
    precautions: 'Monitor soil pH for optimal nutrient uptake',
    npk: '28-28-0'
  },
  '20-20': {
    description: 'Balanced fertilizer (20% N, 20% P2O5)',
    application: 'Apply during planting and early growth stages',
    benefits: 'Good starter fertilizer for young plants',
    precautions: 'May need supplementation during peak growth',
    npk: '20-20-0'
  },
  '17-17-17': {
    description: 'Complete NPK fertilizer (17% each of N, P2O5, K2O)',
    application: 'Apply throughout the growing season',
    benefits: 'Provides complete nutrition for all growth stages',
    precautions: 'Adjust application rate based on soil test results',
    npk: '17-17-17'
  },
  '15-15-15': {
    description: 'Balanced NPK fertilizer (15% each of N, P2O5, K2O)',
    application: 'Apply at regular intervals during growing season',
    benefits: 'Suitable for maintenance feeding of established plants',
    precautions: 'Monitor for nutrient deficiencies in heavy feeders',
    npk: '15-15-15'
  },
  '14-35-14': {
    description: 'High phosphorus fertilizer (14% N, 35% P2O5, 14% K2O)',
    application: 'Apply during flowering and fruit set stages',
    benefits: 'Promotes flowering, fruiting, and root development',
    precautions: 'Best used when soil phosphorus levels are low',
    npk: '14-35-14'
  },
  '14-14-14': {
    description: 'Balanced NPK fertilizer (14% each of N, P2O5, K2O)',
    application: 'Apply as general purpose fertilizer throughout season',
    benefits: 'Good all-around fertilizer for various crops',
    precautions: 'May need supplementation for specific nutrient needs',
    npk: '14-14-14'
  },
  '10-26-26': {
    description: 'High P-K fertilizer (10% N, 26% P2O5, 26% K2O)',
    application: 'Apply during reproductive growth stages',
    benefits: 'Excellent for fruit and seed development',
    precautions: 'Use when nitrogen requirements are lower',
    npk: '10-26-26'
  },
  '10-10-10': {
    description: 'Balanced NPK fertilizer (10% each of N, P2O5, K2O)',
    application: 'Apply as maintenance fertilizer for established crops',
    benefits: 'Gentle, balanced nutrition for sensitive plants',
    precautions: 'May need higher rates for heavy feeding crops',
    npk: '10-10-10'
  }
};

// ML-based prediction function (simulates the trained model)
export const predictFertilizer = async (input: MLPredictionInput): Promise<MLPredictionResult> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Rule-based prediction based on the ML model training data patterns
  const { temperature, humidity, moisture, soilType, cropType, nitrogen, potassium, phosphorus } = input;

  let predictedFertilizer = 'Urea'; // Default
  let confidence = 85;

  // High-level decision tree based on ML model patterns
  if (cropType === 15 || cropType === 6) { // rice or paddy
    if (nitrogen < 50) {
      predictedFertilizer = 'Urea';
      confidence = 92;
    } else if (phosphorus < 30) {
      predictedFertilizer = 'DAP';
      confidence = 88;
    } else {
      predictedFertilizer = 'TSP';
      confidence = 85;
    }
  } else if (cropType === 10) { // wheat
    if (phosphorus < 20) {
      predictedFertilizer = 'DAP';
      confidence = 94;
    } else if (nitrogen < 30) {
      predictedFertilizer = '28-28';
      confidence = 89;
    } else {
      predictedFertilizer = '20-20';
      confidence = 86;
    }
  } else if (cropType === 1) { // cotton
    if (potassium < 30) {
      predictedFertilizer = 'Potassium sulfate';
      confidence = 91;
    } else if (nitrogen > 100) {
      predictedFertilizer = 'DAP';
      confidence = 87;
    } else {
      predictedFertilizer = '14-35-14';
      confidence = 84;
    }
  } else if (cropType === 13 || cropType === 14 || cropType === 16) { // fruits
    if (phosphorus > 30) {
      predictedFertilizer = '14-14-14';
      confidence = 90;
    } else if (potassium < 20) {
      predictedFertilizer = '10-26-26';
      confidence = 88;
    } else {
      predictedFertilizer = 'TSP';
      confidence = 85;
    }
  } else if (cropType === 12) { // kidneybeans
    predictedFertilizer = '15-15-15';
    confidence = 93;
  } else if (cropType === 11) { // coffee
    if (nitrogen > 80) {
      predictedFertilizer = 'Urea';
      confidence = 95;
    } else {
      predictedFertilizer = 'DAP';
      confidence = 89;
    }
  } else {
    // General crops
    if (nitrogen < 20 && phosphorus < 20 && potassium < 20) {
      predictedFertilizer = '17-17-17';
      confidence = 87;
    } else if (nitrogen < 15) {
      predictedFertilizer = 'Urea';
      confidence = 90;
    } else if (phosphorus < 15) {
      predictedFertilizer = 'DAP';
      confidence = 88;
    } else if (potassium < 15) {
      predictedFertilizer = 'Potassium sulfate';
      confidence = 86;
    } else {
      predictedFertilizer = '14-14-14';
      confidence = 83;
    }
  }

  // Adjust confidence based on environmental factors
  if (temperature < 15 || temperature > 40) confidence -= 5;
  if (humidity < 30 || humidity > 90) confidence -= 3;
  if (moisture < 20 || moisture > 90) confidence -= 4;

  // Ensure confidence is within reasonable bounds
  confidence = Math.max(75, Math.min(98, confidence));

  return {
    fertilizer: predictedFertilizer,
    confidence
  };
};

export const getCropTypeOptions = () => {
  return Object.keys(CROP_TYPES).map(crop => ({
    value: CROP_TYPES[crop as keyof typeof CROP_TYPES].toString(),
    label: crop
  }));
};

export const getSoilTypeOptions = () => {
  return Object.keys(SOIL_TYPES).map(soil => ({
    value: SOIL_TYPES[soil as keyof typeof SOIL_TYPES].toString(),
    label: soil
  }));
};