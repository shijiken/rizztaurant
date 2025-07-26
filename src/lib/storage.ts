// src/lib/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Restaurant } from "@/src/types/Restaurant"; // Assuming Restaurant type is accessible

const SAVED_RESTAURANTS_STORAGE_KEY = 'saved_restaurants_offline_data';

export const saveSavedRestaurantsToLocal = async (restaurants: Restaurant[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(restaurants);
    await AsyncStorage.setItem(SAVED_RESTAURANTS_STORAGE_KEY, jsonValue);
    console.log("StorageUtil: Saved restaurants to AsyncStorage. Count:", restaurants.length);
  } catch (e: any) {
    console.error("StorageUtil: Failed to save saved restaurants to AsyncStorage:", e);
  };
}

export const loadSavedRestaurantsFromLocal = async (): Promise<Restaurant[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVED_RESTAURANTS_STORAGE_KEY);
    if (jsonValue != null) {
      const storedRestaurants: Restaurant[] = JSON.parse(jsonValue);
      console.log("StorageUtil: Loaded saved restaurants from AsyncStorage. Count:", storedRestaurants.length);
      return storedRestaurants;
    }
  } catch (e: any) {
    console.error("StorageUtil: Failed to load saved restaurants from AsyncStorage:", e);
  }
  return []; // Return an empty array on error or no data
};

export const clearSavedRestaurantsFromLocal = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SAVED_RESTAURANTS_STORAGE_KEY);
    console.log("StorageUtil: Cleared saved restaurants from AsyncStorage.");
  } catch (e: any) {
    console.error("StorageUtil: Failed to clear saved restaurants from AsyncStorage:", e);
  }
}
