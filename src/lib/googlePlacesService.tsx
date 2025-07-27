// src/lib/googlePlacesService.ts

import { RestaurantSuggestion } from "../types/Chat";
import Constants from "expo-constants";

const GOOGLE_PLACES_API_KEY =
  Constants.expoConfig?.extra?.expoPublicGooglePlacesKey;
const GOOGLE_PLACES_BASE_URL = "https://maps.googleapis.com/maps/api/place";

interface PlaceSearchResult {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  user_ratings_total?: number;
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  user_ratings_total?: number;
  url?: string;
}

export class GooglePlacesService {
  static async searchRestaurantsByText(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<RestaurantSuggestion[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("Google Places API key not found");
    }

    try {
      let url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(
        query + " restaurant"
      )}&key=${GOOGLE_PLACES_API_KEY}`;

      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=${radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const restaurants: RestaurantSuggestion[] = [];

      for (const place of data.results.slice(0, 10)) {
        // Limit to 10 results
        const restaurant = await this.formatPlaceAsRestaurant(place);
        if (restaurant) {
          restaurants.push(restaurant);
        }
      }

      return restaurants;
    } catch (error) {
      console.error("Error searching restaurants:", error);
      return [];
    }
  }

  static async searchNearbyRestaurants(
    location: { lat: number; lng: number },
    radius: number = 5000,
    cuisine?: string
  ): Promise<RestaurantSuggestion[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("Google Places API key not found");
    }

    try {
      let url = `${GOOGLE_PLACES_BASE_URL}/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;

      if (cuisine) {
        url += `&keyword=${encodeURIComponent(cuisine)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const restaurants: RestaurantSuggestion[] = [];

      for (const place of data.results.slice(0, 10)) {
        const restaurant = await this.formatPlaceAsRestaurant(place);
        if (restaurant) {
          restaurants.push(restaurant);
        }
      }

      return restaurants;
    } catch (error) {
      console.error("Error searching nearby restaurants:", error);
      return [];
    }
  }

  private static async formatPlaceAsRestaurant(
    place: PlaceSearchResult
  ): Promise<RestaurantSuggestion | null> {
    try {
      // Get additional details for the place
      const details = await this.getPlaceDetails(place.place_id);

      const restaurant: RestaurantSuggestion = {
        id: place.place_id,
        name: place.name,
        address: details?.formatted_address || place.vicinity,
        rating: place.rating,
        price_level: this.convertPriceLevel(place.price_level),
        cuisine: this.extractCuisineFromTypes(place.types),
        image_url: place.photos?.[0]
          ? this.getPhotoUrl(place.photos[0].photo_reference)
          : undefined,
        maps_url:
          details?.url || `https://maps.google.com/?place_id=${place.place_id}`,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        user_ratings_total: place.user_ratings_total,
        isNewRestaurant: true,
      };

      return restaurant;
    } catch (error) {
      console.error("Error formatting place as restaurant:", error);
      return null;
    }
  }

  private static async getPlaceDetails(
    placeId: string
  ): Promise<PlaceDetailsResult | null> {
    try {
      const url = `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${placeId}&fields=formatted_address,url&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error("Error getting place details:", error);
      return null;
    }
  }

  private static convertPriceLevel(priceLevel?: number): string {
    switch (priceLevel) {
      case 0:
        return "Free";
      case 1:
        return "$";
      case 2:
        return "$$";
      case 3:
        return "$$$";
      case 4:
        return "$$$$";
      default:
        return "N/A";
    }
  }

  private static extractCuisineFromTypes(types: string[]): string {
    const cuisineMap: { [key: string]: string } = {
      chinese_restaurant: "Chinese",
      italian_restaurant: "Italian",
      japanese_restaurant: "Japanese",
      mexican_restaurant: "Mexican",
      indian_restaurant: "Indian",
      thai_restaurant: "Thai",
      french_restaurant: "French",
      american_restaurant: "American",
      korean_restaurant: "Korean",
      vietnamese_restaurant: "Vietnamese",
      mediterranean_restaurant: "Mediterranean",
      seafood_restaurant: "Seafood",
      steakhouse: "Steakhouse",
      pizza_restaurant: "Pizza",
      fast_food_restaurant: "Fast Food",
      cafe: "Cafe",
      bakery: "Bakery",
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    // Fallback: look for generic food-related types
    if (types.includes("meal_takeaway")) return "Takeaway";
    if (types.includes("meal_delivery")) return "Delivery";
    if (types.includes("food")) return "Restaurant";

    return "Restaurant";
  }

  private static getPhotoUrl(
    photoReference: string,
    maxWidth: number = 400
  ): string {
    return `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
  }

  // Geocode an address/area to get coordinates
  static async geocodeArea(
    area: string
  ): Promise<{ lat: number; lng: number } | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("Google Places API key not found");
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        area
      )}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error("Error geocoding area:", error);
      return null;
    }
  }
}
