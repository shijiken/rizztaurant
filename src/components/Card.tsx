// app/components/Card/Card.tsx
// app/components/Card/Card.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'; // Ensure Text is imported
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types/Restaurant';
import { Linking } from 'react-native';

interface CardProps {
    restaurant: Restaurant;
    getPriceLevelString: (level?: number) => string;
}

const Card: React.FC<CardProps> = ({ restaurant, getPriceLevelString }) => {
    const handleOpenMaps = () => {
        if (restaurant.mapsUrl) {
            Linking.openURL(restaurant.mapsUrl).catch(err => console.error('Failed to open URL:', err));
        }
    };

    return (
        <View style={styles.cardContainer}>
            <Image source={{ uri: restaurant.imageUrl }} style={styles.cardImage} />
            <View style={styles.infoContainer}>
                <View>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantAddress}>{restaurant.address}</Text>

                    {restaurant.cuisine && (
                        <Text style={styles.detailText}>
                            <Ionicons name="pizza-outline" size={14} color="#666" /> <Text> {restaurant.cuisine}</Text> {/* <<< Ensure text is wrapped */}
                        </Text>
                    )}

                    {restaurant.rating !== undefined && restaurant.rating > 0 && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={15} color="#FFD700" />
                            <Text style={styles.restaurantRating}>{restaurant.rating.toFixed(1)}</Text>
                            {restaurant.user_ratings_total !== undefined && (
                                <Text style={styles.reviewCountText}> ({restaurant.user_ratings_total} reviews)</Text>
                            )}
                        </View>
                    )}

                    {restaurant.price_level !== undefined && (
                        <Text style={styles.detailText}>
                            <Ionicons name="wallet-outline" size={14} color="#666" /> <Text> {getPriceLevelString(restaurant.price_level)}</Text> {/* <<< Ensure text is wrapped */}
                        </Text>
                    )}

                    {restaurant.distanceKm !== undefined && (
                        <Text style={styles.distanceText}>
                            <Ionicons name="walk-outline" size={14} color="#777" /> <Text> {restaurant.distanceKm.toFixed(2)} km away</Text> {/* <<< Ensure text is wrapped */}
                        </Text>
                    )}
                </View>

                <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
                    <Ionicons name="map-outline" size={20} color="#fff" />
                    <Text style={styles.mapButtonText}>Maps</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ... (styles remain the same) ...

const styles = StyleSheet.create({
    cardContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 8, // Increased shadow for a more lifted look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    cardImage: {
        width: '100%',
        height: '55%', // Keep this around 50-60% based on content
        resizeMode: 'cover',
    },
    infoContainer: {
        flex: 1,
        padding: 18, // Slightly more padding
        justifyContent: 'space-between',
    },
    restaurantName: {
        fontSize: 22, // Slightly smaller for better fit
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4, // Reduced margin
    },
    restaurantAddress: {
        fontSize: 15, // Slightly smaller
        color: '#666',
        marginBottom: 12, // More space after address
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4, // Consistent small margin
    },
    restaurantRating: {
        fontSize: 15, // Consistent with detail text
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    reviewCountText: {
        fontSize: 13, // Smaller review count
        color: '#888',
        marginLeft: 4,
    },
    detailText: {
        fontSize: 15, // Standard size for details
        color: '#555',
        marginBottom: 4, // Consistent small margin
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 15, // Consistent with other details
        color: '#777',
        marginTop: 8, // More space above distance
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapButton: {
        position: 'absolute', // Absolute positioning for bottom-right
        bottom: 15,
        right: 15,
        backgroundColor: '#007aff', // Solid blue for the button
        width: 60, // Fixed width for circular shape
        height: 60, // Fixed height for circular shape
        borderRadius: 30, // Half of width/height for circular shape
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6, // Shadow for the button
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 10, // Very small text for "Maps"
        fontWeight: 'bold',
        marginTop: 2, // Space between icon and text
    },
});

export default Card;