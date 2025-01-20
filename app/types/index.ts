import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Prediction {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  coinId: string;
  coinName: string;
  price: number;
  timeframe: string;
  summary: string;
  createdAt: Timestamp;
  votes: number;
  researchLinks?: string[];
}

export interface PredictionSummary {
  avgPrice: number;
  totalVotes: number;
  count: number;
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  totalVotes: number;
  predictionCount: number;
  averageVotes: number;
  description?: string;
  twitterHandle?: string;
  userId: string;
} 