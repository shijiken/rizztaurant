// src/app/(tabs)/_layout.tsx
import React from "react";
import { Link, Tabs } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for tab bar icons
// import Colors from "@/src/constants/Colors"; // <-- REMOVE THIS IMPORT
// import { useColorScheme } from "@/src/components/useColorScheme"; // <-- REMOVE THIS IMPORT
import { useClientOnlyValue } from "@/src/components/useClientOnlyValue";

// Import your custom useTheme hook
import { useTheme } from "@/src/providers/ThemeProvider";
import { supabase } from "@/src/lib/supabase"; 

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {

  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{

        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? theme.textTertiary : Colors.light.gray, // Adjust inactive tint based on theme

        headerShown: useClientOnlyValue(false, true), // header shown if not on web client
        tabBarStyle: {
          backgroundColor: theme.surface, // Apply theme's surface color to tab bar background
          borderTopColor: theme.border, // Apply theme's border color
        },
      }}
    >

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
          headerShown: true, // Example: Show header on this tab
          headerTitle: "Discover",
          // Apply header styling based on theme
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, // Text color for header title
        }}
      />

      {/* Tab for Chatbot */}
      <Tabs.Screen
        name="chatbot" // Matches the filename src/app/(tabs)/chatbot.tsx
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
            />
          ),
          headerShown: false, // Hide header since chatbot has its own header
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
          // Apply header styling based on theme
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, // Text color for header title
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
                  color={theme.text} // Use theme.text for icon color
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
          // Apply header styling based on theme
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, // Text color for header title
        }}
      />
    </Tabs>
  );
}

const Colors = {
  light: {
    gray: 'gray', // Define a default gray for light mode inactive tint
  },
  dark: {
    gray: 'gray', // Define a default gray for dark mode inactive tint
  }
};