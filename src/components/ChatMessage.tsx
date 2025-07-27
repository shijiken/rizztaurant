// src/components/ChatMessage.tsx

import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Message } from "../types/Chat";
import RestaurantSuggestionCard from "./RestaurantSuggestionCard";

interface ChatMessageProps {
  message: Message;
  onSaveRestaurant?: (restaurantId: string) => void;
  onShareRestaurant?: (restaurant: any) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSaveRestaurant,
  onShareRestaurant,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isUser = message.role === "user";

  return (
    <View style={styles.messageContainer}>
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.assistantMessage,
          {
            backgroundColor: isUser
              ? "#007aff"
              : isDark
              ? "#2c2c2e"
              : "#f0f0f0",
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isUser ? "#fff" : isDark ? "#fff" : "#333",
            },
          ]}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  assistantMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginTop: 8,
    alignSelf: "flex-start",
    width: "100%",
  },
});

export default ChatMessage;
