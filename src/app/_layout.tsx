// src/app/_layout.tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router"; // Keep Stack here if other Stack.Screens are added later in this file
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import AuthProvider from "../providers/AuthProvider"; // Only AuthProvider, useAuth is used in InnerAppNavigator
import SavedRestaurantsProvider from "../providers/SavedRestaurantsProvider";
import React from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native'; // Keep these imports if you use them elsewhere or remove if not needed

import InnerAppNavigator from '../components/InnerAppNavigator'; // <--- NEW IMPORT

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log("RootLayout: Component mounted and rendered.");
  const [loaded, error] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log("RootLayoutNav: Component mounted and rendered.");
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <SavedRestaurantsProvider>
            {/* Render the separated InnerAppNavigator component */}
            <InnerAppNavigator /> 
          </SavedRestaurantsProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}