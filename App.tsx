// App.tsx (at your project root)
import 'react-native-gesture-handler'; // Essential for React Navigation using gestures
import React, { useState } from 'react';
import AppNavigator from './app/navigation/AppNavigator'; // Correct path to your AppNavigator
import { Restaurant } from './app/types/Restaurant'; // Import the Restaurant type for central state

export default function App() {
  // Central state to hold saved restaurants that can be shared across screens
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);

  // Function to update the central saved restaurants state
  const handleUpdateSavedRestaurants = (newSavedList: Restaurant[]) => {
    setSavedRestaurants(newSavedList);
    // Optional: console log to see updates in the root App.tsx
    console.log('App.tsx - Central Saved Restaurants Updated:', newSavedList.map(r => r.name));
  };

  return (
    // AppNavigator receives the central state and its updater function as props
    <AppNavigator
      savedRestaurants={savedRestaurants}
      onUpdateSavedRestaurants={handleUpdateSavedRestaurants}
    />
  );
}