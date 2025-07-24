// src/types/Restaurant.ts

export interface Restaurant {
  id: string; // Google Place ID
  name: string;
  address: string;
  mapsUrl: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  rating?: number; // Optional, as not all places have ratings
  user_ratings_total?: number; // Optional
  price_level?: string; // CHANGED: Now a string (e.g., "PRICE_LEVEL_MODERATE")
  cuisine?: string; // Optional
  distanceKm?: number; // Optional
}
