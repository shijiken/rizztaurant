// src/components/NoMoreCards.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NoMoreCardsProps {
  onReload: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

const NoMoreCards: React.FC<NoMoreCardsProps> = ({ onReload, onSignOut }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="restaurant-outline" size={60} color="#888" style={styles.icon} />
      <Text style={styles.title}>No More Restaurants!</Text>
      <Text style={styles.message}>
        You've swiped through all the restaurants in this area.
      </Text>
      <TouchableOpacity onPress={onReload} style={styles.reloadButton}>
        <Text style={styles.reloadButtonText}>Find More Restaurants</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Make it take full available space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // General padding
    backgroundColor: '#f8f8f8', // Light background
    // Removed absolute positioning and related shadows/radii as it will be a full-screen component
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24, // Slightly larger title for full-screen view
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: '#007aff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  reloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default NoMoreCards;
