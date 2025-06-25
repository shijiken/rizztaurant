// src/providers/SavedRestaurantsProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useCallback, // <--- Make sure useCallback is imported
} from "react";
import { Restaurant } from "../types/Restaurant"; // Adjust path if needed

// Define the shape of your context data
type SavedRestaurantsContextType = {
  savedRestaurants: Restaurant[];
  addSavedRestaurant: (restaurant: Restaurant) => void; // <--- This needs to be exposed
  removeSavedRestaurant: (id: string) => void; // <--- This needs to be exposed
  setAllSavedRestaurants: (newSavedList: Restaurant[]) => void; // <--- This needs to be exposed
};

// Create the context
const SavedRestaurantsContext = createContext<
  SavedRestaurantsContextType | undefined
>(undefined);

// Create the provider component
export default function SavedRestaurantsProvider({
  children,
}: PropsWithChildren) {
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);

  // Function to add a single restaurant
  const addSavedRestaurant = useCallback((restaurant: Restaurant) => {
    setSavedRestaurants((prev) => {
      // Prevent duplicates
      if (!prev.some(r => r.id === restaurant.id)) {
        const newState = [...prev, restaurant];
        console.log("SavedRestaurantsProvider - Added:", restaurant.name);
        return newState;
      }
      return prev;
    });
  }, []);

  // Function to remove a single restaurant by ID
  const removeSavedRestaurant = useCallback((idToRemove: string) => {
    setSavedRestaurants((prev) => {
      const newState = prev.filter((r) => r.id !== idToRemove);
      console.log("SavedRestaurantsProvider - Removed ID:", idToRemove);
      return newState;
    });
  }, []);

  // Function to replace the entire list (useful for initial load or full sync)
  const setAllSavedRestaurants = useCallback((newSavedList: Restaurant[]) => {
    setSavedRestaurants(newSavedList);
    console.log(
      "SavedRestaurantsProvider - Central Saved Restaurants Updated:",
      newSavedList.map((r) => r.name)
    );
  }, []);

  const value = {
    savedRestaurants,
    addSavedRestaurant,        // <--- Expose this
    removeSavedRestaurant,     // <--- Expose this
    setAllSavedRestaurants,    // <--- Expose this
  };

  return (
    <SavedRestaurantsContext.Provider value={value}>
      {children}
    </SavedRestaurantsContext.Provider>
  );
}

// Custom hook to consume the context
export const useSavedRestaurants = () => {
  const context = useContext(SavedRestaurantsContext);
  if (context === undefined) {
    throw new Error(
      "useSavedRestaurants must be used within a SavedRestaurantsProvider"
    );
  }
  return context;
};