// src/types/Restaurant.ts

export interface Restaurant {
  id: string; // Google Place ID
  name: string;
  address: string;
  mapsUrl: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  rating?: number; 
  user_ratings_total?: number; 
  price_level?: string; 
  cuisine?: string; 
  distanceKm?: number; 
}
