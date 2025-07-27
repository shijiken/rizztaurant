// src/lib/chatbotSupabaseService.ts

import { supabase } from "../lib/supabase"; // Since both files are in lib/
import { Conversation, Message, UserPreferences } from "../types/Chat";

export class ChatbotSupabaseService {
  // Create a new conversation
  static async createConversation(userId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
  }

  // Add a message to conversation
  static async addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data;
  }

  // Get conversation messages
  static async getConversationMessages(
    conversationId: string
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
  }

  // Get user's saved restaurants with full details
  static async getUserSavedRestaurants(userId: string) {
    const { data, error } = await supabase
      .from("user_saved_restaurants")
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          address,
          cuisine,
          rating,
          price_level,
          image_url,
          maps_url,
          latitude,
          longitude,
          user_ratings_total
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to get saved restaurants: ${error.message}`);
    }

    // Flatten the data structure
    return (
      data?.map((item) => ({
        ...item.restaurant,
        saved_at: item.saved_at,
      })) || []
    );
  }

  // Get user's swiped restaurants with full details
  static async getUserSwipedRestaurants(userId: string) {
    const { data, error } = await supabase
      .from("user_swiped_restaurants")
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          address,
          cuisine,
          rating,
          price_level,
          image_url,
          maps_url,
          latitude,
          longitude,
          user_ratings_total
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to get swiped restaurants: ${error.message}`);
    }

    return data || [];
  }

  // Get user's recent swipes (last 20 swipes for analysis)
  static async getUserRecentSwipes(userId: string) {
    const { data, error } = await supabase
      .from("user_swiped_restaurants")
      .select(
        `
        *,
        restaurant:restaurants (
          id,
          name,
          address,
          cuisine,
          rating,
          price_level,
          image_url,
          maps_url,
          latitude,
          longitude,
          user_ratings_total
        )
      `
      )
      .eq("user_id", userId)
      .order("swiped_at", { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to get recent swipes: ${error.message}`);
    }

    return data || [];
  }

  // Get popular restaurants (high rating and many reviews)
  static async getPopularRestaurants(limit: number = 15) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .gte("rating", 4.0) // Rating 4.0 or higher
      .gte("user_ratings_total", 50) // At least 50 reviews
      .order("rating", { ascending: false })
      .order("user_ratings_total", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get popular restaurants:", error);
      // Fallback: get any restaurants if popular query fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("restaurants")
        .select("*")
        .order("rating", { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }

      return fallbackData || [];
    }

    return data || [];
  }

  // Analyze user preferences from their data
  static async analyzeUserPreferences(
    userId: string
  ): Promise<UserPreferences> {
    const savedRestaurants = await this.getUserSavedRestaurants(userId);
    const swipedRestaurants = await this.getUserSwipedRestaurants(userId);

    const likedRestaurants = swipedRestaurants.filter(
      (r) => r.swiped_direction === "right"
    );
    const dislikedRestaurants = swipedRestaurants.filter(
      (r) => r.swiped_direction === "left"
    );

    // Combine saved and liked restaurants for preference analysis
    const allLikedRestaurants = [
      ...savedRestaurants,
      ...likedRestaurants.map((r) => r.restaurant).filter(Boolean),
    ];

    // Extract cuisines
    const likedCuisines = [
      ...new Set(
        allLikedRestaurants
          .map((r) => r?.cuisine)
          .filter(Boolean)
          .map((c) => c!.toLowerCase())
      ),
    ];

    const dislikedCuisines = [
      ...new Set(
        dislikedRestaurants
          .map((r) => r.restaurant?.cuisine)
          .filter(Boolean)
          .map((c) => c!.toLowerCase())
      ),
    ];

    // Extract price levels
    const preferredPriceRanges = [
      ...new Set(
        allLikedRestaurants.map((r) => r?.price_level).filter(Boolean)
      ),
    ];

    // Calculate average rating preference
    const ratingsWithValues = allLikedRestaurants
      .map((r) => r?.rating)
      .filter(
        (rating): rating is number => rating !== null && rating !== undefined
      );

    const averageRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) /
          ratingsWithValues.length
        : 0;

    // Extract common locations (simplified - just get all locations)
    const commonLocations = allLikedRestaurants
      .filter((r) => r?.latitude && r?.longitude)
      .map((r) => ({
        latitude: r!.latitude!,
        longitude: r!.longitude!,
        count: 1,
      }));

    return {
      likedCuisines,
      dislikedCuisines,
      preferredPriceRanges,
      averageRating,
      commonLocations,
      totalSaved: savedRestaurants.length,
      totalSwiped: swipedRestaurants.length,
    };
  }

  // Add a new restaurant to the database (for external API suggestions)
  static async addRestaurant(restaurant: {
    id: string;
    name: string;
    address: string;
    cuisine?: string;
    rating?: number;
    price_level?: string;
    image_url?: string;
    maps_url?: string;
    latitude?: number;
    longitude?: number;
    user_ratings_total?: number;
    distance_km?: number;
  }) {
    const { data, error } = await supabase
      .from("restaurants")
      .upsert(restaurant, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Failed to add restaurant to database:", error);
      // Don't throw error here - we can still show the suggestion even if DB insert fails
      return null;
    }

    return data;
  }

  // Search existing restaurants by area/location
  static async searchRestaurantsByArea(area: string, limit: number = 20) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .ilike("address", `%${area}%`)
      .limit(limit);

    if (error) {
      console.error("Failed to search restaurants by area:", error);
      return [];
    }

    return data || [];
  }

  // Get restaurants by cuisine type
  static async getRestaurantsByCuisine(cuisine: string, limit: number = 10) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .ilike("cuisine", `%${cuisine}%`)
      .order("rating", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get restaurants by cuisine:", error);
      return [];
    }

    return data || [];
  }

  // Get restaurants by price level
  static async getRestaurantsByPriceLevel(
    priceLevel: string,
    limit: number = 10
  ) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("price_level", priceLevel)
      .order("rating", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get restaurants by price level:", error);
      return [];
    }

    return data || [];
  }

  // Get user's conversation history
  static async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get user conversations: ${error.message}`);
    }

    return data || [];
  }

  // Check if user has saved a specific restaurant
  static async isRestaurantSaved(
    userId: string,
    restaurantId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_saved_restaurants")
      .select("id")
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking if restaurant is saved:", error);
      return false;
    }

    return !!data;
  }

  // Save a restaurant for a user
  static async saveRestaurant(userId: string, restaurantId: string) {
    const { data, error } = await supabase
      .from("user_saved_restaurants")
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save restaurant: ${error.message}`);
    }

    return data;
  }

  // Record a user's swipe on a restaurant
  static async recordSwipe(
    userId: string,
    restaurantId: string,
    direction: "left" | "right"
  ) {
    const { data, error } = await supabase
      .from("user_swiped_restaurants")
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        swiped_direction: direction,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record swipe: ${error.message}`);
    }

    return data;
  }
}
