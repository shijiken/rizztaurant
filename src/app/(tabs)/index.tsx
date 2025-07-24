// src/app/(tabs)/index.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const GOOGLE_PLACES_API_KEY =
  Constants.expoConfig?.extra?.expoPublicGooglePlacesKey;

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

  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const animatedRotation = useDerivedValue(
    () => (translateX.value / SCREEN_WIDTH) * 20
  );

  const getDistanceFromLatLonInKm = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
    },
    []
  );

  const requestLocationPermission = async () => {
    // This single call handles permissions for both iOS and Android
    // For Android, it requests ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION
    // For iOS, it requests NSLocationWhenInUseUsageDescription
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Permission to access location was denied. Please enable it in your device settings."
      );
      return false;
    }
    return true;
  };

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
}, []);


  const getPriceLevelString = (level?: number | string) => {
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

  const fetchRestaurantsFromAPI = useCallback(
    async (latitude: number, longitude: number) => {
      setDataLoading(true);
      setError(null);
      if (!GOOGLE_PLACES_API_KEY) {
        setError("Google Places API Key is missing. Please check your app.config.js and .env file.");
        setDataLoading(false);
        return;
      }

      try {
        // --- GOOGLE PLACES API (NEW) ENDPOINTS ---

        // 1. Nearby Search (New) - POST request
        const nearbySearchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
        const nearbySearchBody = {
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: 5000 // 5km radius
            }
          },
          includedTypes: ["restaurant", "cafe", "bar"], 
          maxResultCount: 1 // Max results per call
        };

        console.log("Nearby Search Request URL:", nearbySearchUrl);
        console.log("Nearby Search Request Body:", JSON.stringify(nearbySearchBody));

        const nearbyResponse = await fetch(nearbySearchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.primaryType,places.types,places.name' 
          },
          body: JSON.stringify(nearbySearchBody)
        });

        console.log("Nearby Search Response Status:", nearbyResponse.status);
        const nearbyResponseText = await nearbyResponse.text();
        console.log("Nearby Search Raw Response:", nearbyResponseText);

        if (!nearbyResponse.ok) {
            let errorData;
            try {
                errorData = JSON.parse(nearbyResponseText);
            } catch (parseError: unknown) {
                console.error("Failed to parse Nearby Search error response as JSON:", parseError);
                errorData = { error: { message: `Non-JSON error response: ${nearbyResponseText}` } };
            }
            setError(
                `API Error (Nearby Search): ${nearbyResponse.status} - ${errorData.error?.message || errorData.message || "Unknown error"}`
            );
            setCardStack([]);
            setDataLoading(false);
            return;
        }

        let nearbyData;
        try {
            nearbyData = JSON.parse(nearbyResponseText);
        } catch (e: unknown) {
            setError(`JSON Parse Error (Nearby Search): ${e instanceof Error ? e.message : String(e)}. Raw response: ${nearbyResponseText}`);
            console.error(`JSON Parse Error (Nearby Search):`, e);
            setCardStack([]);
            setDataLoading(false);
            return;
        }
        
        if (!nearbyData.places || nearbyData.places.length === 0) {
          setError(
            "No restaurants found near your location. Try adjusting your location or search radius."
          );
          setCardStack([]);
          setDataLoading(false);
          return;
        }

        const detailedRestaurants: Restaurant[] = [];
        for (const place of nearbyData.places) {
          if (!place.name) {
            console.warn(`Skipping place ${place.id} due to missing resource name (place.name) in Nearby Search response.`);
            continue; 
          }

          const placeResourceName = place.name; 
          const placeDetailsUrl = `https://places.googleapis.com/v1/${placeResourceName}?fields=id,displayName,formattedAddress,location,rating,priceLevel,photos,googleMapsUri,websiteUri,userRatingCount,primaryType,types,editorialSummary`;

          console.log("Place Details Request URL:", placeDetailsUrl);

          const detailsResponse = await fetch(placeDetailsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            }
          });

          console.log(`Place Details Response Status for ${place.id}:`, detailsResponse.status);
          const detailsResponseText = await detailsResponse.text();
          console.log(`Place Details Raw Response for ${place.id}:`, detailsResponseText);

          if (detailsResponse.ok && detailsResponseText) {
            let result;
            try {
                result = JSON.parse(detailsResponseText);
            } catch (e: unknown) {
                console.warn(`JSON Parse Error for place ID ${place.id}: ${e instanceof Error ? e.message : String(e)}. Raw response: ${detailsResponseText}`);
                result = null; 
            }

            if (result && result.location) {
              const distance = getDistanceFromLatLonInKm(
                latitude,
                longitude,
                result.location.latitude,
                result.location.longitude
              );

              const cuisine = getCuisineFromPlaceTypes(result.primaryType, result.types || []);

              detailedRestaurants.push({
                id: result.id,
                name: result.displayName?.text || "Unknown Restaurant",
                address: result.formattedAddress || "Address not available",
                mapsUrl: result.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.displayName?.text || "")}&query_place_id=${result.id}`,
                imageUrl:
                  result.photos && result.photos.length > 0
                    ? `https://places.googleapis.com/v1/${result.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
                    : "https://via.placeholder.com/150?text=No+Image",
                latitude: result.location.latitude,
                longitude: result.location.longitude,
                rating: result.rating,
                user_ratings_total: result.userRatingCount,
                price_level: result.priceLevel,
                cuisine: cuisine,
                distanceKm: distance,
                description: result.editorialSummary?.text,
              });
            } else {
                console.warn(
                    `Failed to parse details or missing location for place ID ${place.id}. Falling back to Nearby Search data. Raw response: ${detailsResponseText}`
                );
                const distance = userLocation
                  ? getDistanceFromLatLonInKm(
                      latitude,
                      longitude,
                      place.location.latitude,
                      place.location.longitude
                    )
                  : undefined;
                const fallbackCuisine = getCuisineFromPlaceTypes(place.primaryType, place.types || []);

                detailedRestaurants.push({
                  id: place.id,
                  name: place.displayName?.text || "Unknown Restaurant",
                  address: place.formattedAddress || "Address not available",
                  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || "")}&query_place_id=${place.id}`,
                  imageUrl:
                    place.photos && place.photos.length > 0
                      ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
                      : "https://via.placeholder.com/150?text=No+Image",
                  latitude: place.location.latitude,
                  longitude: place.location.longitude,
                  rating: undefined,
                  user_ratings_total: undefined,
                  price_level: undefined,
                  cuisine: fallbackCuisine,
                  distanceKm: distance,
                  description: undefined,
                });
            }
          } else {
            console.warn(
              `Failed to fetch details for place ID ${place.id}: ${detailsResponse.status} - ${detailsResponseText || "Unknown error"}. Falling back to Nearby Search data.`
            );
            const distance = userLocation
              ? getDistanceFromLatLonInKm(
                  latitude,
                  longitude,
                  place.location.latitude,
                  place.location.longitude
                )
              : undefined;
            const fallbackCuisine = getCuisineFromPlaceTypes(place.primaryType, place.types || []);

            detailedRestaurants.push({
              id: place.id,
              name: place.displayName?.text || "Unknown Restaurant",
              address: place.formattedAddress || "Address not available",
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || "")}&query_place_id=${place.id}`,
              imageUrl:
                place.photos && place.photos.length > 0
                  ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=400&maxWidthPx=400`
                  : "https://via.placeholder.com/150?text=No+Image",
              latitude: place.location.latitude,
              longitude: place.location.longitude,
              rating: undefined,
              user_ratings_total: undefined,
              price_level: undefined,
              cuisine: fallbackCuisine,
              distanceKm: distance,
              description: undefined,
            });
          }
        }
        detailedRestaurants.sort(
          (a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity)
        );
        setCardStack(detailedRestaurants.slice(0, 25)); 
      } catch (err: unknown) {
        setError(
          `API Fetch Error: ${err instanceof Error ? err.message : String(err)}. Please check your internet connection, API key, and Google Cloud project setup.`
        );
        console.error("API Fetch Error:", err);
      } finally {
        setDataLoading(false);
      }
    },
    [getDistanceFromLatLonInKm, userLocation, GOOGLE_PLACES_API_KEY]
  );
  
  useEffect(() => {
    if (!authLoading && session) {
      const init = async () => {
        await getUserLocation();
      };
      init();
    }
  }, [getUserLocation, authLoading, session]);

  useEffect(() => {
    if (userLocation && !authLoading && session && GOOGLE_PLACES_API_KEY) {
      console.log("Triggering API fetch due to user location, auth status, or API key availability.");
      fetchRestaurantsFromAPI(userLocation.latitude, userLocation.longitude);
    } else if (!GOOGLE_PLACES_API_KEY && !error) {
      setError("Google Places API Key is missing. Please check your app.config.js and .env file.");
      setDataLoading(false);
    }
  }, [userLocation, authLoading, session, GOOGLE_PLACES_API_KEY, error, fetchRestaurantsFromAPI]);

  const onSwipe = (
    direction: "left" | "right",
    swipedRestaurant: Restaurant
  ) => {
    setSwipedHistory((prevHistory) => [
      ...prevHistory,
      { ...swipedRestaurant, direction },
    ]);
    if (direction === "right") {
      addSavedRestaurant(swipedRestaurant);
    }
    setCardStack((currentStack) => currentStack.slice(1));
  };

  const handleReload = async () => {
    setError(null); 
    if (userLocation) {
      setDataLoading(true);
      await fetchRestaurantsFromAPI(userLocation.latitude, userLocation.longitude);
      setSwipedHistory([]);
    } else {
        await getUserLocation();
    }
  };
  
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotateZ.value = animatedRotation.value;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "right" : "left";
        const toValueX = Math.sign(event.translationX) * SCREEN_WIDTH * 1.5;
        const toValueZ = Math.sign(event.translationX) * 45;
        const currentTopCard = cardStack[0];

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
      } else {
        translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
        rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
      }
    });

  const handleUndo = () => {
    if (swipedHistory.length > 0) {
      const lastSwiped = swipedHistory[swipedHistory.length - 1];
      setSwipedHistory((prevHistory) => prevHistory.slice(0, -1));

      setCardStack((prev) => [lastSwiped, ...prev]);

      if (lastSwiped.direction === "right") {
        removeSavedRestaurant(lastSwiped.name);
      }
      translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
      rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
    }
  };

  const handleDiscard = () => {
    if (cardStack.length > 0) {
      const swipedRestaurant = cardStack[0];
      translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 400 });
      rotateZ.value = withTiming(-45, { duration: 400 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onSwipe)("left", swipedRestaurant);
        }
      });
    }
  };

  const handleSelect = () => {
    if (cardStack.length > 0) {
      const swipedRestaurant = cardStack[0];
      translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 400 });
      rotateZ.value = withTiming(45, { duration: 400 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onSwipe)("right", swipedRestaurant);
        }
      });
    }
  };

  const handleNavigateToSaved = () => {
    router.navigate('/(tabs)/SavedRestaurants');
  };

  useEffect(() => {
    if (cardStack.length > 0) {
      translateX.value = 0;
      rotateZ.value = 0;
    }
  }, [cardStack]);

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

  if (dataLoading) {
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
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }


  if (cardStack.length === 0) {
    return <NoMoreCards onReload={handleReload} onSignOut={signOut} />;
  }

  const topCard = cardStack[0];
  const nextCard = cardStack[1];
  const thirdCard = cardStack[2];

  return (
    <View style={styles.container}>
      {/* Conditionally render the top card if available */}
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

      {/* Render the next card behind the top card */}
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

      {/* Render the third card behind the next card */}
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

      {/* Swipe buttons are only rendered if there are cards */}
      {cardStack.length > 0 && (
        <SwipeButtons
          onUndo={handleUndo}
          onDiscard={handleDiscard}
          onSelect={handleSelect}
          canUndo={swipedHistory.length > 0}
          canSwipe={cardStack.length > 0 && !dataLoading && !error}
        />
      )}

      {/* Always render reload and saved button if there are cards */}
      {cardStack.length > 0 && (
        <>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
          <TopRightSavedButton
              savedCount={savedRestaurants.length}
              onPress={handleNavigateToSaved}
          />
        </>
      )}
      {/* Removed the conditional rendering of NoMoreCards here */}
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
    // Removed position: 'relative' as NoMoreCards is no longer absolutely positioned within it
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
    top: 70, // Adjust this based on your layout needs
    height: "70%", // Adjust this based on your layout needs
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
