// app/types/Restaurant.ts
export interface Restaurant {
  id: string; // Google Place ID, so far not used in the app
  name: string;
  address: string;
  mapsUrl: string;
  imageUrl: string;
  latitude: number; // Make required, we'll get this from Place Details
  longitude: number; // Make required, we'll get this from Place Details
  rating?: number;
  user_ratings_total?: number; // <<< ADD THIS LINE
  price_level?: number; // 0-4 for $, $$, $$$, $$$$
  cuisine?: string; // Obtained from Places API
  distanceKm?: number; // Calculated distance from user
}
