// src/app/(tabs)/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
  PermissionsAndroid,
  Platform,
  Button,
  TouchableOpacity,
  Linking,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Card from "@/src/components/Card";
import SwipeButtons from "@/src/components/SwipeButtons";
import NoMoreCards from "@/src/components/NoMoreCards";
import TopRightSavedButton from "@/src/components/TopRightSavedButton";
import { Restaurant } from "@/src/types/Restaurant";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";
import { useRouter } from 'expo-router';
import { useSavedRestaurants } from "@/src/providers/SavedRestaurantsProvider";
import Constants from "expo-constants";
import { getCuisineFromPlaceTypes } from '@/src/utils/restaurantData';
import { supabase } from "@/src/lib/supabase";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const GOOGLE_PLACES_API_KEY =
  Constants.expoConfig?.extra?.expoPublicGooglePlacesKey;

const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const getPriceLevelString = (level?: number | string): string => {
  if (typeof level === 'string') {
    switch (level) {
      case "PRICE_LEVEL_FREE":
        return "Free";
      case "PRICE_LEVEL_INEXPENSIVE":
        return "$";
      case "PRICE_LEVEL_MODERATE":
        return "$$";
      case "PRICE_LEVEL_EXPENSIVE":
        return "$$$";
      case "PRICE_LEVEL_VERY_EXPENSIVE":
        return "$$$$";
      default:
        return "N/A";
    }
  }
  switch (level) {
    case 0:
      return "Free";
    case 1:
      return "$";
    case 2:
      return "$$";
    case 3:
      return "$$$";
    case 4:
      return "$$$$";
    default:
      return "N/A";
  }
};


