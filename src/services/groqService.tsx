// src/lib/groqService.ts

import { GroqMessage, GroqResponse } from "../types/Chat";
import Constants from "expo-constants";

const GROQ_API_KEY = Constants.expoConfig?.extra?.expoPublicGroqAPIKey;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqService {
  static async sendMessage(messages: GroqMessage[]): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error(
        "Groq API key not found. Please add EXPO_PUBLIC_GROQ_API_KEY to your environment variables."
      );
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          max_tokens: 1200, // Increased for more comprehensive responses
          temperature: 0.6, // Slightly lower for more consistent responses
          top_p: 0.9,
          stop: ["\n\nUser:", "\n\nAssistant:", "---"],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        let errorMessage = errorData.error?.message || "Unknown error";

        if (errorData.error?.code === "model_not_found") {
          errorMessage =
            "The AI model is currently unavailable. Please try again later.";
        } else if (errorData.error?.code === "rate_limit_exceeded") {
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
        } else if (errorData.error?.code === "invalid_api_key") {
          errorMessage = "API configuration error. Please contact support.";
        }

        throw new Error(`Groq API error: ${response.status} - ${errorMessage}`);
      }

      const data: GroqResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from Groq API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling Groq API:", error);

      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Failed to get response from AI service");
      }
    }
  }

  static async analyzeUserPreferences(
    savedRestaurants: any[],
    swipedRestaurants: any[]
  ): Promise<string> {
    const likedRestaurants = swipedRestaurants.filter(
      (r) => r.swiped_direction === "right"
    );
    const dislikedRestaurants = swipedRestaurants.filter(
      (r) => r.swiped_direction === "left"
    );

    const analysisPrompt = `
Analyze the following user's restaurant preferences and provide a concise summary:

SAVED RESTAURANTS (${savedRestaurants.length}):
${savedRestaurants
  .map(
    (r) => `- ${r.name}: ${r.cuisine}, ${r.price_level}, Rating: ${r.rating}`
  )
  .join("\n")}

LIKED RESTAURANTS (swiped right - ${likedRestaurants.length}):
${likedRestaurants
  .map(
    (r) =>
      `- ${r.restaurant?.name || "Unknown"}: ${r.restaurant?.cuisine}, ${
        r.restaurant?.price_level
      }`
  )
  .join("\n")}

DISLIKED RESTAURANTS (swiped left - ${dislikedRestaurants.length}):
${dislikedRestaurants
  .map(
    (r) =>
      `- ${r.restaurant?.name || "Unknown"}: ${r.restaurant?.cuisine}, ${
        r.restaurant?.price_level
      }`
  )
  .join("\n")}

Please provide a brief analysis of this user's preferences including:
1. Preferred cuisines
2. Price level preferences  
3. Any patterns you notice
4. What they tend to avoid

Keep the response concise and actionable for making restaurant recommendations.
`;

    const messages: GroqMessage[] = [
      {
        role: "system",
        content:
          "You are a restaurant preference analyzer. Provide concise, actionable insights about user dining preferences based on their restaurant history.",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Enhanced chatbot response that handles conversation flow and prevents repetition
   */
  static async generateChatbotResponse(
    conversationHistory: GroqMessage[],
    userPreferences?: string,
    availableRestaurants?: any[]
  ): Promise<string> {
    // Analyze conversation to extract context and avoid repetition
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Extract information already gathered
    const gatheredInfo = this.extractGatheredInfo(conversationHistory);

    const systemPrompt = `You are a friendly restaurant recommendation chatbot for Singapore. Your goal is to help users find great restaurants efficiently.

CRITICAL RULES:
1. NEVER repeat questions you've already asked in this conversation
2. Track what information you already have and DON'T ask for it again
3. If you have enough info (cuisine preference, area, budget, occasion), provide recommendations immediately
4. If initial preferences are too restrictive and you can't find good matches, suggest expanding to similar cuisines or nearby areas
5. Be conversational but efficient - don't drag out the question phase
6. After 3-4 exchanges, you should have enough info to make recommendations

INFORMATION ALREADY GATHERED:
${this.formatGatheredInfo(gatheredInfo)}

CONVERSATION FLOW GUIDELINES:
- If user mentions a cuisine → ask about area/location (if not provided)
- If user mentions area → ask about budget or occasion (if not provided)  
- If user mentions budget → ask about occasion or dietary needs (if not provided)
- If you have cuisine + area + budget/occasion → PROVIDE RECOMMENDATIONS
- If no good matches for their exact criteria → suggest similar options and explain why

FLEXIBILITY RULES:
- If they want Mexican but you only find 1-2 options → suggest Tex-Mex, Latin American, or fusion options
- If they want a specific area but limited options → suggest nearby areas
- If their budget is too restrictive → gently suggest slightly higher options with good value
- Always explain your reasoning when suggesting alternatives

${userPreferences ? `USER'S DINING HISTORY: ${userPreferences}` : ""}

${
  availableRestaurants && availableRestaurants.length > 0
    ? `
AVAILABLE RESTAURANTS TO REFERENCE:
${availableRestaurants
  .slice(0, 15)
  .map(
    (r) =>
      `- ${r.name}: ${r.cuisine}, ${r.price_level}, ${r.rating}/5, ${
        r.address || "Singapore"
      }`
  )
  .join("\n")}
`
    : ""
}

Respond naturally and conversationally. Focus on being helpful and efficient.`;

    const messages: GroqMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory.slice(-6), // Include recent conversation context
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Extract information that has already been gathered from the conversation
   */
  private static extractGatheredInfo(conversationHistory: GroqMessage[]): any {
    const info: any = {
      cuisine: null,
      area: null,
      budget: null,
      occasion: null,
      askedQuestions: [],
    };

    const conversationText = conversationHistory
      .map((msg) => msg.content.toLowerCase())
      .join(" ");

    // Extract cuisine preferences
    if (conversationText.includes("mexican")) info.cuisine = "Mexican";
    if (conversationText.includes("chinese")) info.cuisine = "Chinese";
    if (conversationText.includes("italian")) info.cuisine = "Italian";
    if (conversationText.includes("japanese")) info.cuisine = "Japanese";
    if (conversationText.includes("indian")) info.cuisine = "Indian";

    // Extract area preferences
    if (conversationText.includes("tampines")) info.area = "Tampines";
    if (conversationText.includes("orchard")) info.area = "Orchard";
    if (
      conversationText.includes("cbd") ||
      conversationText.includes("raffles place")
    )
      info.area = "CBD";
    if (
      conversationText.includes("any area") ||
      conversationText.includes("anywhere")
    )
      info.area = "Any area";

    // Extract budget preferences
    if (conversationText.includes("cheap")) info.budget = "Cheap";
    if (conversationText.includes("moderate")) info.budget = "Moderate";
    if (conversationText.includes("expensive")) info.budget = "Expensive";

    // Extract occasion
    if (conversationText.includes("date")) info.occasion = "Date";
    if (conversationText.includes("family")) info.occasion = "Family meal";
    if (conversationText.includes("business")) info.occasion = "Business meal";
    if (conversationText.includes("casual")) info.occasion = "Casual dining";

    // Track what questions were asked
    conversationHistory.forEach((msg) => {
      if (msg.role === "assistant") {
        const content = msg.content.toLowerCase();
        if (
          content.includes("which area") ||
          content.includes("where would you like")
        ) {
          info.askedQuestions.push("area");
        }
        if (
          content.includes("budget") ||
          content.includes("cheap, moderate, or expensive")
        ) {
          info.askedQuestions.push("budget");
        }
        if (
          content.includes("occasion") ||
          content.includes("what's the occasion")
        ) {
          info.askedQuestions.push("occasion");
        }
        if (content.includes("what kind of") || content.includes("cuisine")) {
          info.askedQuestions.push("cuisine");
        }
      }
    });

    return info;
  }

  /**
   * Format gathered information for the system prompt
   */
  private static formatGatheredInfo(info: any): string {
    const parts = [];

    if (info.cuisine) parts.push(`Cuisine: ${info.cuisine}`);
    if (info.area) parts.push(`Area: ${info.area}`);
    if (info.budget) parts.push(`Budget: ${info.budget}`);
    if (info.occasion) parts.push(`Occasion: ${info.occasion}`);

    if (info.askedQuestions.length > 0) {
      parts.push(`Already asked about: ${info.askedQuestions.join(", ")}`);
    }

    return parts.length > 0
      ? parts.join("\n")
      : "No specific preferences gathered yet";
  }

  /**
   * Create a personalized greeting message for the user based on their restaurant history
   */
  static async createPersonalizedGreeting(
    username: string,
    savedRestaurants: any[],
    recentSwipes: any[]
  ): Promise<string> {
    const greetingPrompt = `
Create a warm, personalized greeting for a restaurant recommendation chatbot user named ${username}.

User's restaurant activity:
- Saved restaurants: ${savedRestaurants.length}
- Recent swipes: ${recentSwipes.length}

The greeting should:
1. Welcome them back warmly
2. Briefly acknowledge their restaurant activity
3. Ask what they're in the mood for today
4. Keep it conversational and friendly (2-3 sentences max)

Don't mention specific restaurant names, just reference their general activity level.
`;

    const messages: GroqMessage[] = [
      {
        role: "system",
        content:
          "You are a friendly restaurant recommendation assistant. Create warm, personalized greetings that make users feel welcomed and understood.",
      },
      {
        role: "user",
        content: greetingPrompt,
      },
    ];

    return await this.sendMessage(messages);
  }

  /**
   * Check if enough information has been gathered to make recommendations
   */
  static shouldProvideRecommendations(
    conversationHistory: GroqMessage[]
  ): boolean {
    const info = this.extractGatheredInfo(conversationHistory);

    // Need at least cuisine preference and either area or budget
    return !!(info.cuisine && (info.area || info.budget));
  }

  /**
   * Check if the conversation is getting repetitive
   */
  static isConversationRepetitive(conversationHistory: GroqMessage[]): boolean {
    if (conversationHistory.length < 4) return false;

    const recentAssistantMessages = conversationHistory
      .filter((msg) => msg.role === "assistant")
      .slice(-3)
      .map((msg) => msg.content.toLowerCase());

    // Check for similar questions being asked repeatedly
    const questionKeywords = [
      "which area",
      "budget preference",
      "what kind of",
      "occasion",
    ];

    return questionKeywords.some(
      (keyword) =>
        recentAssistantMessages.filter((msg) => msg.includes(keyword)).length >=
        2
    );
  }

  /**
   * Check if the Groq service is available
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      const testMessages: GroqMessage[] = [
        {
          role: "user",
          content: "Hello",
        },
      ];

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: testMessages,
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Groq health check failed:", error);
      return false;
    }
  }
}
