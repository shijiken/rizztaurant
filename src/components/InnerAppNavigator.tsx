// src/navigation/InnerAppNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../providers/AuthProvider'; 

export default function InnerAppNavigator() {
  const { session, loading: authLoading } = useAuth(); 
  console.log("InnerAppNavigator: authLoading state is:", authLoading, "Session exists:", !!session);

  if (authLoading) {
    console.log("InnerAppNavigator: Displaying 'Checking authentication...' screen.");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={{ marginTop: 10 }}>Checking authentication...</Text>
      </View>
    );
  }

  // Once authLoading is false, then we render the actual navigation stack
  console.log("InnerAppNavigator: Auth loading finished. Rendering main navigation.");
  return (
    <Stack>
      {session ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}