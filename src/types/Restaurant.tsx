// app/types/Restaurant.ts

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
  price_level?: number; // 0-4 for $, $$, $$$, $$$$
  cuisine?: string; // Example: "Japanese", "Italian". This is often inferred or from Place Details 'types'.
  distanceKm?: number; // Calculated distance from user
  description?: string; // ADDED: For editorialSummary from Places API (New)
  // Add other fields from Place Details you might want to display:
  // website?: string;
  // formatted_phone_number?: string;
  // opening_hours?: { open_now: boolean };
}
