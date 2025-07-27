// src/components/RestaurantSuggestionCard.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSuggestion } from "../types/Chat";

interface RestaurantSuggestionCardProps {
  restaurant: RestaurantSuggestion;
  onSave?: (restaurantId: string) => void;
  onShare?: (restaurant: RestaurantSuggestion) => void;
  isDark: boolean;
}

const RestaurantSuggestionCard: React.FC<RestaurantSuggestionCardProps> = ({
  restaurant,
  onSave,
  onShare,
  isDark,
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave(restaurant.id);
    }
  };

  const handleShare = async () => {
    try {
      const ratingText = restaurant.rating
        ? `⭐ ${restaurant.rating.toFixed(1)}`
        : "";
      const priceText = restaurant.price_level
        ? `💰 ${restaurant.price_level}`
        : "";
      const cuisineText = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : "";

      const shareMessage =
        `🍴 Check out this restaurant recommendation!\n\n` +
        `📍 ${restaurant.name}\n` +
        `${restaurant.address}\n\n` +
        `${ratingText}${ratingText && priceText ? " • " : ""}${priceText}\n` +
        `${cuisineText}\n\n` +
        `${restaurant.maps_url ? `View on Maps: ${restaurant.maps_url}` : ""}`;

      const result = await Share.share({
        message: shareMessage,
        title: `Check out ${restaurant.name}!`,
      });

      if (onShare) {
        onShare(restaurant);
      }
    } catch (error) {
      console.error("Error sharing restaurant:", error);
      Alert.alert("Error", "Failed to share restaurant information");
    }
  };

  const handleViewOnMaps = () => {
    if (restaurant.maps_url) {
      Linking.openURL(restaurant.maps_url).catch((err) =>
        console.error("Failed to open Maps URL:", err)
      );
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1c1c1e" : "#fff",
          borderColor: isDark ? "#3a3a3c" : "#e0e0e0",
        },
      ]}
    >
      {/* Restaurant Image */}
      {restaurant.image_url && (
        <Image
          source={{ uri: restaurant.image_url }}
          style={styles.restaurantImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardContent}>
        {/* Restaurant Name */}
        <Text
          style={[styles.restaurantName, { color: isDark ? "#fff" : "#333" }]}
          numberOfLines={2}
        >
          {restaurant.name}
          {restaurant.isNewRestaurant && (
            <Text style={styles.newBadge}> ✨ NEW</Text>
          )}
        </Text>

        {/* Address */}
        <Text
          style={[
            styles.restaurantAddress,
            { color: isDark ? "#aaa" : "#666" },
          ]}
          numberOfLines={2}
        >
          {restaurant.address}
        </Text>

        {/* Restaurant Details */}
        <View style={styles.detailsRow}>
          {restaurant.cuisine && (
            <Text
              style={[styles.detailText, { color: isDark ? "#bbb" : "#555" }]}
            >
              {restaurant.cuisine}
            </Text>
          )}

          {restaurant.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text
                style={[styles.detailText, { color: isDark ? "#bbb" : "#555" }]}
              >
                {restaurant.rating.toFixed(1)}
                {restaurant.user_ratings_total && (
                  <Text style={styles.ratingsCount}>
                    {" "}
                    ({restaurant.user_ratings_total})
                  </Text>
                )}
              </Text>
            </View>
          )}

          {restaurant.price_level && (
            <Text
              style={[styles.detailText, { color: isDark ? "#bbb" : "#555" }]}
            >
              {restaurant.price_level}
            </Text>
          )}

          {restaurant.distance_km && (
            <Text
              style={[styles.detailText, { color: isDark ? "#bbb" : "#555" }]}
            >
              {restaurant.distance_km.toFixed(1)}km away
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {/* View on Maps */}
          {restaurant.maps_url && (
            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleViewOnMaps}
            >
              <Ionicons name="map" size={16} color="#007aff" />
              <Text style={styles.mapButtonText}>Maps</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons Container */}
          <View style={styles.rightActions}>
            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark ? "#1a3a4f" : "#e6f2ff",
                },
              ]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#007aff" />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark ? "#1f3a1f" : "#e6ffe6",
                },
              ]}
              onPress={handleSave}
            >
              <Ionicons name="bookmark-outline" size={20} color="#28a745" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: "100%",
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    lineHeight: 24,
  },
  newBadge: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "600",
  },
  restaurantAddress: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  detailText: {
    fontSize: 13,
    marginRight: 12,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  ratingsCount: {
    fontSize: 11,
    opacity: 0.8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  mapButtonText: {
    fontSize: 14,
    color: "#007aff",
    marginLeft: 4,
    fontWeight: "500",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RestaurantSuggestionCard;
