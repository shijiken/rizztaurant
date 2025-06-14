import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeCards from './screens/SwipeCards';
import AppNavigator from './navigation/AppNavigator'; // Import your navigator


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
    
  );
}
