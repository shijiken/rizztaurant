// navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
import SettingsScreen from '../screens/SettingsScreen';
import SwipeCardsScreen from '../screens/SwipeCards';
import SavedRestaurantsScreen from '../screens/SavedRestaurantsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  // Central state to hold saved restaurants that can be accessed by multiple tabs
  const [allSavedRestaurants, setAllSavedRestaurants] = useState<any[]>([]);

  // Callback function to update the saved restaurants from SwipeCardsScreen
  const handleUpdateSavedRestaurants = (newSavedList: any[]) => {
    setAllSavedRestaurants(newSavedList);
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide default header for all tabs
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'HomeTab') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'SettingsTab') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'SavedTab') {
              iconName = focused ? 'bookmark' : 'bookmark-outline';
            } else {
              iconName = 'help-circle-outline'; // Fallback icon
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { paddingBottom: 5, height: 60 }
        })}
      >
        {/* Correct pattern: Pass the render function as children to Tab.Screen */}
        <Tab.Screen
          name="HomeTab"
          options={{ title: 'Home' }}
        >
          {/* This function receives the navigation and route props automatically */}
          {(props) => (
            <SwipeCardsScreen
              {...props}
              onUpdateSavedRestaurants={handleUpdateSavedRestaurants}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="SettingsTab"
          options={{ title: 'Settings' }}
          component={SettingsScreen} // SettingsScreen doesn't need custom props here, so component={...} is fine
        />

        {/* Correct pattern: Pass the render function as children to Tab.Screen */}
        <Tab.Screen
          name="SavedTab"
          options={{ title: 'Saved' }}
        >
          {/* This function receives the navigation and route props automatically */}
          {(props) => (
            <SavedRestaurantsScreen
              {...props}
              savedRestaurants={allSavedRestaurants}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;