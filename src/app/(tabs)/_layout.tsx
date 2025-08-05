// src/app/(tabs)/_layout.tsx
import React from "react";
import { Link, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; 
import { useClientOnlyValue } from "@/src/components/useClientOnlyValue";
import { useTheme } from "@/src/providers/ThemeProvider";


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
        tabBarInactiveTintColor: isDark ? theme.textTertiary : Colors.light.gray, 

        headerShown: useClientOnlyValue(false, true), 
        tabBarStyle: {
          backgroundColor: theme.surface, 
          borderTopColor: theme.border,
        },
      }}
    >

      <Tabs.Screen
        name="index" 
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "restaurant" : "restaurant-outline"}
              color={color}
            />
          ),
          headerShown: true, 
          headerTitle: "Discover",
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, 
        }}
      />

      <Tabs.Screen
        name="chatbot" 
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
            />
          ),
          headerShown: false, 
        }}
      />

      <Tabs.Screen
        name="SavedRestaurants" 
        options={{
          title: "Saved", 
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "bookmark" : "bookmark-outline"}
              color={color}
            />
          ),
          headerShown: true, 
          headerTitle: "Your Saved Restaurants",
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
        }}
      />

      {/* Tab for SettingsScreen (now settings.tsx) */}
      <Tabs.Screen
        name="settings" 
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "settings" : "settings-outline"}
              color={color}
            />
          ),
          headerShown: true, 
          headerTitle: "App Settings",
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
        }}
      />
    </Tabs>
  );
}

const Colors = {
  light: {
    gray: 'gray', 
  },
  dark: {
    gray: 'gray', 
  }
};