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
  const isFetchingRef = useRef(false);

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


  const handleSaveToCache = useCallback(async (restaurants: Restaurant[]) => {
    await saveSavedRestaurantsToLocal(restaurants);
  }, []);


  const handleLoadFromCache = useCallback(async () => {
    const stored = await loadSavedRestaurantsFromLocal();
    if (stored.length > 0) {
      setSavedRestaurants(stored);
    }
  }, []);


  const fetchSavedRestaurants = useCallback(async (currentUserId: string, forceRefresh: boolean = false) => {
    if (isFetchingRef.current && !forceRefresh) {
        return;
    }
    isFetchingRef.current = true;

    if (hasFetchedForSessionRef.current && !forceRefresh) {
      setLoadingSavedRestaurants(false);
      isFetchingRef.current = false;
      return;
    }
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
        Alert.alert("Error", "Failed to load saved restaurants from server: " + error.message + ". Showing cached data if available.");
      } else {
        const fetchedRestaurants = data
          .map((item: any) => item.restaurants)
          .filter(Boolean)
          .map(mapDbRestaurantToAppRestaurant);
        setSavedRestaurants(fetchedRestaurants);
        await handleSaveToCache(fetchedRestaurants);
      }
      if (!forceRefresh) {
        hasFetchedForSessionRef.current = true;
      }
    } catch (err: unknown) {
      Alert.alert("Error", "An unexpected error occurred while loading saved restaurants. Showing cached data if available.");
    } finally {
      setLoadingSavedRestaurants(false);
      isFetchingRef.current = false;
    }
  }, [mapDbRestaurantToAppRestaurant, handleSaveToCache]);


  useEffect(() => {
    if (!session?.user?.id) {
      setSavedRestaurants([]);
      setLoadingSavedRestaurants(false);
      hasFetchedForSessionRef.current = false;
      clearSavedRestaurantsFromLocal();
      return;
    }

    const userId = session.user.id;
    handleLoadFromCache();

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
          const newSavedRestaurantId = (payload.new as { restaurant_id: string }).restaurant_id;
          if (newSavedRestaurantId) {
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

            if (!error && data) {
              const mappedRestaurant = mapDbRestaurantToAppRestaurant(data);
              setSavedRestaurants((prev) => {
                if (!prev.some(r => r.id === mappedRestaurant.id)) {
                  const newState = [...prev, mappedRestaurant];
                  handleSaveToCache(newState);
                  return newState;
                }
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
          const deletedRestaurantId = (payload.old as { restaurant_id: string }).restaurant_id;
          setSavedRestaurants((prev) => {
            const newState = prev.filter((r) => r.id !== deletedRestaurantId);
            handleSaveToCache(newState);
            return newState;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchSavedRestaurants(userId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setLoadingSavedRestaurants(false);
        }
      });

    return () => {
      supabase.removeChannel(savedRestaurantsChannel);
    };
  }, [session?.user?.id, fetchSavedRestaurants, mapDbRestaurantToAppRestaurant, handleSaveToCache, handleLoadFromCache]);

  const addSavedRestaurant = async (restaurant: Restaurant) => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to save restaurants.");
      return;
    }

    if (savedRestaurants.some(r => r.id === restaurant.id)) {
      return;
    }

    setSavedRestaurants(prev => {
        const newState = [...prev, restaurant];
        handleSaveToCache(newState);
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
        Alert.alert("Error", "Failed to save restaurant details: " + upsertRestaurantError.message);
        setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
        handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id));
        return;
      }

      const { error } = await supabase
        .from("user_saved_restaurants")
        .insert({ user_id: session.user.id, restaurant_id: restaurant.id });

      if (error) {
        if (error.code !== '23505') {
          Alert.alert("Error", "Failed to save restaurant: " + error.message);
          setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
          handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id));
        }
      }
    } catch (err) {
        Alert.alert("Error", "An unexpected error occurred while saving the restaurant.");
        setSavedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
        handleSaveToCache(savedRestaurants.filter(r => r.id !== restaurant.id));
    }
  };

  const removeSavedRestaurant = async (restaurantId: string) => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to remove saved restaurants.");
      return;
    }

    const previousSavedRestaurants = savedRestaurants;
    setSavedRestaurants(prev => {
        const newState = prev.filter((r) => r.id !== restaurantId);
        handleSaveToCache(newState);
        return newState;
    });

    try {
      const { error } = await supabase
        .from("user_saved_restaurants")
        .delete()
        .eq("user_id", session.user.id)
        .eq("restaurant_id", restaurantId);

      if (error) {
        Alert.alert("Error", "Failed to remove restaurant: " + error.message);
        setSavedRestaurants(previousSavedRestaurants);
        handleSaveToCache(previousSavedRestaurants);
      }
    } catch (err) {
        Alert.alert("Error", "An unexpected error occurred while removing the restaurant.");
        setSavedRestaurants(previousSavedRestaurants);
        handleSaveToCache(previousSavedRestaurants);
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
