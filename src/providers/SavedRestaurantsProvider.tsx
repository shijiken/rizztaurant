// src/providers/SavedRestaurantsProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
  useCallback,
  useEffect,
} from "react";
import { Restaurant } from "../types/Restaurant";

// Define the shape of your context data - ADD lastSavedRestaurant and undoLastSave
type SavedRestaurantsContextType = {
  savedRestaurants: Restaurant[];
  addSavedRestaurant: (restaurant: Restaurant) => void;
  removeSavedRestaurant: (nameToRemove: string) => void;
  setAllSavedRestaurants: (newSavedList: Restaurant[]) => void;
  lastSavedRestaurant: Restaurant | null; // <--- NEW: Stores the last successfully saved restaurant
  undoLastSave: () => void;               // <--- NEW: Function to undo the last save
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
  // NEW STATE: To keep track of the last restaurant that was successfully added
  const [lastSavedRestaurant, setLastSavedRestaurant] = useState<Restaurant | null>(null);

  const addSavedRestaurant = useCallback((restaurant: Restaurant) => {
    setSavedRestaurants((prev) => {
      // Check for duplicates by NAME before adding to the list
      if (!prev.some(r => r.name === restaurant.name)) {
        const newState = [...prev, restaurant];
        console.log("SavedRestaurantsProvider: ADDING restaurant to local state:", restaurant.name, "(ID:", restaurant.id, "). New count:", newState.length);
        setLastSavedRestaurant(restaurant); // Set last saved restaurant when successfully added
        return newState;
      }
      console.log("SavedRestaurantsProvider: SKIPPING adding (duplicate NAME):", restaurant.name, "(ID:", restaurant.id, "). Current count:", prev.length);
      setLastSavedRestaurant(null); // If skipped (duplicate), there's no new save to undo
      return prev;
    });
  }, []);

  // Function to remove a single restaurant by Name (TEMPORARY WORKAROUND)
  const removeSavedRestaurant = useCallback((nameToRemove: string) => {
    setSavedRestaurants((prev) => {
      const newState = prev.filter((r) => r.name !== nameToRemove);
      if (newState.length < prev.length) {
        console.log("SavedRestaurantsProvider: REMOVED restaurant from local state with NAME:", nameToRemove, ". New count:", newState.length);
      } else {
        console.log("SavedRestaurantsProvider: NAME not found for removal:", nameToRemove, ". Count unchanged:", prev.length);
      }
      return newState;
    });
  }, []);

  // NEW FUNCTION: To undo the last save action
  const undoLastSave = useCallback(() => {
    if (lastSavedRestaurant) {
      setSavedRestaurants((prev) => {
        // Filter out the last saved restaurant by name
        const newState = prev.filter(r => r.name !== lastSavedRestaurant.name);
        if (newState.length < prev.length) {
          console.log("SavedRestaurantsProvider: UNDOING last save. Removed restaurant:", lastSavedRestaurant.name, ". New count:", newState.length);
        } else {
          console.log("SavedRestaurantsProvider: UNDO failed. Last saved restaurant not found in list:", lastSavedRestaurant.name);
        }
        return newState;
      });
      setLastSavedRestaurant(null); // Clear the last saved restaurant after undo
    } else {
      console.log("SavedRestaurantsProvider: No last saved restaurant to undo.");
    }
  }, [lastSavedRestaurant]); // Dependency on lastSavedRestaurant to ensure it has the latest value

  const setAllSavedRestaurants = useCallback((newSavedList: Restaurant[]) => {
    setSavedRestaurants(newSavedList);
    console.log(
      "SavedRestaurantsProvider: Entire saved restaurants list updated. New count:",
      newSavedList.length
    );
  }, []);

  useEffect(() => {
    console.log("SavedRestaurantsProvider mounted. Initializing saved restaurants state.");
  }, []);

  const value = {
    savedRestaurants,
    addSavedRestaurant,
    removeSavedRestaurant,
    setAllSavedRestaurants,
    lastSavedRestaurant, // Expose new state
    undoLastSave,        // Expose new function
  };

  return (
    <SavedRestaurantsContext.Provider value={value}>
      {children}
    </SavedRestaurantsContext.Provider>
  );
}

export const useSavedRestaurants = () => {
  const context = useContext(SavedRestaurantsContext);
  if (context === undefined) {
    throw new Error(
      "useSavedRestaurants must be used within a SavedRestaurantsProvider"
    );
  }
  return context;
};