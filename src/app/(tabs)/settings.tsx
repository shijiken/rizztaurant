// src/app/(tabs)/settings.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import React from "react";
import { Stack, router } from "expo-router"; // Import 'router' for navigation after sign out
import { useAuth } from "@/src/providers/AuthProvider"; // Assuming this path to your AuthProvider
import { Ionicons } from '@expo/vector-icons'; // For a nice icon on the button

export default function SettingsScreen() {
  const { session, signOut } = useAuth(); // Access both session and signOut

  const handleSignOut = async () => {
    // Optional: Add a confirmation dialog
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
              // Optionally navigate to a public screen (e.g., login) after sign out
              router.replace('/sign-in'); // Adjust this path if your login screen is different
            } catch (error: any) {
              console.error("Error signing out:", error.message);
              Alert.alert("Sign Out Error", "Failed to sign out. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Optional header - uncomment if you want a header */}
      {/* <Stack.Screen options={{ title: 'Settings' }} /> */}
      
      <Text style={styles.title}>Settings</Text>

      {session?.user?.email ? (
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
      ) : (
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.text}>You are not logged in.</Text>
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => router.replace('/sign-in')} // Navigate to login
          >
            <Text style={styles.loginPromptButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add other settings UI elements here if needed later */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '80%', // Make the container a bit wider
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    color: "#777",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20, // Add space below email and before button
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b30', // Red color for sign out
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notLoggedInContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loginPromptButton: {
    marginTop: 20,
    backgroundColor: '#007aff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  loginPromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: { // General text style for messages
    fontSize: 18,
    color: "#888",
    textAlign: 'center',
  },
});
