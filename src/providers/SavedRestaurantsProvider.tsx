// src/providers/SavedRestaurantsProvider.tsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
  useRef
} from "react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { Restaurant } from "@/src/types/Restaurant";
import { Alert } from "react-native";
// NEW: Import storage utilities instead of AsyncStorage directly
import { loadSavedRestaurantsFromLocal, saveSavedRestaurantsToLocal, clearSavedRestaurantsFromLocal } from "@/src/lib/storage";


interface SavedRestaurantsContextType {
  savedRestaurants: Restaurant[];
  addSavedRestaurant: (restaurant: Restaurant) => Promise<void>;
  removeSavedRestaurant: (restaurantId: string) => Promise<void>;
  isRestaurantSaved: (restaurantId: string) => boolean;
  loadingSavedRestaurants: boolean;
}

const SavedRestaurantsContext = createContext<
  SavedRestaurantsContextType | undefined
>(undefined);

export const SavedRestaurantsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { session } = useAuth();
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [loadingSavedRestaurants, setLoadingSavedRestaurants] = useState(true);

  const hasFetchedForSessionRef = useRef(false);
  const isFetchingRef = useRef(false); // To prevent multiple concurrent fetches

  const mapDbRestaurantToAppRestaurant = useCallback((dbRestaurant: any): Restaurant => {
    return {
      id: dbRestaurant.id,
      name: dbRestaurant.name,
      address: dbRestaurant.address,
      mapsUrl: dbRestaurant.maps_url,
      imageUrl: dbRestaurant.image_url,
      latitude: dbRestaurant.latitude,
      longitude: dbRestaurant.longitude,
      rating: dbRestaurant.rating,
      user_ratings_total: dbRestaurant.user_ratings_total,
      price_level: dbRestaurant.price_level,
      cuisine: dbRestaurant.cuisine,
      distanceKm: dbRestaurant.distance_km,
    };
  }, []);

  // Simplified: Now just calls the utility function
  const handleSaveToCache = useCallback(async (restaurants: Restaurant[]) => {
    await saveSavedRestaurantsToLocal(restaurants);
  }, []);

  // Simplified: Now just calls the utility function
  const handleLoadFromCache = useCallback(async () => {
    const stored = await loadSavedRestaurantsFromLocal();
    if (stored.length > 0) {
      setSavedRestaurants(stored);
    }
  }, []);


  const fetchSavedRestaurants = useCallback(async (currentUserId: string, forceRefresh: boolean = false) => {
    if (isFetchingRef.current && !forceRefresh) {
        console.log("SRP: fetchSavedRestaurants skipped - already fetching or recently fetched.");
        return;
    }
    isFetchingRef.current = true; // Set fetching state

    if (hasFetchedForSessionRef.current && !forceRefresh) {
      console.log("SRP: fetchSavedRestaurants skipped - already fetched for this session and not forced.");
      setLoadingSavedRestaurants(false); // Ensure loading is false if skipped
      isFetchingRef.current = false;
      return;
    }
    console.log(`SRP: Initial fetchSavedRestaurants called for user: ${currentUserId} (Force Refresh: ${forceRefresh})`);
    setLoadingSavedRestaurants(true);
    try {
      const { data, error } = await supabase
        .from("user_saved_restaurants")
        .select(`
          restaurant_id,
          restaurants (
            id,
            name,
            address,
            maps_url,
            image_url,
            latitude,
            longitude,
            rating,
            user_ratings_total,
            price_level,
            cuisine,
            distance_km
          )
        `)
        .eq("user_id", currentUserId);

      if (error) {
        console.error("SRP: Error fetching saved restaurants:", error.message);
        Alert.alert("Error", "Failed to load saved restaurants from server: " + error.message + ". Showing cached data if available.");
      } else {
        const fetchedRestaurants = data
          .map((item: any) => item.restaurants)
          .filter(Boolean)
          .map(mapDbRestaurantToAppRestaurant);
        console.log("SRP: Fetch completed. Setting savedRestaurants. Count:", fetchedRestaurants.length);
        setSavedRestaurants(fetchedRestaurants);
        await handleSaveToCache(fetchedRestaurants); // Use the new handleSaveToCache
      }
      if (!forceRefresh) {
        hasFetchedForSessionRef.current = true;
      }
    } catch (err: unknown) {
      console.error("SRP: Unexpected error fetching saved restaurants:", err);
      Alert.alert("Error", "An unexpected error occurred while loading saved restaurants. Showing cached data if available.");
    } finally {
      setLoadingSavedRestaurants(false);
      isFetchingRef.current = false;
      console.log("SRP: Fetch loading set to false.");
    }
  }, [mapDbRestaurantToAppRestaurant, handleSaveToCache]);


  useEffect(() => {
    console.log("SRP: useEffect triggered. Current Session ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("SRP: No session user ID, clearing saved restaurants and stopping listener setup.");
      setSavedRestaurants([]);
      setLoadingSavedRestaurants(false);
      hasFetchedForSessionRef.current = false;
      clearSavedRestaurantsFromLocal(); // Use the utility function to clear cache
      return;
    }

    const userId = session.user.id;
    console.log(`SRP: User ID present: ${userId}.`);

    handleLoadFromCache(); // Load from cache immediately

    console.log(`SRP: Setting up real-time listener for user: ${userId}.`);
    const channelName = `user_saved_restaurants_channel_${userId}`;
    const savedRestaurantsChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_saved_restaurants",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("SRP: Real-time INSERT event received for payload:", payload.new);
          const newSavedRestaurantId = (payload.new as { restaurant_id: string }).restaurant_id;
          if (newSavedRestaurantId) {
            console.log("SRP: Fetching full details for new restaurant ID via RTU:", newSavedRestaurantId);
            const { data, error } = await supabase
              .from('restaurants')
              .select(`
                id,
                name,
                address,
                maps_url,
                image_url,
                latitude,
                longitude,
                rating,
                user_ratings_total,
                price_level,
                cuisine,
                distance_km
              `)
              .eq('id', newSavedRestaurantId)
              .single();

            if (error) {
              console.error("SRP: Error fetching new saved restaurant details for real-time update:", error.message);
            } else if (data) {
              const mappedRestaurant = mapDbRestaurantToAppRestaurant(data);
              setSavedRestaurants((prev) => {
                if (!prev.some(r => r.id === mappedRestaurant.id)) {
                  const newState = [...prev, mappedRestaurant];
                  handleSaveToCache(newState); // Update cache on RTU
                  console.log("SRP: Adding new restaurant to state via INSERT RTU:", mappedRestaurant.name);
                  return newState;
                }
                console.log("SRP: Restaurant already in state (INSERT RTU), skipping add:", mappedRestaurant.name);
                return prev;
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_saved_restaurants",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("SRP: Real-time DELETE event received for payload:", payload.old);
          const deletedRestaurantId = (payload.old as { restaurant_id: string }).restaurant_id;
          setSavedRestaurants((prev) => {
            const newState = prev.filter((r) => r.id !== deletedRestaurantId);
            handleSaveToCache(newState); // Update cache on RTU
            console.log("SRP: Removing restaurant from state via DELETE RTU. New count:", newState.length);
            return newState;
          });
        }
      )
      .subscribe((status) => {
        console.log(`SRP: Channel '${channelName}' subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`SRP: Channel '${channelName}' successfully SUBSCRIBED. Triggering initial fetch.`);
          fetchSavedRestaurants(userId); // Fetch from Supabase after subscription confirmed
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`SRP: Channel '${channelName}' encountered an error.`);
          setLoadingSavedRestaurants(false);
        } else if (status === 'TIMED_OUT') {
            console.warn(`SRP: Channel '${channelName}' timed out during subscription.`);
            setLoadingSavedRestaurants(false);
        }
      });

    return () => {
      console.log("SRP: Cleaning up channel subscription:", channelName);
      supabase.removeChannel(savedRestaurantsChannel);
    };
  }, [session?.user?.id, fetchSavedRestaurants, mapDbRestaurantToAppRestaurant, handleSaveToCache, handleLoadFromCache]);

  const addSavedRestaurant = async (restaurant: Restaurant) => {
    console.log("SRP: addSavedRestaurant called for:", restaurant.name, "ID:", restaurant.id);
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to save restaurants.");
      return;
    }

    if (savedRestaurants.some(r => r.id === restaurant.id)) {
      console.warn("SRP: Restaurant already saved locally, skipping DB operation for add.");
      return;
    }

    // Optimistic UI update for immediate feedback
    setSavedRestaurants(prev => {
        const newState = [...prev, restaurant];
        handleSaveToCache(newState); // Update cache optimistically
        return newState;
    });

    try {
      const { error: upsertRestaurantError } = await supabase
        .from("restaurants")
        .upsert(
          {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            maps_url: restaurant.mapsUrl,
            image_url: restaurant.imageUrl,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            rating: restaurant.rating,
            user_ratings_total: restaurant.user_ratings_total,
            price_level: restaurant.price_level,
            cuisine: restaurant.cuisine,
            distance_km: restaurant.distanceKm,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );

      if (upsertRestaurantError) {
        console.error("SRP: Error upserting restaurant details:", upsertRestaurantError.message);
        Alert.alert("Error", "Failed to save restaurant details: " + upsertRestaurantError.message);
        // Revert optimistic update if there's an error
        setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
        handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id)); // Revert cache
        return;
      }

      const { error } = await supabase
        .from("user_saved_restaurants")
        .insert({ user_id: session.user.id, restaurant_id: restaurant.id });

      if (error) {
        if (error.code === '23505') {
          console.warn("SRP: Restaurant already saved by this user (duplicate entry).");
        } else {
          console.error("SRP: Error adding saved restaurant to user_saved_restaurants:", error.message);
          Alert.alert("Error", "Failed to save restaurant: " + error.message);
          setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
          handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id)); // Revert cache
        }
      } else {
        console.log("SRP: Restaurant saved successfully in DB (user_saved_restaurants)! Real-time will update state.");
      }
    } catch (err) {
        console.error("SRP: Unexpected error in addSavedRestaurant:", err);
        Alert.alert("Error", "An unexpected error occurred while saving the restaurant.");
        setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
        handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id)); // Revert cache
    }
  };

  const removeSavedRestaurant = async (restaurantId: string) => {
    console.log("SRP: removeSavedRestaurant called for ID:", restaurantId);
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to remove saved restaurants.");
      return;
    }

    const previousSavedRestaurants = savedRestaurants; // Store for potential revert
    setSavedRestaurants(prev => {
        const newState = prev.filter((r) => r.id !== restaurantId);
        handleSaveToCache(newState); // Update cache optimistically
        return newState;
    });

    try {
      const { error } = await supabase
        .from("user_saved_restaurants")
        .delete()
        .eq("user_id", session.user.id)
        .eq("restaurant_id", restaurantId);

      if (error) {
        console.error("SRP: Error removing saved restaurant from user_saved_restaurants:", error.message);
        Alert.alert("Error", "Failed to remove restaurant: " + error.message);
        setSavedRestaurants(previousSavedRestaurants); // Revert optimistic update on error
        handleSaveToCache(previousSavedRestaurants); // Revert cache
      } else {
        console.log("SRP: Restaurant removed successfully from DB (user_saved_restaurants)! Real-time will update state.");
      }
    } catch (err) {
        console.error("SRP: Unexpected error in removeSavedRestaurant:", err);
        Alert.alert("Error", "An unexpected error occurred while removing the restaurant.");
        setSavedRestaurants(previousSavedRestaurants); // Revert optimistic update
        handleSaveToCache(previousSavedRestaurants); // Revert cache
    }
  };

  const isRestaurantSaved = useCallback((restaurantId: string) => {
    return savedRestaurants.some((r) => r.id === restaurantId);
  }, [savedRestaurants]);

  const contextValue = {
    savedRestaurants,
    addSavedRestaurant,
    removeSavedRestaurant,
    isRestaurantSaved,
    loadingSavedRestaurants,
  };

  return (
    <SavedRestaurantsContext.Provider value={contextValue}>
      {children}
    </SavedRestaurantsContext.Provider>
  );
};

export const useSavedRestaurants = () => {
  const context = useContext(SavedRestaurantsContext);
  if (context === undefined) {
    throw new Error(
      "useSavedRestaurants must be used within a SavedRestaurantsProvider"
    );
  }
  return context;
};