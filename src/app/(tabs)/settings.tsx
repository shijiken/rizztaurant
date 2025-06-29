// src/app/(tabs)/settings.tsx
import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Stack } from "expo-router"; // If you want a header for this screen

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
