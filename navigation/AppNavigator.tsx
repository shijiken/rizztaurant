import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons


import SettingsScreen from '../screens/SettingsScreen'; 
import SwipeCardsScreen from '../screens/SwipeCards'; 

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // Hide default header
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: 'tomato', // Customize active tab color
          tabBarInactiveTintColor: 'gray', // Customize inactive tab color
          tabBarLabelStyle: { fontSize: 12 }, // Optional: style the text label
          tabBarStyle: { paddingBottom: 5, height: 60 } // Optional: style the entire tab bar
        })}
      >
        <Tab.Screen name="Home" component={SwipeCardsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;