const SwipeCardsScreen: React.FC = () => {
  const { session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const { savedRestaurants, addSavedRestaurant, removeSavedRestaurant } = useSavedRestaurants();

  const [cardStack, setCardStack] = useState<Restaurant[]>([]);
  const [swipedHistory, setSwipedHistory] = useState<
    ({ direction: "left" | "right" } & Restaurant)[]
  >([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const animatedRotation = useDerivedValue(
    () => (translateX.value / SCREEN_WIDTH) * 20
  );

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === "ios") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Permission to access location was denied."
        );
        return false;
      }
      return true;
    } else { // Android
      try {
        const { GRANTED, DENIED, NEVER_ASK_AGAIN } = PermissionsAndroid.RESULTS;

        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        console.log("Permissions result:", permissions);
        const fineLocationGranted = permissions[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === GRANTED;
        const coarseLocationGranted = permissions[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === GRANTED;

        if (fineLocationGranted || coarseLocationGranted) {
          console.log("Location permission granted");
          return true;
        } else {
          console.log("Both location permissions denied");
          Alert.alert(
            "Permission denied",
            "Permission to access location was denied. Some features may not work."
          );
          return false;
        }
      } catch (err: unknown) {
        console.warn("Error requesting location permission:", err);
        return false;
      }
    }
  }, []);

  const getUserLocation = useCallback(async () => {
    setDataLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        setDataLoading(false);
        return;
    }

    const isLocationServiceEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationServiceEnabled) {
        Alert.alert(
            "Location Services Disabled",
            "Your device's location services are turned off. Please enable them in your device settings to find nearby restaurants.",
            [
                { text: "Cancel", style: "cancel", onPress: () => setDataLoading(false) },
                {
                    text: "Open Settings",
                    onPress: () => {
                        Linking.openSettings();
                        setDataLoading(false);
                    }
                }
            ]
        );
        return;
    }

    console.log("DEBUG: Permissions granted and Location Services enabled. Attempting to get position...");

    try {
        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            // timeout: 15000,
        });
        setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });
        console.log(
            "User Location (SwipeCardsScreen):",
            location.coords.latitude,
            location.coords.longitude
        );
    } catch (err: unknown) {
        let errorMessage = `Error getting location: ${
          err instanceof Error ? err.message : String(err)
        }.`;
        if (errorMessage.includes("Not authorized") || errorMessage.includes("Location services are disabled")) {
            errorMessage += " This usually means device location services are off or permission was revoked. Please check device settings.";
        } else if (errorMessage.includes("Timeout")) {
            errorMessage += " The device could not get a location fix within the allowed time. Try moving to an open area.";
        } else {
            errorMessage += " Please ensure location services are enabled and try again.";
        }
        setError(errorMessage);
        console.error("Error in getCurrentPositionAsync:", err);
    } finally {
        setDataLoading(false);
    }
}, [requestLocationPermission]);


  const fetchRestaurantsFromAPI = useCallback(
    async (latitude: number, longitude: number) => {
      console.log("SCS: fetchRestaurantsFromAPI called.");
      setDataLoading(true);
      setError(null);
      if (!GOOGLE_PLACES_API_KEY) {
        setError("Google Places API Key is missing. Please check your app.config.js and .env file.");
        setDataLoading(false);
        setHasFetchedInitialData(true);
        return;
      }
      if (!session?.user?.id) {
        setError("User not authenticated. Cannot fetch restaurants.");
        setDataLoading(false);
        setHasFetchedInitialData(true);
        return;
      }
      const userId = session.user.id;

      // When fetchRestaurantsFromAPI is called, it will always get the *current*
      // (potentially empty) swiped history.
      // The `refetchRestaurants` function is responsible for clearing this history first.
      const { data: swipedData, error: swipedError } = await supabase
        .from('user_swiped_restaurants')
        .select('restaurant_id')
        .eq('user_id', userId);

      if (swipedError) {
        console.error("SCS: Error fetching swiped restaurants:", swipedError.message);
      }
      const swipedRestaurantIds = new Set(swipedData?.map(item => item.restaurant_id) || []);
      console.log("SCS: Swiped Restaurant IDs before API call (for filtering):", Array.from(swipedRestaurantIds));

      // --- START OF ADDED OUTER TRY BLOCK ---
      try {
          // 2. Perform Nearby Search (New)
          const nearbySearchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
          const nearbySearchBody = {
            locationRestriction: {
              circle: {
                center: { latitude, longitude },
                radius: 5000 // 5km radius
              }
            },
            includedTypes: ["restaurant", "cafe", "bar"],
            maxResultCount: 3 // Max results per call (API limit)
          };

          const nearbyResponse = await fetch(nearbySearchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.primaryType,places.types,places.name'
            },
            body: JSON.stringify(nearbySearchBody)
          });

          const nearbyResponseText = await nearbyResponse.text();

          if (!nearbyResponse.ok) {
              let errorData;
              try {
                  errorData = JSON.parse(nearbyResponseText);
              } catch (parseError: unknown) {
                  console.error("SCS: Failed to parse Nearby Search error response as JSON:", parseError);
                  errorData = { error: { message: `Non-JSON error response: ${nearbyResponseText}` } };
              }
              setError(
                  `API Error (Nearby Search): ${nearbyResponse.status} - ${errorData.error?.message || errorData.message || "Unknown error"}`
              );
              setCardStack([]);
              setDataLoading(false);
              setHasFetchedInitialData(true);
              return;
          }

          let nearbyData;
          try {
              nearbyData = JSON.parse(nearbyResponseText);
          } catch (e: unknown) {
              setError(`SCS: JSON Parse Error (Nearby Search): ${e instanceof Error ? e.message : String(e)}. Raw response: ${nearbyResponseText}`);
              setCardStack([]);
              setDataLoading(false);
              setHasFetchedInitialData(true);
              return;
          }

          console.log("SCS: Nearby Search API returned", nearbyData.places ? nearbyData.places.length : 0, "places.");

          if (!nearbyData.places || nearbyData.places.length === 0) {
            setError(
              "No restaurants found near your location. Try adjusting your location or search radius."
            );
            setCardStack([]);
            setDataLoading(false);
            setHasFetchedInitialData(true);
            return;
          }

          const newRestaurantsToProcess: Restaurant[] = [];
          for (const place of nearbyData.places) {
            if (!place.name) {
              console.warn(`SCS: Skipping place ${place.id} due to missing resource name (place.name) in Nearby Search response.`);
              continue;
            }

            const placeResourceName = place.name;
            const placeDetailsUrl = `https://places.googleapis.com/v1/${placeResourceName}?fields=id,displayName,formattedAddress,location,rating,priceLevel,photos,googleMapsUri,websiteUri,userRatingCount,primaryType,types,editorialSummary`;

            const detailsResponse = await fetch(placeDetailsUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
              }
            });

            const detailsResponseText = await detailsResponse.text();

            let restaurantData: Restaurant;
            let currentRestaurantLat: number | undefined;
            let currentRestaurantLon: number | undefined;
            let calculatedDistance: number | undefined;

            let detailsResult: any = null;
            if (detailsResponse.ok && detailsResponseText) {
              try {
                detailsResult = JSON.parse(detailsResponseText);
              } catch (e: unknown) {
                console.warn(`SCS: JSON Parse Error for place ID ${place.id} (details): ${e instanceof Error ? e.message : String(e)}. Raw response: ${detailsResponseText}`);
              }
            }

            if (detailsResult && detailsResult.location && typeof detailsResult.location.latitude === 'number' && typeof detailsResult.location.longitude === 'number') {
              currentRestaurantLat = detailsResult.location.latitude;
              currentRestaurantLon = detailsResult.location.longitude;
            } else if (place.location && typeof place.location.latitude === 'number' && typeof place.location.longitude === 'number') {
               currentRestaurantLat = place.location.latitude;
               currentRestaurantLon = place.location.longitude;
            }


            if (userLocation && currentRestaurantLat !== undefined && currentRestaurantLon !== undefined) {
              calculatedDistance = getDistanceFromLatLonInKm(
                userLocation.latitude,
                userLocation.longitude,
                currentRestaurantLat,
                currentRestaurantLon
              );
            }

            restaurantData = {
              id: place.id,
              name: detailsResult?.displayName?.text || place.displayName?.text || "Unknown Restaurant",
              address: detailsResult?.formattedAddress || place.formattedAddress || "Address not available",
              mapsUrl: detailsResult?.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || "")}&query_place_id=${place.id}`,
              imageUrl:
                (detailsResult?.photos && detailsResult.photos.length > 0
                  ? `https://places.googleapis.com/v1/${detailsResult.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
                  : (place.photos && place.photos.length > 0
                      ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
                      : "https://via.placeholder.com/150?text=No+Image")),
              latitude: currentRestaurantLat || 0,
              longitude: currentRestaurantLon || 0,
              rating: detailsResult?.rating || undefined,
              user_ratings_total: detailsResult?.userRatingCount || undefined,
              price_level: detailsResult?.priceLevel || undefined,
              cuisine: getCuisineFromPlaceTypes(
                detailsResult?.primaryType || place.primaryType,
                detailsResult?.types || place.types || []
              ),
              distanceKm: calculatedDistance,
            };

            newRestaurantsToProcess.push(restaurantData);

            await supabase
              .from('restaurants')
              .upsert(
                {
                  id: restaurantData.id,
                  name: restaurantData.name,
                  address: restaurantData.address,
                  maps_url: restaurantData.mapsUrl,
                  image_url: restaurantData.imageUrl,
                  latitude: restaurantData.latitude,
                  longitude: restaurantData.longitude,
                  rating: restaurantData.rating,
                  user_ratings_total: restaurantData.user_ratings_total,
                  price_level: restaurantData.price_level,
                  cuisine: restaurantData.cuisine,
                  distance_km: restaurantData.distanceKm,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id', ignoreDuplicates: false }
              );
          } // End of for loop
          newRestaurantsToProcess.sort(
            (a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity)
          );
          console.log("SCS: Setting card stack with", newRestaurantsToProcess.length, "new restaurants.");
          setCardStack(newRestaurantsToProcess.slice(0, 25));
    } catch (err: unknown) { // This catch block now correctly matches the 'try' above
      setError(
        `API Fetch Error: ${err instanceof Error ? err.message : String(err)}. Please check your internet connection, API key, and Google Cloud project setup.`
      );
    } finally {
      setDataLoading(false);
      setHasFetchedInitialData(true);
    }
  },
  [session?.user?.id, GOOGLE_PLACES_API_KEY, userLocation]
);

  const refetchRestaurants = useCallback(async () => {
    console.log("SCS: 'Find More Restaurants' button pressed. Initiating complete refetch.");
    setError(null);
    if (userLocation && session?.user?.id) {
      setDataLoading(true);
      setHasFetchedInitialData(false);
      setCardStack([]); // Clear existing cards immediately to show loading or empty state

      // THIS IS THE KEY FOR COMPLETE REFRESH: Clear all user's swiped history
      console.log("SCS: Clearing ALL user's swiped history for complete refresh...");
      const { error: deleteError } = await supabase
        .from('user_swiped_restaurants')
        .delete()
        .eq('user_id', session.user.id);
      if (deleteError) {
        console.error("SCS: Error clearing previous swipe history:", deleteError.message);
        Alert.alert("Error", "Failed to clear previous swipe history: " + deleteError.message);
      } else {
        console.log("SCS: Successfully cleared user's swiped history for complete refresh.");
      }

      console.log("SCS: Calling fetchRestaurantsFromAPI to get all nearby restaurants.");
      await fetchRestaurantsFromAPI(userLocation.latitude, userLocation.longitude); // No special parameter needed now
    } else {
        console.log("SCS: User location or session missing, getting user location first.");
        await getUserLocation();
    }
    console.log("SCS: refetchRestaurants function finished.");
  }, [userLocation, session?.user?.id, fetchRestaurantsFromAPI, getUserLocation]);

  useEffect(() => {
    console.log("SCS: Main useEffect triggered. AuthLoading:", authLoading, "Session:", !!session, "UserLocation:", !!userLocation, "HasFetchedInitialData:", hasFetchedInitialData);
    if (!authLoading && session) {
      if (!userLocation) {
        console.log("SCS: Main useEffect: User location not available, getting location.");
        getUserLocation();
      } else if (!hasFetchedInitialData) {
        console.log("SCS: Main useEffect: User location available, initial data not fetched. Fetching restaurants.");
        fetchRestaurantsFromAPI(userLocation.latitude, userLocation.longitude);
      } else {
        console.log("SCS: Main useEffect: All conditions met, no action needed for initial fetch.");
      }
    }
  }, [authLoading, session, userLocation, hasFetchedInitialData, getUserLocation, fetchRestaurantsFromAPI]);


  const onSwipe = useCallback(
    async (direction: "left" | "right", swipedRestaurant: Restaurant) => {
      if (!session?.user?.id) {
        Alert.alert("Error", "You must be logged in to record swipes.");
        return;
      }
      const userId = session.user.id;

      const { error: swipeError } = await supabase
        .from('user_swiped_restaurants')
        .upsert(
          { user_id: userId, restaurant_id: swipedRestaurant.id, swiped_direction: direction, swiped_at: new Date().toISOString() },
          { onConflict: 'user_id,restaurant_id', ignoreDuplicates: false }
        );

      if (swipeError) {
        console.error("SCS: Error recording swipe:", swipeError.message);
        Alert.alert("Error", "Failed to record swipe: " + swipeError.message);
      }

      setSwipedHistory((prevHistory: (({ direction: "left" | "right" } & Restaurant))[]) => [
        ...prevHistory,
        { ...swipedRestaurant, direction },
      ]);
      if (direction === "right") {
        await addSavedRestaurant(swipedRestaurant);
      }
      setCardStack((currentStack) => currentStack.slice(1));
    },
    [session?.user?.id, addSavedRestaurant, setCardStack]
  );

  const triggerSwipeAnimationAndCallback = useCallback(
    (direction: "left" | "right", currentTopCard: Restaurant) => {
      const toValueX = (direction === "right" ? 1 : -1) * SCREEN_WIDTH * 1.5;
      const toValueZ = (direction === "right" ? 1 : -1) * 45;

      translateX.value = withTiming(toValueX, { duration: 400 });
      rotateZ.value = withTiming(
        toValueZ,
        { duration: 400 },
        (isFinished) => {
          if (isFinished) {
            runOnJS(onSwipe)(direction, currentTopCard);
          }
        }
      );
    },
    [onSwipe, translateX, rotateZ]
  );

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotateZ.value = animatedRotation.value;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "right" : "left";
        const currentTopCard = cardStack[0];
        if (currentTopCard) {
          runOnJS(triggerSwipeAnimationAndCallback)(direction, currentTopCard);
        }
      } else {
        translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
        rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
      }
    });

  const handleUndo = useCallback(async () => {
    if (swipedHistory.length > 0) {
      const lastSwiped = swipedHistory[swipedHistory.length - 1];
      setSwipedHistory((prevHistory) => prevHistory.slice(0, -1));

      if (session?.user?.id) {
        const { error: deleteSwipeError } = await supabase
          .from('user_swiped_restaurants')
          .delete()
          .eq('user_id', session.user.id)
          .eq('restaurant_id', lastSwiped.id);
        if (deleteSwipeError) {
          console.error("SCS: Error removing swipe on undo:", deleteSwipeError.message);
          Alert.alert("Error", "Failed to undo swipe in database: " + deleteSwipeError.message);
        }
      }

      setCardStack((prev) => [lastSwiped, ...prev]);

      if (lastSwiped.direction === "right") {
        await removeSavedRestaurant(lastSwiped.id);
      }
      translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
      rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
    }
  }, [swipedHistory, session?.user?.id, removeSavedRestaurant, setCardStack, translateX, rotateZ]);

  const handleDiscard = useCallback(() => {
    if (cardStack.length > 0) {
      const swipedRestaurant = cardStack[0];
      if (swipedRestaurant) {
        triggerSwipeAnimationAndCallback("left", swipedRestaurant);
      }
    }
  }, [cardStack, triggerSwipeAnimationAndCallback]);

  const handleSelect = useCallback(() => {
    if (cardStack.length > 0) {
      const swipedRestaurant = cardStack[0];
      if (swipedRestaurant) {
        triggerSwipeAnimationAndCallback("right", swipedRestaurant);
      }
    }
  }, [cardStack, triggerSwipeAnimationAndCallback]);


  useEffect(() => {
    if (cardStack.length > 0) {
      translateX.value = 0;
      rotateZ.value = 0;
    }
  }, [cardStack, translateX, rotateZ]);

  const topCardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(
            0.9 + Math.min(0.1, Math.abs(translateX.value / SCREEN_WIDTH) * 0.2)
          ),
        },
      ],
      opacity: withSpring(
        0.8 + Math.min(0.2, Math.abs(translateX.value / SCREEN_WIDTH))
      ),
    };
  });

  const thirdCardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(
            0.8 + Math.min(0.1, Math.abs(translateX.value / SCREEN_WIDTH) * 0.2)
          ),
        },
      ],
      opacity: withSpring(
        0.6 + Math.min(0.2, Math.abs(translateX.value / SCREEN_WIDTH))
      ),
    };
  });

  if (authLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.statusText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }

  if (dataLoading || (!hasFetchedInitialData && !userLocation)) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.statusText}>Finding restaurants near you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6347" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>
          Please ensure location services are enabled, and check your API key/billing setup.
        </Text>
        <TouchableOpacity onPress={refetchRestaurants} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cardStack.length === 0 && hasFetchedInitialData) {
    return <NoMoreCards onReload={refetchRestaurants} onSignOut={signOut} />;
  }

  const topCard = cardStack[0];
  const nextCard = cardStack[1];
  const thirdCard = cardStack[2];

  return (
    <View style={styles.container}>
      {topCard && (
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.card,
              { zIndex: 3 },
              topCardAnimatedStyle,
            ]}
            key={topCard.id}
          >
            <Card
              restaurant={topCard}
              getPriceLevelString={getPriceLevelString}
            />
          </Animated.View>
        </GestureDetector>
      )}

      {nextCard && (
        <Animated.View
          style={[
            styles.card,
            { zIndex: 2 },
            nextCardAnimatedStyle,
          ]}
          key={nextCard.id}
        >
          <Card
            restaurant={nextCard}
            getPriceLevelString={getPriceLevelString}
          />
        </Animated.View>
      )}

      {thirdCard && (
        <Animated.View
          style={[
            styles.card,
            { zIndex: 1 },
            thirdCardAnimatedStyle,
          ]}
          key={thirdCard.id}
        >
          <Card
            restaurant={thirdCard}
            getPriceLevelString={getPriceLevelString}
          />
        </Animated.View>
      )}

      {cardStack.length > 0 && (
        <SwipeButtons
          onUndo={handleUndo}
          onDiscard={handleDiscard}
          onSelect={handleSelect}
          canUndo={swipedHistory.length > 0}
          canSwipe={cardStack.length > 0 && !dataLoading && !error}
        />
      )}

      {cardStack.length > 0 && (
        <>
          <TouchableOpacity style={styles.reloadButton} onPress={refetchRestaurants}>
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
          <TopRightSavedButton
            savedCount={savedRestaurants.length}
            onPress={() => router.navigate('/(tabs)/SavedRestaurants')}
          />
        </>
      )}
    </View>
  );
};

export default SwipeCardsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6347",
    textAlign: "center",
    marginHorizontal: 20,
  },
  retryText: {
    marginTop: 5,
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginHorizontal: 20,
  },
  reloadButton: {
    position: "absolute",
    top: 16,
    left: 20,
    backgroundColor: "#007aff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 5,
},
  reloadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    top: 70,
    height: "70%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
});