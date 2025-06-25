// app/types/Restaurant.ts
export interface Restaurant {
  id: string; // Google Place ID
  name: string;
  address: string;
  mapsUrl: string;
  imageUrl: string;
  latitude: number; // Make required, we'll get this from Place Details
  longitude: number; // Make required, we'll get this from Place Details
  rating?: number;
  user_ratings_total?: number; // <<< ADD THIS LINE
  price_level?: number; // 0-4 for $, $$, $$$, $$$$
  cuisine?: string; // Example: "Japanese", "Italian". This is often inferred or from Place Details 'types'.
  // ambience?: string[]; // This is typically harder to get directly.
  distanceKm?: number; // Calculated distance from user
  // Add other fields from Place Details you might want to display:
  // website?: string;
  // formatted_phone_number?: string;
  // user_ratings_total?: number;
  // opening_hours?: { open_now: boolean };
}
