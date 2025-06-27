// src/app/(tabs)/index.styles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get("window").width;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? 25 : 0, // Add padding for Android status bar
    backgroundColor: '#ececec', // Consistent background color
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6347",
    textAlign: "center",
    marginHorizontal: 20,
  },
  retryText: {
    marginTop: 5,
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginHorizontal: 20,
  },
  card: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: "70%", // Adjust height as needed
    borderRadius: 20,
    overflow: "hidden", // Ensure border radius clips content
    backgroundColor: "white", // Ensure cards have a background
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});