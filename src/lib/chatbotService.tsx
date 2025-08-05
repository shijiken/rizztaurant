// src/lib/chatbotService.tsx
import { GroqService } from "../services/groqService";
import { ChatbotSupabaseService } from "../services/chatbotSupabaseService";
import { GooglePlacesService } from "./googlePlacesService";
import {
  ChatContext,
  GroqMessage,
  RestaurantSuggestion,
  UserPreferences,
} from "../types/Chat";

export class ChatbotService {
  private static conversationId: string | null = null;
  private static chatContext: ChatContext = {};
  private static userPreferences: UserPreferences | null = null;
  private static conversationHistory: GroqMessage[] = [];

  static async startNewConversation(userId: string): Promise<string> {
    try {
      const conversation = await ChatbotSupabaseService.createConversation(
        userId
      );
      this.conversationId = conversation.id;

      this.chatContext = {};
      this.conversationHistory = [];

      this.userPreferences =
        await ChatbotSupabaseService.analyzeUserPreferences(userId);

      const greeting = await this.generateGreeting(userId);

      this.conversationHistory.push({
        role: "assistant",
        content: greeting,
      });

      await ChatbotSupabaseService.addMessage(
        conversation.id,
        "assistant",
        greeting
      );

      return greeting;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }

  static async sendMessage(
    userId: string,
    message: string
  ): Promise<{
    response: string;
    suggestions?: RestaurantSuggestion[];
  }> {
    try {
      if (!this.conversationId) {
        throw new Error(
          "No active conversation. Please start a new conversation."
        );
      }

      this.conversationHistory.push({
        role: "user",
        content: message,
      });

      await ChatbotSupabaseService.addMessage(
        this.conversationId,
        "user",
        message
      );

      this.updateContextFromMessage(message);

      const shouldProvide =
        this.shouldProvideSuggestions() ||
        GroqService.shouldProvideRecommendations(this.conversationHistory) ||
        GroqService.isConversationRepetitive(this.conversationHistory);

      let suggestions: RestaurantSuggestion[] = [];

      const availableRestaurants = await this.getAvailableRestaurants();

      const response = await GroqService.generateChatbotResponse(
        this.conversationHistory,
        this.formatUserPreferences(),
        availableRestaurants
      );

      if (shouldProvide || this.responseIndicatesRecommendations(response)) {
        suggestions = await this.generateRestaurantSuggestions(userId);
      }

      this.conversationHistory.push({
        role: "assistant",
        content: response,
      });

      await ChatbotSupabaseService.addMessage(
        this.conversationId,
        "assistant",
        response
      );

      return { response, suggestions };
    } catch (error) {
      console.error("Error sending message:", error);

      const fallbackResponse =
        "I apologize, but I'm having trouble processing your request right now. Could you please try again or tell me what kind of food you're craving?";

      this.conversationHistory.push({
        role: "assistant",
        content: fallbackResponse,
      });

      return { response: fallbackResponse, suggestions: [] };
    }
  }

  private static async generateGreeting(userId: string): Promise<string> {
    const preferences = this.userPreferences;

    try {
      if (
        preferences &&
        (preferences.totalSaved > 0 || preferences.totalSwiped > 5)
      ) {
        const savedRestaurants =
          await ChatbotSupabaseService.getUserSavedRestaurants(userId);
        const recentSwipes = await ChatbotSupabaseService.getUserRecentSwipes(
          userId
        );

        return await GroqService.createPersonalizedGreeting(
          "there",
          savedRestaurants || [],
          recentSwipes || []
        );
      }
    } catch (error) {
      console.error("Error generating personalized greeting:", error);
    }

    const systemPrompt = `You are a friendly restaurant recommendation chatbot for Singapore. Generate a warm, welcoming greeting that:
1. Welcomes the user warmly
2. Briefly explains you help find great restaurants
3. Asks what they're in the mood for today
4. Keep it concise and friendly (2-3 sentences max)

${
  preferences
    ? `The user has some dining history: ${preferences.totalSaved} saved restaurants, ${preferences.likedCuisines.length} preferred cuisines.`
    : "This appears to be a new user."
}`;

    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate a greeting for this user." },
    ];

    return await GroqService.sendMessage(messages);
  }

