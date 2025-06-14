import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Dimensions, Image } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    useDerivedValue,
} from 'react-native-reanimated';

// It's a good practice to define constants outside the component
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

const restaurants = [
    {
        name: 'Botak Jones',
        address: '8 Jurong Town Hall Rd, #02-01',
        mapsUrl: 'https://maps.app.goo.gl/example1',
        imageUrl: 'https://danielfooddiary.com/wp-content/uploads/2021/06/botakjones11.jpg'
    },
    {
        name: 'Mcdonalds Bukit Batok',
        address: 'Blk 632 Bukit Batok Central 01-138',
        mapsUrl: 'https://maps.app.goo.gl/example2',
        imageUrl: 'https://mcdonaldsmenusg.com/wp-content/uploads/2023/12/McDonalds-Bukit-Batok.jpg'
    },
    {
        name: 'Sanook Kitchen',
        address: '1 Bt Batok Central, #03-03 West Mall',
        mapsUrl: 'https://maps.app.goo.gl/example3',
        imageUrl: 'https://ik.imagekit.io/zbv7hxlnw/googleMerchantImages/west-mall/west-mall-sanook-kitchen/00_undefined?tr=w-706%2Cq-70'
    },
    {
        name: 'Burger King',
        address: '2 Jurong East Central 1, #01-07',
        mapsUrl: 'https://maps.app.goo.gl/example4',
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBZP4ZR2B9BaUo5VX7BK9jZ5iyQOTQhlzAJQ&s'
    },
    {
        name: 'KFC',
        address: '1 Jurong West Central 2, #01-44',
        mapsUrl: 'https://maps.app.goo.gl/example5',
        imageUrl: 'https://sgeats.net/wp-content/uploads/2024/01/KFC-Jurong-Point.jpg'
    },
];

export default function SwipeCards() {
    // We'll manage a local version of the restaurants to remove swiped cards
    const [cardStack, setCardStack] = useState(restaurants);

    const translateX = useSharedValue(0);
    const rotateZ = useSharedValue(0);

    // This derived value creates a smoother, more natural rotation effect
    const animatedRotation = useDerivedValue(() => {
        return (translateX.value / SCREEN_WIDTH) * 20;
    });

    const onSwipe = (direction: 'left' | 'right') => {
        const swipedRestaurant = cardStack[0];
        if (direction === 'right') {
            console.log('Saved:', swipedRestaurant.name);
            // Here you would add the restaurant to a "saved" list
        } else {
            console.log('Discarded:', swipedRestaurant.name);
        }

        // A more stable way to handle the state update
        setCardStack((currentStack) => currentStack.slice(1));
    };

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

                translateX.value = withTiming(toValueX, { duration: 400 });
                rotateZ.value = withTiming(toValueZ, { duration: 400 }, (isFinished) => {
                    if (isFinished) {
                        // This callback now safely triggers the state update
                        // AFTER the card is fully off-screen.
                        runOnJS(onSwipe)(direction);
                    }
                });
            } else {
                // Return card to center with a nice spring effect
                translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
                rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });
            }
        });
    
    // Reset shared values when the card stack changes to prevent glitches
    useEffect(() => {
        translateX.value = 0;
        rotateZ.value = 0;
    }, [cardStack]);

    // Animated style for the top card
    const topCardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { rotateZ: `${rotateZ.value}deg` },
        ],
    }));

    // Animated styles for the cards underneath
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

    // We can even add a style for the third card for a deeper stack effect
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
    
    if (cardStack.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.noMoreCardsText}>No more restaurants for now!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {cardStack.map((restaurant, index) => {
                // We only render the top 3 cards for performance
                if (index > 2) {
                    return null;
                }
                
                // Determine the style for each card in the stack
                let animatedStyle;
                if (index === 0) {
                    animatedStyle = topCardAnimatedStyle;
                } else if (index === 1) {
                    animatedStyle = nextCardAnimatedStyle;
                } else {
                    animatedStyle = thirdCardAnimatedStyle;
                }

                const cardContent = (
                    <>
                        <Image source={{ uri: restaurant.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                        <View style={styles.textContainer}>
                           <Text style={styles.title}>{restaurant.name}</Text>
                           <Text style={styles.address}>{restaurant.address}</Text>
                           <Text style={styles.link} onPress={() => Linking.openURL(restaurant.mapsUrl)}>
                               View on Google Maps
                           </Text>
                        </View>
                    </>
                );

                // The top card gets the gesture handler
                if (index === 0) {
                    return (
                        <GestureDetector gesture={pan} key={restaurant.name}>
                            <Animated.View style={[styles.card, {zIndex: cardStack.length - index}, animatedStyle]}>
                                {cardContent}
                            </Animated.View>
                        </GestureDetector>
                    );
                }

                return (
                    <Animated.View style={[styles.card, {zIndex: cardStack.length - index}, animatedStyle]} key={restaurant.name}>
                        {cardContent}
                    </Animated.View>
                );
            }).reverse() /* Reverse to render the stack correctly */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ececec',
        justifyContent: 'center',
        alignItems: 'center'
    },
    card: {
        width: SCREEN_WIDTH - 40,
        height: (SCREEN_WIDTH - 40) * 1.5, // Giving cards a consistent aspect ratio
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
        height: '65%', // Allocate more space for the image
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    textContainer: {
      flex: 1,
      padding: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    address: {
        fontSize: 16,
        color: '#555',
        marginVertical: 10,
    },
    link: {
        fontSize: 16,
        color: '#007aff',
        marginTop: 'auto', // Pushes the link to the bottom
        paddingBottom: 10,
    },
    noMoreCardsText: {
        fontSize: 20,
        color: '#888',
        textAlign: 'center',
        padding: 20,
    }
});