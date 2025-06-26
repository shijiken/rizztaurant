// src/app/(tabs)/_layout.tsx
import React from "react";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for tab bar icons
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/components/useColorScheme";
import { useClientOnlyValue } from "@/src/components/useClientOnlyValue";

// Assuming supabase is accessible from a global location or passed down via context
// This import is needed for the logout button
import { supabase } from "@/src/lib/supabase"; // Adjust path if necessary

// Helper function for Tab Bar Icons using Ionicons
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray", // Match your AppNavigator's inactive tint
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true), // header shown if not on web client
      }}
    >
      {/* Tab for SwipeCardsScreen (now index.tsx) */}
      <Tabs.Screen
        name="index" // Matches the filename src/app/(tabs)/SwipeCards.tsx
        options={{
          title: "Discover", 
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "restaurant" : "restaurant-outline"}
              color={color}
            />
          ),
          // You can add header options specific to this tab if needed
          headerShown: true, // Example: Show header on this tab
          headerTitle: "Discover",
        }}
      />

      {/* Tab for SavedRestaurantsScreen (now SavedRestaurants.tsx) */}
      <Tabs.Screen
        name="SavedRestaurants" // Matches the filename src/app/(tabs)/SavedRestaurants.tsx
        options={{
          title: "Saved", // Matches your old "SavedTab" title
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "bookmark" : "bookmark-outline"}
              color={color}
            />
          ),
          headerShown: true, // Example: Show header on this tab
          headerTitle: "Your Saved Restaurants",
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await supabase.auth.signOut(); // Logout action
              }}
            >
              {({ pressed }) => (
                <Ionicons
                  name="log-out-outline" // Logout icon
                  size={25}
                  color={Colors[colorScheme ?? "light"].text} // Adjust color as needed
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        }}
      />

      {/* Tab for SettingsScreen (now settings.tsx) */}
      <Tabs.Screen
        name="settings" // Matches the filename src/app/(tabs)/settings.tsx
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "settings" : "settings-outline"}
              color={color}
            />
          ),
          headerShown: true, // Example: Show header on this tab
          headerTitle: "App Settings",
        }}
      />
    </Tabs>
  );
}
