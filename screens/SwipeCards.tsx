// screens/SwipeCards.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Dimensions, Image, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    useDerivedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

// Define a type for your restaurant object for better type safety
interface Restaurant {
    id: string; // Ensure you have unique IDs for your restaurants
    name: string;
    address: string;
    mapsUrl: string;
    imageUrl: string;
}

const restaurants: Restaurant[] = [
    { id: '1', name: 'Botak Jones', address: '8 Jurong Town Hall Rd, #02-01', mapsUrl: 'https://maps.app.goo.gl/example1', imageUrl: 'https://danielfooddiary.com/wp-content/uploads/2021/06/botakjones11.jpg' },
    { id: '2', name: 'Mcdonalds Bukit Batok', address: 'Blk 632 Bukit Batok Central 01-138', mapsUrl: 'https://maps.app.goo.gl/example2', imageUrl: 'https://mcdonaldsmenusg.com/wp-content/uploads/2023/12/McDonalds-Bukit-Batok.jpg' },
    { id: '3', name: 'Sanook Kitchen', address: '1 Bt Batok Central, #03-03 West Mall', mapsUrl: 'https://www.google.com/maps/place/Sanook+Kitchen/@1.3615413,103.7469799,17z/data=!3m1!4b1!4m6!3m5!1s0x31da103d158eb43d:0xddf1d4dd4b54e2dd!8m2!3d1.3615413!4d103.7469799!16s%2Fg%2F11b6gj5k_m?entry=ttu', imageUrl: 'https://ik.imagekit.io/zbv7hxlnw/googleMerchantImages/west-mall/west-mall-sanook-kitchen/00_undefined?tr=w-706%2Cq-70' },
    { id: '4', name: 'Burger King', address: '2 Jurong East Central 1, #01-07', mapsUrl: 'https://maps.app.goo.gl/example4', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBZP4ZR2B9BaUo5VX7BK9jZ5iyQOTQhlzAJQ&s' },
    { id: '5', name: 'KFC', address: '1 Jurong West Central 2, #01-44', mapsUrl: 'https://maps.app.goo.gl/example5', imageUrl: 'https://sgeats.net/wp-content/uploads/2024/01/KFC-Jurong-Point.jpg' },
];

// Define props for SwipeCardsScreen to accept the updater function
interface SwipeCardsScreenProps {
    navigation: any; // React Navigation's navigation prop
    route: any;      // React Navigation's route prop
    onUpdateSavedRestaurants: (newSavedList: Restaurant[]) => void; // Function from AppNavigator to update central state
}

const SwipeCardsScreen: React.FC<SwipeCardsScreenProps> = ({ navigation, onUpdateSavedRestaurants }) => {
    // We initialize cardStack with the full list of restaurants.
    // In a real app, this might come from an API or a larger data store.
    const [cardStack, setCardStack] = useState<Restaurant[]>(restaurants);
    // swipedHistory keeps track of cards that have been swiped away, for undo functionality
    const [swipedHistory, setSwipedHistory] = useState<({ direction: 'left' | 'right' } & Restaurant)[]>([]);
    // savedRestaurants is now local to this component and will be passed up to AppNavigator
    const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);

    // Shared values for Reanimated animations
    const translateX = useSharedValue(0);
    const rotateZ = useSharedValue(0);

    const animatedRotation = useDerivedValue(() => {
        return (translateX.value / SCREEN_WIDTH) * 20;
    });

    // Callback when a card is swiped (either by gesture or button press)
    const onSwipe = (direction: 'left' | 'right', swipedRestaurant: Restaurant) => {
        // Add the swiped card to history along with the direction it was swiped
        setSwipedHistory((prevHistory) => [...prevHistory, { ...swipedRestaurant, direction }]);

        if (direction === 'right') {
            console.log('Saved:', swipedRestaurant.name);
            const newSaved = [...savedRestaurants, swipedRestaurant];
            setSavedRestaurants(newSaved); // Update local state
            onUpdateSavedRestaurants(newSaved); // IMPORTANT: Propagate the change to AppNavigator's central state
        } else {
            console.log('Discarded:', swipedRestaurant.name);
        }
        // Remove the top card from the stack
        setCardStack((currentStack) => currentStack.slice(1));
    };

    // Gesture handler for card swiping
    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            rotateZ.value = animatedRotation.value;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                const toValueX = Math.sign(event.translationX) * SCREEN_WIDTH * 1.5;
                const toValueZ = Math.sign(event.translationX) * 45;

                const currentTopCard = cardStack[0];

                translateX.value = withTiming(toValueX, { duration: 400 });
                rotateZ.value = withTiming(toValueZ, { duration: 400 }, (isFinished) => {
                    if (isFinished) {
                        runOnJS(onSwipe)(direction, currentTopCard);
                    }
                });
            } else {
                // Return card to original position with spring animation
                translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
                rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
            }
        });

    // Handler for the "Undo" button
    const handleUndo = () => {
        if (swipedHistory.length > 0) {
            const lastSwiped = swipedHistory[swipedHistory.length - 1]; // Get the last swiped card from history
            setSwipedHistory((prevHistory) => prevHistory.slice(0, -1)); // Remove it from history

            // Add the card back to the front of the cardStack
            setCardStack((prev) => [lastSwiped, ...prev]);

            // If it was a "saved" card, remove it from the local saved list and update central state
            if (lastSwiped.direction === 'right') {
                const newSaved = savedRestaurants.filter(r => r.id !== lastSwiped.id);
                setSavedRestaurants(newSaved);
                onUpdateSavedRestaurants(newSaved); // Update the central state
            }

            // Animate the card back into view
            translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
            rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
        }
    };

    // Handler for the "Discard" button
    const handleDiscard = () => {
        if (cardStack.length > 0) {
            const swipedRestaurant = cardStack[0];
            translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 400 }); // Animate off to the left
            rotateZ.value = withTiming(-45, { duration: 400 }, (isFinished) => {
                if (isFinished) {
                    runOnJS(onSwipe)('left', swipedRestaurant);
                }
            });
        }
    };

    // Handler for the "Select" button
    const handleSelect = () => {
        if (cardStack.length > 0) {
            const swipedRestaurant = cardStack[0];
            translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 400 }); // Animate off to the right
            rotateZ.value = withTiming(45, { duration: 400 }, (isFinished) => {
                if (isFinished) {
                    runOnJS(onSwipe)('right', swipedRestaurant);
                }
            });
        }
    };

    // Function to navigate to the 'Saved' tab
    const handleNavigateToSaved = () => {
        navigation.navigate('SavedTab'); // Navigate to the 'Saved' tab name as defined in AppNavigator
    };

    // Reset animations when cardStack changes (new card comes to top)
    useEffect(() => {
        translateX.value = 0;
        rotateZ.value = 0;
    }, [cardStack]);

    // Animated styles for the top card (being swiped)
    const topCardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { rotateZ: `${rotateZ.value}deg` },
        ],
    }));

    // Animated styles for the second card in the stack
    const nextCardAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: withSpring(0.9 + Math.min(0.1, Math.abs(translateX.value / SCREEN_WIDTH) * 0.2)),
                },
            ],
            opacity: withSpring(0.8 + Math.min(0.2, Math.abs(translateX.value / SCREEN_WIDTH))),
        };
    });

    // Animated styles for the third card in the stack
    const thirdCardAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: withSpring(0.8 + Math.min(0.1, Math.abs(translateX.value / SCREEN_WIDTH) * 0.2)),
                },
            ],
             opacity: withSpring(0.6 + Math.min(0.2, Math.abs(translateX.value / SCREEN_WIDTH))),
        };
    });

    return (
        <View style={styles.container}>
            {cardStack.length === 0 ? (
                // Display when no more cards are left
                <View style={styles.noMoreCardsContainer}>
                    <Text style={styles.noMoreCardsText}>No more restaurants for now!</Text>
                    {/* <TouchableOpacity style={styles.viewSavedButton} onPress={handleNavigateToSaved}>
                        <Ionicons name="bookmark" size={24} color="#fff" />
                        <Text style={styles.viewSavedButtonText}>View Saved ({savedRestaurants.length})</Text>
                    </TouchableOpacity> */}
                </View>
            ) : (
                // Map and render the cards (up to 3 for performance/visuals)
                cardStack.map((restaurant, index) => {
                    if (index > 2) { // Only render the top 3 cards for performance
                        return null;
                    }

                    let animatedStyle;
                    if (index === 0) {
                        animatedStyle = topCardAnimatedStyle; // Apply swipe animation to the top card
                    } else if (index === 1) {
                        animatedStyle = nextCardAnimatedStyle; // Apply subtle animation to the next card
                    } else {
                        animatedStyle = thirdCardAnimatedStyle; // Apply subtle animation to the third card
                    }

                    const cardContent = (
                        <>
                            <Image source={{ uri: restaurant.imageUrl }} style={styles.cardImage} resizeMode="cover" onError={(e) => console.log('Image Load Error', e.nativeEvent.error)} />
                            <View style={styles.textContainer}>
                               <Text style={styles.title}>{restaurant.name}</Text>
                               <Text style={styles.address}>{restaurant.address}</Text>
                               <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(restaurant.mapsUrl)}>
                                    <Ionicons name="map" size={16} color="#007aff" />
                                    <Text style={styles.link}>View on Google Maps</Text>
                               </TouchableOpacity>
                            </View>
                        </>
                    );

                    if (index === 0) {
                        // Only the top card is interactive with gestures
                        return (
                            <GestureDetector gesture={pan} key={restaurant.id}>
                                <Animated.View style={[styles.card, {zIndex: cardStack.length - index}, animatedStyle]}>
                                    {cardContent}
                                </Animated.View>
                            </GestureDetector>
                        );
                    }

                    // Other cards are just visual, not interactive
                    return (
                        <Animated.View style={[styles.card, {zIndex: cardStack.length - index}, animatedStyle]} key={restaurant.id}>
                            {cardContent}
                        </Animated.View>
                    );
                }).reverse() // Reverse the array to render the stack correctly (bottom card first)
            )}

            {/* Buttons for interaction (Undo, Discard, Select) */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.undoButton, swipedHistory.length === 0 && styles.buttonDisabled]}
                    onPress={handleUndo}
                    disabled={swipedHistory.length === 0} // Disable if no history to undo
                >
                    <Ionicons name="reload-circle-outline" size={30} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.discardButton]} onPress={handleDiscard} disabled={cardStack.length === 0}>
                    <Ionicons name="close-circle-outline" size={40} color="#FF6347" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.selectButton]} onPress={handleSelect} disabled={cardStack.length === 0}>
                    <Ionicons name="checkmark-circle-outline" size={40} color="#3CB371" />
                </TouchableOpacity>
            </View>

            {/* Top right "Saved" button (always visible when cards are present) */}
            {cardStack.length > 0 && (
                <TouchableOpacity style={styles.topRightButton} onPress={handleNavigateToSaved}>
                    <Ionicons name="bookmark-outline" size={24} color="#555" />
                    <Text style={styles.topRightButtonText}>Saved ({savedRestaurants.length})</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ececec',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Make space for the fixed buttons
    },
    card: {
        width: SCREEN_WIDTH - 40,
        height: (SCREEN_WIDTH - 40) * 1.5,
        backgroundColor: '#fff',
        borderRadius: 20,
        position: 'absolute',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '65%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: '#f0f0f0', // Placeholder background
    },
    textContainer: {
      flex: 1,
      padding: 15,
      justifyContent: 'space-between', // Push link to bottom
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    address: {
        fontSize: 16,
        color: '#555',
        marginVertical: 10,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    link: {
        fontSize: 16,
        color: '#007aff',
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
    noMoreCardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noMoreCardsText: {
        fontSize: 20,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    viewSavedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    viewSavedButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 30,
        width: '80%',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 10,
    },
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    undoButton: {
        backgroundColor: '#e0e0e0',
    },
    discardButton: {
        backgroundColor: '#ffe0e0',
    },
    selectButton: {
        backgroundColor: '#e0ffe0',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    topRightButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        zIndex: 5,
    },
    topRightButtonText: {
        marginLeft: 5,
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    }
});

export default SwipeCardsScreen;