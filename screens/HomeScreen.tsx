import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

// Sample restaurant data
const RESTAURANTS = [
  {
    id: '1',
    name: 'Coastal Kitchen',
    image: 'https://api.a0.dev/assets/image?text=Elegant%20restaurant%20interior%20with%20seafood%20dishes&aspect=16:9&seed=123',
    rating: 4.7,
    priceCategory: '$$$',
    cuisine: 'Seafood',
    distance: '0.8 km',
    description: 'Fresh seafood and coastal cuisine in a modern setting with ocean views.',
    menu: ['Grilled Octopus', 'Lobster Roll', 'Clam Chowder', 'Seafood Pasta']
  },
  {
    id: '2',
    name: 'Urban Grill House',
    image: 'https://api.a0.dev/assets/image?text=Modern%20steakhouse%20with%20grill%20and%20dark%20interior&aspect=16:9&seed=456',
    rating: 4.5,
    priceCategory: '$$$$',
    cuisine: 'Steakhouse',
    distance: '1.2 km',
    description: 'Premium cuts of meat grilled to perfection in a sophisticated atmosphere.',
    menu: ['Filet Mignon', 'Ribeye Steak', 'Lamb Chops', 'Truffle Mac & Cheese']
  },
  {
    id: '3',
    name: 'Spice Garden',
    image: 'https://api.a0.dev/assets/image?text=Colorful%20Indian%20restaurant%20with%20spices%20and%20curries&aspect=16:9&seed=789',
    rating: 4.2,
    priceCategory: '$$',
    cuisine: 'Indian',
    distance: '0.5 km',
    description: 'Authentic Indian flavors with a modern twist in a vibrant setting.',
    menu: ['Butter Chicken', 'Vegetable Biryani', 'Garlic Naan', 'Lamb Vindaloo']
  },
  {
    id: '4',
    name: 'La Trattoria',
    image: 'https://api.a0.dev/assets/image?text=Cozy%20Italian%20restaurant%20with%20pasta%20dishes&aspect=16:9&seed=101',
    rating: 4.6,
    priceCategory: '$$$',
    cuisine: 'Italian',
    distance: '1.8 km',
    description: 'Family-owned Italian eatery serving traditional recipes passed down generations.',
    menu: ['Homemade Lasagna', 'Margherita Pizza', 'Fettuccine Alfredo', 'Tiramisu']
  },
  {
    id: '5',
    name: 'Sushi Wave',
    image: 'https://api.a0.dev/assets/image?text=Japanese%20sushi%20restaurant%20with%20elegant%20presentation&aspect=16:9&seed=202',
    rating: 4.8,
    priceCategory: '$$$$',
    cuisine: 'Japanese',
    distance: '1.1 km',
    description: 'Premium sushi and Japanese specialties with artistic presentation.',
    menu: ['Omakase Selection', 'Dragon Roll', 'Toro Sashimi', 'Wagyu Hot Pot']
  }
];

