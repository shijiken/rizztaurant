// src/screens/Chatbot.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Message, RestaurantSuggestion } from "../../types/Chat"
import { ChatbotService } from "../../lib/chatbotService"
import { ChatbotSupabaseService } from "../../services/chatbotSupabaseService";
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../providers/AuthProvider"
import ChatMessage from "../../components/ChatMessage"

const Chatbot: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { session, profile, loading: authLoading } = useAuth();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Get userId from session
  const userId = session?.user?.id || null;

  // Start new conversation
  const startNewConversation = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const greeting = await ChatbotService.startNewConversation(userId);

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        conversation_id: "current",
        role: "assistant",
        content: greeting,
        created_at: new Date().toISOString(),
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send user message
  const sendMessage = async () => {
    if (!userId || !inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: "current",
      role: "user",
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    // Add user message to state immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom after adding user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await ChatbotService.sendMessage(
        userId,
        userMessage.content
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: "current",
        role: "assistant",
        content: response.response,
        created_at: new Date().toISOString(),
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom after adding assistant message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: "current",
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle restaurant save
  const handleSaveRestaurant = async (restaurantId: string) => {
    if (!userId) return;

    try {
      // Find the restaurant in current suggestions
      let restaurantToSave: RestaurantSuggestion | undefined;

      for (const message of messages) {
        if (message.suggestions) {
          restaurantToSave = message.suggestions.find(
            (r) => r.id === restaurantId
          );
          if (restaurantToSave) break;
        }
      }

      if (!restaurantToSave) {
        Alert.alert("Error", "Restaurant not found");
        return;
      }

      // Add to database if it's a new restaurant
      if (restaurantToSave.isNewRestaurant) {
        await ChatbotSupabaseService.addRestaurant({
          id: restaurantToSave.id,
          name: restaurantToSave.name,
          address: restaurantToSave.address,
          cuisine: restaurantToSave.cuisine,
          rating: restaurantToSave.rating,
          price_level: restaurantToSave.price_level,
          image_url: restaurantToSave.image_url,
          maps_url: restaurantToSave.maps_url,
          latitude: restaurantToSave.latitude,
          longitude: restaurantToSave.longitude,
          user_ratings_total: restaurantToSave.user_ratings_total,
          distance_km: restaurantToSave.distance_km,
        });
      }

      // Save to user's saved restaurants
      const { error } = await supabase.from("user_saved_restaurants").insert({
        user_id: userId,
        restaurant_id: restaurantId,
      });

      if (error) {
        console.error("Error saving restaurant:", error);
        Alert.alert("Error", "Failed to save restaurant. Please try again.");
        return;
      }

      Alert.alert(
        "Success! 🎉",
        `${restaurantToSave.name} has been saved to your favorites!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error saving restaurant:", error);
      Alert.alert("Error", "Failed to save restaurant. Please try again.");
    }
  };

  // Handle restaurant share
  const handleShareRestaurant = (restaurant: RestaurantSuggestion) => {
    // The sharing functionality is already handled in RestaurantSuggestionCard
    // This is just a callback if we need to track sharing events
    console.log("Restaurant shared:", restaurant.name);
  };

  // Reset conversation
  const resetConversation = () => {
    Alert.alert(
      "New Conversation",
      "Start a new conversation? This will clear your current chat.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start New",
          onPress: () => {
            ChatbotService.resetConversation();
            setMessages([]);
            startNewConversation();
          },
        },
      ]
    );
  };

  // Show loading screen while auth is loading or user is not authenticated
  if (authLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: isDark ? "#1c1c1e" : "#f8f9fa" },
          ]}
        >
          <Text
            style={[styles.headerTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            Restaurant Chat
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text
            style={[styles.loadingText, { color: isDark ? "#aaa" : "#666" }]}
          >
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  // Show error if user is not authenticated
  if (!session || !userId) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: isDark ? "#1c1c1e" : "#f8f9fa" },
          ]}
        >
          <Text
            style={[styles.headerTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            Restaurant Chat
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons
            name="person-outline"
            size={64}
            color={isDark ? "#666" : "#ccc"}
          />
          <Text
            style={[styles.errorTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            Authentication Required
          </Text>
          <Text
            style={[styles.errorSubtitle, { color: isDark ? "#aaa" : "#666" }]}
          >
            Please sign in to use the restaurant chat feature.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#1c1c1e" : "#f8f9fa" },
        ]}
      >
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#333" }]}>
          Rizztaurant Chatbot
        </Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetConversation}
        >
          <Ionicons name="refresh" size={24} color="#007aff" />
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={isDark ? "#666" : "#ccc"}
            />
            <Text
              style={[styles.welcomeTitle, { color: isDark ? "#fff" : "#333" }]}
            >
              Welcome to Rizztaurant Chatbot!
            </Text>
            <Text
              style={[
                styles.welcomeSubtitle,
                { color: isDark ? "#aaa" : "#666" },
              ]}
            >
              I'll help you discover amazing restaurants based on your
              preferences. Tap "Start Conversation" to begin!
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={startNewConversation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.startButtonText}>Start Conversation</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSaveRestaurant={handleSaveRestaurant}
              onShareRestaurant={handleShareRestaurant}
            />
          ))
        )}

        {/* Loading indicator when AI is thinking */}
        {isLoading && messages.length > 0 && (
          <View style={styles.loadingContainer}>
            <View
              style={[
                styles.loadingBubble,
                { backgroundColor: isDark ? "#2c2c2e" : "#f0f0f0" },
              ]}
            >
              <ActivityIndicator
                color={isDark ? "#fff" : "#666"}
                size="small"
              />
              <Text
                style={[
                  styles.loadingMessage,
                  { color: isDark ? "#aaa" : "#666" },
                ]}
              >
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      {messages.length > 0 && (
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f8f9fa",
              borderTopColor: isDark ? "#3a3a3c" : "#e0e0e0",
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: isDark ? "#2c2c2e" : "#fff" },
            ]}
          >
            <TextInput
              ref={textInputRef}
              style={[styles.textInput, { color: isDark ? "#fff" : "#333" }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  opacity: inputText.trim() && !isLoading ? 1 : 0.5,
                },
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  resetButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: "#007aff",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  loadingBubble: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "80%",
  },
  loadingMessage: {
    fontSize: 16,
    marginLeft: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: "#007aff",
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    marginBottom: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default Chatbot;
