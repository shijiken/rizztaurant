// app/screens/SwipeCardsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
  Button,
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
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Card from "@/src/components/Card";
import SwipeButtons from "@/src/components/SwipeButtons";
import NoMoreCards from "@/src/components/NoMoreCards";
import TopRightSavedButton from "@/src/components/TopRightSavedButton";
import { Restaurant } from "@/src/types/Restaurant";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const GOOGLE_PLACES_API_KEY = "AIzaSyBz74I__Xu--J7zj2RA0zhyuf9ausHLPZc"; // <<< REMEMBER TO REPLACE THIS

interface SwipeCardsScreenProps {
  navigation: any;
  route: any;
  onUpdateSavedRestaurants: (newSavedList: Restaurant[]) => void;
}

const SwipeCardsScreen: React.FC<SwipeCardsScreenProps> = ({
  navigation,
  onUpdateSavedRestaurants,
}) => {
  // --- All Hooks must be called unconditionally at the top level ---
  // This ensures React's Rules of Hooks are followed and prevents the "change in order" error.
  const { session, loading: authLoading } = useAuth();

  const [cardStack, setCardStack] = useState<Restaurant[]>([]);
  const [swipedHistory, setSwipedHistory] = useState<
    ({ direction: "left" | "right" } & Restaurant)[]
  >([]);
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);

  const [dataLoading, setDataLoading] = useState(true); // State for data fetching loading
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
    } else {
      // Android
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message:
              "This app needs access to your location to find nearby restaurants.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
  };

  const getUserLocation = useCallback(async () => {
    setDataLoading(true);
    setError(null);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setDataLoading(false);
      return;
    }

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
    } catch (err: any) {
      setError(
        `Error getting location: ${err.message}. Please enable location services and try again.`
      );
      console.error(err);
      setDataLoading(false);
    }
  }, []);

  const getPriceLevelString = (level?: number) => {
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

  const getCuisineFromTypes = (types: string[]): string | undefined => {
    const cuisineKeywords = [
      "japanese",
      "italian",
      "indian",
      "chinese",
      "thai",
      "mexican",
      "american",
      "french",
      "mediterranean",
      "korean",
      "vietnamese",
      "sushi",
      "pizza",
      "burger",
      "seafood",
      "steak_house",
      "barbecue",
      "vegan",
      "vegetarian",
      "cafe",
      "bakery",
      "dessert",
      "deli",
      "fast_food",
      "asian",
      "brazilian",
      "greek",
      "middle_eastern",
    ];
    for (const type of types) {
      const matchingKeyword = cuisineKeywords.find((kw) => type.includes(kw));
      if (matchingKeyword) {
        return matchingKeyword
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }
    if (types.includes("restaurant")) return "Restaurant";
    if (types.includes("food")) return "Food";
    return undefined;
  };

  const fetchRestaurantsFromAPI = useCallback(
    async (latitude: number, longitude: number) => {
      setDataLoading(true);
      setError(null);
      try {
        const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
        console.log("Nearby Search URL:", nearbySearchUrl);

        const nearbyResponse = await fetch(nearbySearchUrl);
        const nearbyData = await nearbyResponse.json();

        if (nearbyData.status !== "OK" || nearbyData.results.length === 0) {
          if (nearbyData.status === "ZERO_RESULTS") {
            setError(
              "No restaurants found near your location. Try adjusting your location or search radius."
            );
          } else {
            setError(
              `API Error (Nearby Search): ${nearbyData.status} - ${
                nearbyData.error_message || "Unknown error"
              }`
            );
            console.error("Nearby Search Response:", nearbyData);
          }
          setCardStack([]);
          setDataLoading(false);
          return;
        }

        const detailedRestaurants: Restaurant[] = [];
        for (const place of nearbyData.results) {
          const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,rating,price_level,photos,url,website,reviews,types,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
          console.log("Place Details URL:", placeDetailsUrl);

          const detailsResponse = await fetch(placeDetailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status === "OK" && detailsData.result) {
            const result = detailsData.result;

            const distance = getDistanceFromLatLonInKm(
              latitude,
              longitude,
              result.geometry.location.lat,
              result.geometry.location.lng
            );

            const cuisine = getCuisineFromTypes(result.types || []);

            detailedRestaurants.push({
              id: result.place_id,
              name: result.name,
              address: result.formatted_address,
              mapsUrl:
                result.url ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  result.name
                )}&query_place_id=${result.place_id}`,
              imageUrl:
                result.photos && result.photos.length > 0
                  ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
                  : "https://via.placeholder.com/150?text=No+Image",
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              rating: result.rating,
              user_ratings_total: result.user_ratings_total,
              price_level: result.price_level,
              cuisine: cuisine,
              distanceKm: distance,
            });
          } else {
            console.warn(
              `Failed to fetch details for place ID ${place.place_id}: ${detailsData.status}`
            );
            const distance = userLocation
              ? getDistanceFromLatLonInKm(
                  latitude,
                  longitude,
                  place.geometry.location.lat,
                  place.geometry.location.lng
                )
              : undefined;
            detailedRestaurants.push({
              id: place.place_id,
              name: place.name,
              address: place.vicinity || "Address not available",
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                place.name
              )}&query_place_id=${place.place_id}`,
              imageUrl: "https://via.placeholder.com/150?text=No+Image",
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              rating: place.rating || 0,
              user_ratings_total: 0,
              price_level: place.price_level,
              distanceKm: distance,
            });
          }
        }
        detailedRestaurants.sort(
          (a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity)
        );
        setCardStack(detailedRestaurants);
      } catch (err: any) {
        setError(
          `Network error: ${err.message}. Please check your internet connection.`
        );
        console.error("API Fetch Error:", err);
      } finally {
        setDataLoading(false);
      }
    },
    [getDistanceFromLatLonInKm, userLocation]
  );

  useEffect(() => {
    // Only fetch location if authentication is not loading and session is present
    if (!authLoading && session) {
      const init = async () => {
        await getUserLocation();
      };
      init();
    }
  }, [getUserLocation, authLoading, session]);

  useEffect(() => {
    // Only fetch restaurants if userLocation is available, auth is not loading, and session exists
    if (userLocation && !authLoading && session) {
      fetchRestaurantsFromAPI(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, fetchRestaurantsFromAPI, authLoading, session]);

  const onSwipe = (
    direction: "left" | "right",
    swipedRestaurant: Restaurant
  ) => {
    setSwipedHistory((prevHistory) => [
      ...prevHistory,
      { ...swipedRestaurant, direction },
    ]);
    if (direction === "right") {
      const newSaved = [...savedRestaurants, swipedRestaurant];
      setSavedRestaurants(newSaved);
      onUpdateSavedRestaurants(newSaved);
    }
    setCardStack((currentStack) => currentStack.slice(1));
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
        const newSaved = savedRestaurants.filter((r) => r.id !== lastSwiped.id);
        setSavedRestaurants(newSaved);
        onUpdateSavedRestaurants(newSaved);
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
    navigation.navigate("SavedTab");
  };

  useEffect(() => {
    if (cardStack.length > 0) { // Only reset if there are cards to show
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

  // --- Conditional Render Logic (after all Hooks are called) ---

  // 1. Handle authentication loading state
  if (authLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.statusText}>Checking authentication...</Text>
      </View>
    );
  }

  // 2. Handle unauthenticated user redirection
  if (!session) {
    return <Redirect href={"/(auth)/sign-in"} />;
  }

  // 3. Handle data loading state (after auth is confirmed)
  if (dataLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.statusText}>Finding restaurants near you...</Text>
      </View>
    );
  }

  // 4. Handle errors during data fetching
  if (error) {
    return (
      <View style={styles.statusContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6347" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>
          Please ensure location services are enabled.
        </Text>
      </View>
    );
  }

  // 5. Handle no more cards (after all other loading/error states)
  if (cardStack.length === 0) {
    return <NoMoreCards />;
  }

  // 6. Main render method for when data is ready and cards exist
  return (
    <View style={styles.container}>
      {cardStack
          .map((restaurant, index) => {
            if (index > 2) return null; // Only render the top 3 cards for performance/visuals

            const animatedStyle =
              index === 0
                ? topCardAnimatedStyle
                : index === 1
                ? nextCardAnimatedStyle
                : thirdCardAnimatedStyle;

            const card = (
              <Animated.View
                style={[
                  styles.card,
                  { zIndex: cardStack.length - index }, // Ensure correct stacking order
                  animatedStyle,
                ]}
                key={restaurant.id}
              >
                <Card
                  restaurant={restaurant}
                  getPriceLevelString={getPriceLevelString}
                />
              </Animated.View>
            );

            // Only the top card should be interactive with GestureDetector
            return index === 0 ? (
              <GestureDetector gesture={pan} key={restaurant.id}>
                {card}
              </GestureDetector>
            ) : (
              card
            );
          })
          .reverse() // Reverse to render the top card last, making it appear on top
      }

      <SwipeButtons
        onUndo={handleUndo}
        onDiscard={handleDiscard}
        onSelect={handleSelect}
        canUndo={swipedHistory.length > 0}
        canSwipe={cardStack.length > 0 && !dataLoading && !error}
      />

      {cardStack.length > 0 && ( // Only show the saved button if there are cards (or potential cards)
        <TopRightSavedButton
          savedCount={savedRestaurants.length}
          onPress={handleNavigateToSaved}
        />
      )}
      <Button onPress={() => supabase.auth.signOut()} title="Sign out" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ececec",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100, // Adjust this if buttons are hidden
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * 1.5,
    backgroundColor: "#fff",
    borderRadius: 20,
    position: "absolute",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    overflow: "hidden", // Ensures content stays within rounded corners
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: "#555",
    marginTop: 15,
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF6347",
    marginTop: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  retryText: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    textAlign: "center",
  },
});

export default SwipeCardsScreen;
