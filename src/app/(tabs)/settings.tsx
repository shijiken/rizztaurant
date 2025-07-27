// src/app/(tabs)/settings.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import React from "react";
import { Stack, router } from "expo-router";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { theme, themeMode, isDark, setThemeMode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              await signOut();
              console.log("User signed out successfully.");
              router.replace("/sign-in");
            } catch (error: any) {
              console.error("Error signing out:", error.message);
              Alert.alert(
                "Sign Out Error",
                "Failed to sign out. Please try again."
              );
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case "system":
        return `System (${isDark ? "Dark" : "Light"})`;
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  const handleThemePress = () => {
    Alert.alert(
      "Theme Settings",
      "Choose your preferred theme",
      [
        {
          text: "System",
          onPress: () => setThemeMode("system"),
        },
        {
          text: "Light",
          onPress: () => setThemeMode("light"),
        },
        {
          text: "Dark",
          onPress: () => setThemeMode("dark"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />

      {session?.user?.email ? (
        <View style={styles.contentContainer}>
          {/* User Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Logged in as:</Text>
            <Text style={styles.emailText}>{session.user.email}</Text>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Theme Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={handleThemePress}
            >
              <View style={styles.themeOptionLeft}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.themeOptionText}>Theme</Text>
              </View>
              <View style={styles.themeOptionRight}>
                <Text style={styles.themeValueText}>
                  {getThemeDisplayText()}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textTertiary}
                />
              </View>
            </TouchableOpacity>

            {/* Quick Toggle Button */}
            <TouchableOpacity
              style={styles.quickToggleButton}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={20}
                color={theme.primary}
              />
              <Text style={styles.quickToggleText}>
                Switch to {isDark ? "Light" : "Dark"} Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.text}>You are not logged in.</Text>
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => router.replace("/sign-in")}
          >
            <Text style={styles.loginPromptButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contentContainer: {
      flex: 1,
      padding: 20,
    },
    infoContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 5,
    },
    emailText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 20,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.error,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      shadowColor: theme.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    signOutButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    sectionContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
    },
    themeOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    themeOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    themeOptionText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    themeOptionRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    themeValueText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginRight: 8,
    },
    quickToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickToggleText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
      fontWeight: "600",
    },
    notLoggedInContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loginPromptButton: {
      marginTop: 20,
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    loginPromptButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    text: {
      fontSize: 18,
      color: theme.textTertiary,
      textAlign: "center",
    },
  });