const HomeScreen = () => {
  const [restaurants, setRestaurants] = useState(RESTAURANTS);
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [recentlyDismissed, setRecentlyDismissed] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.5, 1],
    extrapolate: 'clamp'
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp'
  });
  
  const navigation = useNavigation();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const swipeRight = useCallback(() => {
    const currentRestaurant = restaurants[cardIndex];
    
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => {
      setSavedRestaurants(prev => [...prev, currentRestaurant]);
      setCardIndex(prevIndex => prevIndex + 1);
      position.setValue({ x: 0, y: 0 });
    });
  }, [cardIndex, restaurants, position]);

  const swipeLeft = useCallback(() => {
    const currentRestaurant = restaurants[cardIndex];
    
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => {
      setRecentlyDismissed(prev => [currentRestaurant, ...prev]);
      setCardIndex(prevIndex => prevIndex + 1);
      position.setValue({ x: 0, y: 0 });
    });
  }, [cardIndex, restaurants, position]);

  const undoLastDismiss = () => {
    if (recentlyDismissed.length === 0) return;
    
    const lastDismissed = recentlyDismissed[0];
    setRecentlyDismissed(prev => prev.slice(1));
    setCardIndex(prevIndex => prevIndex - 1);
    
    // Animate the card coming back from left
    position.setValue({ x: -SCREEN_WIDTH - 100, y: 0 });
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start();
  };

  const renderNoMoreCards = () => {
    return (
      <View style={styles.noMoreCardsContainer}>
        <Text style={styles.noMoreCardsText}>No More Restaurants</Text>
        <Text style={styles.noMoreCardsSubText}>You've seen all the restaurants in your area</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => setCardIndex(0)}
        >
          <Text style={styles.refreshButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCard = (restaurant, index) => {
    if (index < cardIndex) return null;
    
    if (index === cardIndex) {
      return (
        <Animated.View
          key={restaurant.id}
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotation }
              ],
              zIndex: 1
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View style={[styles.overlayLabel, styles.likeLabel, {opacity: likeOpacity}]}>
            <Text style={styles.overlayLabelText}>SAVE</Text>
          </Animated.View>
          <Animated.View style={[styles.overlayLabel, styles.dislikeLabel, {opacity: dislikeOpacity}]}>
            <Text style={styles.overlayLabelText}>NOPE</Text>
          </Animated.View>
          
          <Image source={{ uri: restaurant.image }} style={styles.cardImage} />
          <View style={styles.cardDetails}>
            <View style={styles.nameRatingContainer}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{restaurant.rating}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
              <Text style={styles.priceDistance}>{restaurant.priceCategory} • {restaurant.distance}</Text>
            </View>
            
            <Text style={styles.description} numberOfLines={2}>{restaurant.description}</Text>
            
            <View style={styles.menuContainer}>
              <Text style={styles.menuTitle}>Popular Menu Items:</Text>
              <View style={styles.menuItems}>
                {restaurant.menu.map((item, idx) => (
                  <View key={idx} style={styles.menuItem}>
                    <Text style={styles.menuItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    // Next card in stack (scaled down)
    if (index === cardIndex + 1) {
      return (
        <Animated.View
          key={restaurant.id}
          style={[
            styles.cardContainer, {
              transform: [{ scale: nextCardScale }],
              opacity: nextCardOpacity
            }
          ]}
        >
          <Image source={{ uri: restaurant.image }} style={styles.cardImage} />
          <View style={styles.cardDetails}>
            <View style={styles.nameRatingContainer}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{restaurant.rating}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
              <Text style={styles.priceDistance}>{restaurant.priceCategory} • {restaurant.distance}</Text>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return null;
  };

  const navigateToSaved = () => {
    // In a real app, we would navigate to a saved screen
    // navigation.navigate('SavedRestaurants', { savedRestaurants });
    alert(`You have ${savedRestaurants.length} saved restaurants`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Restaurants</Text>
        <TouchableOpacity onPress={navigateToSaved} style={styles.savedButton}>
          <MaterialIcons name="bookmark" size={28} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardsContainer}>
        {cardIndex >= restaurants.length 
          ? renderNoMoreCards()
          : restaurants.map((restaurant, index) => renderCard(restaurant, index)).reverse()
        }
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={[styles.button, styles.undoButton]} onPress={undoLastDismiss} disabled={recentlyDismissed.length === 0}>
          <Ionicons name="arrow-undo" size={24} color={recentlyDismissed.length === 0 ? "#CCCCCC" : "#FFD700"} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dislikeButton]} onPress={swipeLeft}>
          <Ionicons name="close" size={30} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.likeButton]} onPress={swipeRight}>
          <Ionicons name="bookmark" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  savedButton: {
    padding: 5,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '50%',
  },
  cardDetails: {
    padding: 20,
  },
  nameRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rating: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
  },
  priceDistance: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 15,
    color: '#555',
    marginBottom: 15,
    lineHeight: 20,
  },
  menuContainer: {
    marginTop: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  menuItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#555',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  undoButton: {
    backgroundColor: 'white',
  },
  dislikeButton: {
    backgroundColor: 'white',
  },
  likeButton: {
    backgroundColor: '#FF6B6B',
  },
  overlayLabel: {
    position: 'absolute',
    padding: 10,
    borderWidth: 3,
    borderRadius: 10,
    zIndex: 2,
    top: '10%',
    transform: [{ rotate: '30deg' }],
  },
  likeLabel: {
    right: 40,
    borderColor: '#4CD964',
  },
  dislikeLabel: {
    left: 40,
    borderColor: '#FF6B6B',
  },
  overlayLabelText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  noMoreCardsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noMoreCardsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noMoreCardsSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default HomeScreen;