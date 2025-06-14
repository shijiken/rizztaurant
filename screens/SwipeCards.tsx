import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;

const restaurants = [
  { name: 'Pizza Heaven', address: '123 Main Street', mapsUrl: 'https://www.google.com/maps?q=Pizza+Heaven' },
  { name: 'Sushi Palace', address: '456 Elm Street', mapsUrl: 'https://www.google.com/maps?q=Sushi+Palace' },
  { name: 'Taco Fiesta', address: '789 Oak Avenue', mapsUrl: 'https://www.google.com/maps?q=Taco+Fiesta' }
];

export default function SwipeCards() {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const nextCardScale = useSharedValue(0.8); // Start next card even smaller
  const nextCardOpacity = useSharedValue(0); // Start next card completely transparent

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      console.log('Saved:', restaurants[index].name);
    } else {
      console.log('Discarded:', restaurants[index].name);
    }

    // Immediately animate the next card to its final state
    // We can use withSpring here too for a more natural pop-in
    nextCardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    nextCardOpacity.value = withTiming(1, { duration: 250 }); // Slightly faster fade in

    // The state update and reset happen after the top card finishes its exit animation
    setTimeout(() => {
      const newIndex = (index + 1) % restaurants.length;
      setIndex(newIndex);
      // Reset shared values for the *next* incoming card
      translateX.value = 0;
      rotateZ.value = 0;
      nextCardScale.value = 0.8; // Reset for the new 'next' card
      nextCardOpacity.value = 0; // Reset for the new 'next' card
    }, 250); // Match or slightly less than the top card's exit animation
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotateZ.value = event.translationX / 20;

      // Animate next card to gradually appear and scale as current card is dragged
      // This creates a smooth overlap
      const progress = Math.abs(event.translationX) / (SCREEN_WIDTH / 2); // Calculate progress based on half screen width
      nextCardOpacity.value = withTiming(Math.min(1, progress * 1.5), { duration: 0 }); // No duration, instant update based on drag
      nextCardScale.value = withTiming(Math.min(1, 0.8 + progress * 0.2), { duration: 0 }); // Scale from 0.8 to 1
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > 120) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        const toValue = direction === 'right' ? SCREEN_WIDTH * 2 : -SCREEN_WIDTH * 2;

        translateX.value = withTiming(toValue, { duration: 250 }, () => { // Faster exit duration
          runOnJS(handleSwipe)(direction);
        });
      } else {
        // If not swiped, spring back current card
        translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
        rotateZ.value = withSpring(0, { damping: 12, stiffness: 100 });

        // Spring back next card to its initial hidden state
        nextCardScale.value = withSpring(0.8, { damping: 12, stiffness: 100 });
        nextCardOpacity.value = withSpring(0, { damping: 12, stiffness: 100 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` }
    ]
  }));

  const nextCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nextCardOpacity.value,
    transform: [{ scale: nextCardScale.value }],
  }));

  const current = restaurants[index];
  const next = restaurants[(index + 1) % restaurants.length];

  return (
    <View style={styles.container}>
      {/* Next card below with fade and scale transition */}
      <Animated.View style={[styles.card, styles.nextCard, nextCardAnimatedStyle]}>
        <Text style={styles.title}>{next.name}</Text>
        <Text style={styles.address}>{next.address}</Text>
        <Text style={styles.link} onPress={() => Linking.openURL(next.mapsUrl)}>
          View on Google Maps
        </Text>
      </Animated.View>

      {/* Top swipeable card */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, styles.topCard, animatedStyle]}>
          <Text style={styles.title}>{current.name}</Text>
          <Text style={styles.address}>{current.address}</Text>
          <Text style={styles.link} onPress={() => Linking.openURL(current.mapsUrl)}>
            View on Google Maps
          </Text>
        </Animated.View>
      </GestureDetector>
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
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    position: 'absolute',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  topCard: {
    zIndex: 2
  },
  nextCard: {
    zIndex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  address: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10
  },
  link: {
    fontSize: 16,
    color: '#007aff',
    marginTop: 10
  }
});