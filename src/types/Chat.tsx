// src/types/Chat.ts

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  suggestions?: RestaurantSuggestion[];
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSuggestion {
  id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: string;
  cuisine?: string;
  image_url?: string;
  maps_url?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  user_ratings_total?: number;
  isNewRestaurant?: boolean; // Flag to indicate if it's from external API
}

export interface UserPreferences {
  likedCuisines: string[];
  dislikedCuisines: string[];
  preferredPriceRanges: string[];
  averageRating: number;
  commonLocations: { latitude: number; longitude: number; count: number }[];
  totalSaved: number;
  totalSwiped: number;
}

export interface ChatContext {
  area?: string;
  mood?: string;
  occasion?: string;
  budget?: "cheap" | "moderate" | "expensive" | "any";
  travelTime?: "15min" | "30min" | "1hour" | "anywhere";
  userPreferences?: UserPreferences;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
