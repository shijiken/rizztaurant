// src/app/_layout.tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import AuthProvider from "../providers/AuthProvider";
import { SavedRestaurantsProvider } from "../providers/SavedRestaurantsProvider";
import { ThemeProvider, useTheme } from "../providers/ThemeProvider"; 
import { ThemedLayout } from "../components/ThemedLayout";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import InnerAppNavigator from "../components/InnerAppNavigator";

export { ErrorBoundary } from "expo-router";

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

function ThemedNavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

function RootLayoutNav() {
  console.log("RootLayoutNav: Component mounted and rendered.");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Wrap everything with your custom ThemeProvider first */}
      <ThemeProvider>
        <ThemedNavigationWrapper>
          <AuthProvider>
            <SavedRestaurantsProvider>
              <ThemedLayout>
                {/* Render the separated InnerAppNavigator component */}
                <InnerAppNavigator />
              </ThemedLayout>
            </SavedRestaurantsProvider>
          </AuthProvider>
        </ThemedNavigationWrapper>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}