  private static formatUserPreferences(): string {
    if (!this.userPreferences) return "No dining history available";

    const parts = [];

    if (this.userPreferences.likedCuisines.length > 0) {
      parts.push(
        `Liked cuisines: ${this.userPreferences.likedCuisines.join(", ")}`
      );
    }

    if (this.userPreferences.dislikedCuisines.length > 0) {
      parts.push(
        `Disliked cuisines: ${this.userPreferences.dislikedCuisines.join(", ")}`
      );
    }

    if (this.userPreferences.preferredPriceRanges.length > 0) {
      parts.push(
        `Preferred price ranges: ${this.userPreferences.preferredPriceRanges.join(
          ", "
        )}`
      );
    }

    parts.push(
      `Average rating preference: ${this.userPreferences.averageRating.toFixed(
        1
      )}`
    );
    parts.push(
      `Total saved: ${this.userPreferences.totalSaved}, Total swiped: ${this.userPreferences.totalSwiped}`
    );

    return parts.join("\n");
  }

  private static async getAvailableRestaurants(): Promise<any[]> {
    try {
      if (this.chatContext.area) {
        return await ChatbotSupabaseService.searchRestaurantsByArea(
          this.chatContext.area,
          15
        );
      }

      return await ChatbotSupabaseService.getPopularRestaurants(15);
    } catch (error) {
      console.error("Error getting available restaurants:", error);
      return [];
    }
  }

  private static responseIndicatesRecommendations(response: string): boolean {
    const indicators = [
      "let me find",
      "here are some",
      "i recommend",
      "perfect recommendations",
      "great options",
      "suggestions for you",
      "found some",
    ];

    const lowerResponse = response.toLowerCase();
    return indicators.some((indicator) => lowerResponse.includes(indicator));
  }

