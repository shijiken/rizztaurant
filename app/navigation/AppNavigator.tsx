// app/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SwipeCardsScreen from '../screens/SwipeCardsScreen';
import SavedRestaurantsScreen from '../screens/SavedRestaurantsScreen';
import { Restaurant } from '../types/Restaurant';

// Define your navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface AppNavigatorProps {
    savedRestaurants: Restaurant[];
    onUpdateSavedRestaurants: (newSavedList: Restaurant[]) => void;
}

// Main Tab Navigator 
const MainTabs: React.FC<AppNavigatorProps> = ({ savedRestaurants, onUpdateSavedRestaurants }) => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap; // Type for Ionicons names

                    if (route.name === 'SwipeTab') {
                        iconName = focused ? 'restaurant' : 'restaurant-outline';
                    } else if (route.name === 'SavedTab') {
                        iconName = focused ? 'bookmark' : 'bookmark-outline';
                    } else {
                        iconName = 'help-circle-outline'; 
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3CB371', // Green for active tab
                tabBarInactiveTintColor: 'gray',
                headerShown: false, // Hide header on tabs since screens handle their own titles
            })}
        >
            <Tab.Screen name="SwipeTab" options={{ title: 'Swipe' }}>
                {props => <SwipeCardsScreen {...props} onUpdateSavedRestaurants={onUpdateSavedRestaurants} />}
            </Tab.Screen>
            <Tab.Screen name="SavedTab" options={{ title: 'Saved' }}>
                {props => <SavedRestaurantsScreen {...props} savedRestaurants={savedRestaurants} onUpdateSavedRestaurants={onUpdateSavedRestaurants} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

// Top-level Stack Navigator 
const AppNavigator: React.FC<AppNavigatorProps> = ({ savedRestaurants, onUpdateSavedRestaurants }) => {
  return (
      <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" options={{ headerShown: false }}>
                  {/* Simplified type for props - let TS infer, or use a general 'any' if it complains too much */}
                  { (props) => ( // No explicit type annotation for 'props' here
                      <MainTabs
                          {...props} // Spreads navigation, route etc.
                          savedRestaurants={savedRestaurants}
                          onUpdateSavedRestaurants={onUpdateSavedRestaurants}
                      />
                  )}
              </Stack.Screen>
              {/* Add other screens that are not part of the main tabs here, e.g., a detail screen or settings */}
          </Stack.Navigator>
      </NavigationContainer>
  );
};

export default AppNavigator;