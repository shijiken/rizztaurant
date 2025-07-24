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

  // Function to fetch saved restaurants, now with optional forceRefresh
  const fetchSavedRestaurants = useCallback(async (currentUserId: string, forceRefresh: boolean = false) => {
    if (hasFetchedForSessionRef.current && !forceRefresh) {
      console.log("SRP: fetchSavedRestaurants skipped - already fetched for this session and not forced.");
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
        Alert.alert("Error", "Failed to load saved restaurants: " + error.message);
        setSavedRestaurants([]);
      } else {
        const fetchedRestaurants = data
          .map((item: any) => item.restaurants)
          .filter(Boolean)
          .map(mapDbRestaurantToAppRestaurant);
        console.log("SRP: Fetch completed. Setting savedRestaurants. Count:", fetchedRestaurants.length);
        setSavedRestaurants(fetchedRestaurants);
        if (!forceRefresh) { // Only mark as fetched for session if it's the initial, non-forced fetch
          hasFetchedForSessionRef.current = true;
        }
      }
    } catch (err: unknown) {
      console.error("SRP: Unexpected error fetching saved restaurants:", err);
      Alert.alert("Error", "An unexpected error occurred while loading saved restaurants.");
      setSavedRestaurants([]);
    } finally {
      setLoadingSavedRestaurants(false);
      console.log("SRP: Fetch loading set to false.");
    }
  }, [mapDbRestaurantToAppRestaurant]);

  useEffect(() => {
    console.log("SRP: useEffect triggered. Current Session ID:", session?.user?.id);

    if (!session?.user?.id) {
      console.log("SRP: No session user ID, clearing saved restaurants and stopping listener setup.");
      setSavedRestaurants([]);
      setLoadingSavedRestaurants(false);
      hasFetchedForSessionRef.current = false;
      return;
    }

    const userId = session.user.id;
    console.log(`SRP: User ID present: ${userId}. Setting up real-time listener.`);

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
                  console.log("SRP: Adding new restaurant to state via INSERT RTU:", mappedRestaurant.name);
                  return [...prev, mappedRestaurant];
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
            console.log("SRP: Removing restaurant from state via DELETE RTU. New count:", newState.length);
            return newState;
          });
        }
      )
      .subscribe((status) => {
        console.log(`SRP: Channel '${channelName}' subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`SRP: Channel '${channelName}' successfully SUBSCRIBED. Triggering initial fetch.`);
          // Initial fetch happens here after subscription is confirmed
          fetchSavedRestaurants(userId);
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
  }, [session?.user?.id, fetchSavedRestaurants]);

  const addSavedRestaurant = async (restaurant: Restaurant) => {
    console.log("SRP: addSavedRestaurant called for:", restaurant.name, "ID:", restaurant.id);
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to save restaurants.");
      return;
    }

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
      }
    } else {
      console.log("SRP: Restaurant saved successfully in DB (user_saved_restaurants)! Manually re-fetching data.");
      // FIXED: Manually re-fetch data after successful insert
      fetchSavedRestaurants(session.user.id, true);
    }
  };

  const removeSavedRestaurant = async (restaurantId: string) => {
    console.log("SRP: removeSavedRestaurant called for ID:", restaurantId);
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to remove saved restaurants.");
      return;
    }

    const { error } = await supabase
      .from("user_saved_restaurants")
      .delete()
      .eq("user_id", session.user.id)
      .eq("restaurant_id", restaurantId);

    if (error) {
      console.error("SRP: Error removing saved restaurant from user_saved_restaurants:", error.message);
      Alert.alert("Error", "Failed to remove restaurant: " + error.message);
    } else {
      console.log("SRP: Restaurant removed successfully from DB (user_saved_restaurants)! Manually re-fetching data.");
      // FIXED: Manually re-fetch data after successful delete
      fetchSavedRestaurants(session.user.id, true);
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