  private static updateContextFromMessage(message: string): void {
    const lowerMessage = message.toLowerCase();

    if (!this.chatContext.area) {
      const areaKeywords = [
        "orchard",
        "downtown",
        "cbd",
        "marina bay",
        "chinatown",
        "little india",
        "bugis",
        "clarke quay",
        "sentosa",
        "tampines",
        "jurong",
        "woodlands",
        "bedok",
        "ang mo kio",
        "toa payoh",
        "bishan",
        "serangoon",
        "hougang",
        "punggol",
        "sengkang",
        "clementi",
        "bukit timah",
        "novena",
        "dhoby ghaut",
        "city hall",
        "any area",
        "anywhere",
        "any location",
      ];

      for (const area of areaKeywords) {
        if (lowerMessage.includes(area)) {
          this.chatContext.area =
            area === "any area" ||
            area === "anywhere" ||
            area === "any location"
              ? "any area"
              : area;
          break;
        }
      }
    }

    if (!this.chatContext.budget) {
      if (
        lowerMessage.includes("cheap") ||
        lowerMessage.includes("budget") ||
        lowerMessage.includes("affordable") ||
        lowerMessage.includes("inexpensive") ||
        lowerMessage.includes("low cost")
      ) {
        this.chatContext.budget = "cheap";
      } else if (
        lowerMessage.includes("expensive") ||
        lowerMessage.includes("fine dining") ||
        lowerMessage.includes("upscale") ||
        lowerMessage.includes("high end") ||
        lowerMessage.includes("premium")
      ) {
        this.chatContext.budget = "expensive";
      } else if (
        lowerMessage.includes("moderate") ||
        lowerMessage.includes("mid-range") ||
        lowerMessage.includes("medium price") ||
        lowerMessage.includes("reasonable")
      ) {
        this.chatContext.budget = "moderate";
      }
    }

    if (!this.chatContext.travelTime) {
      if (lowerMessage.includes("15") || lowerMessage.includes("fifteen")) {
        this.chatContext.travelTime = "15min";
      } else if (
        lowerMessage.includes("30") ||
        lowerMessage.includes("thirty")
      ) {
        this.chatContext.travelTime = "30min";
      } else if (
        lowerMessage.includes("1 hour") ||
        lowerMessage.includes("one hour") ||
        lowerMessage.includes("an hour")
      ) {
        this.chatContext.travelTime = "1hour";
      } else if (
        lowerMessage.includes("anywhere") ||
        lowerMessage.includes("any distance") ||
        lowerMessage.includes("don't mind")
      ) {
        this.chatContext.travelTime = "anywhere";
      }
    }

    if (!this.chatContext.mood) {
      const cuisines = [
        "chinese",
        "italian",
        "japanese",
        "korean",
        "thai",
        "vietnamese",
        "indian",
        "mexican",
        "american",
        "french",
        "spanish",
        "greek",
        "mediterranean",
        "middle eastern",
        "turkish",
        "lebanese",
        "singaporean",
        "malaysian",
        "indonesian",
        "filipino",
        "western",
        "fusion",
        "international",
        "local",
        "halal",
        "vegetarian",
        "vegan",
      ];

      for (const cuisine of cuisines) {
        if (lowerMessage.includes(cuisine)) {
          this.chatContext.mood = cuisine;
          break;
        }
      }

      const foodMoods = [
        "spicy",
        "sweet",
        "savory",
        "healthy",
        "comfort food",
        "seafood",
        "meat",
        "bbq",
        "grilled",
        "fried",
        "steamed",
        "soup",
        "noodles",
        "rice",
        "pasta",
        "pizza",
        "burger",
        "sandwich",
        "salad",
      ];

      if (!this.chatContext.mood) {
        for (const mood of foodMoods) {
          if (lowerMessage.includes(mood)) {
            this.chatContext.mood = mood;
            break;
          }
        }
      }
    }

    if (!this.chatContext.occasion) {
      if (lowerMessage.includes("date") || lowerMessage.includes("romantic")) {
        this.chatContext.occasion = "date";
      } else if (
        lowerMessage.includes("family") ||
        lowerMessage.includes("kids") ||
        lowerMessage.includes("children")
      ) {
        this.chatContext.occasion = "family";
      } else if (
        lowerMessage.includes("business") ||
        lowerMessage.includes("work") ||
        lowerMessage.includes("meeting") ||
        lowerMessage.includes("client")
      ) {
        this.chatContext.occasion = "business";
      } else if (
        lowerMessage.includes("celebration") ||
        lowerMessage.includes("birthday") ||
        lowerMessage.includes("anniversary") ||
        lowerMessage.includes("special")
      ) {
        this.chatContext.occasion = "celebration";
      } else if (
        lowerMessage.includes("casual") ||
        lowerMessage.includes("quick") ||
        lowerMessage.includes("simple") ||
        lowerMessage.includes("relaxed")
      ) {
        this.chatContext.occasion = "casual";
      }
    }
  }

  private static shouldProvideSuggestions(): boolean {
    const context = this.chatContext;

    const hasArea = !!(context.area && context.area !== "any area");
    const hasPreference = !!(
      context.mood ||
      context.budget ||
      context.occasion
    );
    const hasBasicInfo = !!(context.area || context.budget);

    return (
      (hasArea && hasPreference) ||
      (hasBasicInfo && this.conversationHistory.length >= 6) ||
      (!!context.mood && this.conversationHistory.length >= 4)
    );
  }

  private static async generateRestaurantSuggestions(
    userId: string
  ): Promise<RestaurantSuggestion[]> {
    try {
      const suggestions: RestaurantSuggestion[] = [];

      const searchArea =
        this.chatContext.area === "any area" ? "" : this.chatContext.area;

      if (searchArea) {
        const existingRestaurants =
          await ChatbotSupabaseService.searchRestaurantsByArea(searchArea, 8);
        suggestions.push(
          ...existingRestaurants.map((r) => ({ ...r, isNewRestaurant: false }))
        );
      } else {
        const popularRestaurants =
          await ChatbotSupabaseService.getPopularRestaurants(8);
        suggestions.push(
          ...popularRestaurants.map((r) => ({ ...r, isNewRestaurant: false }))
        );
      }

      if (
        this.chatContext.area &&
        this.chatContext.area !== "any area" &&
        suggestions.length < 6
      ) {
        try {
          const location = await GooglePlacesService.geocodeArea(
            this.chatContext.area
          );

          if (location) {
            let searchQuery = "restaurant";
            if (this.chatContext.mood && this.chatContext.mood !== "any") {
              searchQuery = `${this.chatContext.mood} restaurant`;
            }

            let radius = 5000;
            if (this.chatContext.travelTime === "15min") radius = 2000;
            else if (this.chatContext.travelTime === "30min") radius = 5000;
            else if (this.chatContext.travelTime === "1hour") radius = 15000;
            else if (this.chatContext.travelTime === "anywhere") radius = 50000;

            const newRestaurants =
              await GooglePlacesService.searchRestaurantsByText(
                `${searchQuery} ${this.chatContext.area}`,
                location,
                radius
              );

            for (const restaurant of newRestaurants.slice(0, 4)) {
              await ChatbotSupabaseService.addRestaurant(restaurant);
              suggestions.push(restaurant);
            }
          }
        } catch (error) {
          console.error("Error fetching external restaurants:", error);
        }
      }

      let filteredSuggestions =
        this.filterSuggestionsByPreferences(suggestions);

      if (filteredSuggestions.length < 3) {
        filteredSuggestions = this.filterSuggestionsByPreferences(
          suggestions,
          true
        );
      }

      return filteredSuggestions.slice(0, 6);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return [];
    }
  }

  private static filterSuggestionsByPreferences(
    suggestions: RestaurantSuggestion[],
    relaxed: boolean = false
  ): RestaurantSuggestion[] {
    let filtered = [...suggestions];

    if (this.userPreferences && !relaxed) {
      filtered = filtered.filter((restaurant) => {
        if (
          restaurant.cuisine &&
          this.userPreferences!.dislikedCuisines.includes(
            restaurant.cuisine.toLowerCase()
          )
        ) {
          return false;
        }

        if (this.chatContext.budget && restaurant.price_level) {
          const budgetMap = {
            cheap: ["$", "Free"],
            moderate: ["$$", "$$$"],
            expensive: ["$$$", "$$$$"],
          };

          if (
            this.chatContext.budget !== "any" &&
            !budgetMap[this.chatContext.budget].includes(restaurant.price_level)
          ) {
            return false;
          }
        }

        if (
          this.userPreferences!.averageRating > 4.0 &&
          restaurant.rating &&
          restaurant.rating < 3.5
        ) {
          return false;
        }

        return true;
      });
    }

    return filtered.sort((a, b) => {
      const aMoodMatch =
        this.chatContext.mood &&
        a.cuisine?.toLowerCase().includes(this.chatContext.mood.toLowerCase());
      const bMoodMatch =
        this.chatContext.mood &&
        b.cuisine?.toLowerCase().includes(this.chatContext.mood.toLowerCase());

      if (aMoodMatch && !bMoodMatch) return -1;
      if (!aMoodMatch && bMoodMatch) return 1;

      if (a.rating && b.rating) {
        return b.rating - a.rating;
      }

      return 0;
    });
  }

  static getCurrentContext(): ChatContext {
    return { ...this.chatContext };
  }

  static getConversationHistory(): GroqMessage[] {
    return [...this.conversationHistory];
  }

  static resetConversation(): void {
    this.conversationId = null;
    this.chatContext = {};
    this.userPreferences = null;
    this.conversationHistory = [];
  }
}

