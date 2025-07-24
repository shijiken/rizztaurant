// app/components/Card/Card.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/Restaurant'; // Assuming src/types/Restaurant.ts
import { Linking } from 'react-native';

interface CardProps {
    restaurant: Restaurant;
    getPriceLevelString: (level?: number | string) => string; // Updated to accept string for priceLevel
}

const Card: React.FC<CardProps> = ({ restaurant, getPriceLevelString }) => {
    const handleOpenMaps = () => {
        if (restaurant.mapsUrl) {
            Linking.openURL(restaurant.mapsUrl).catch(err => console.error('Failed to open URL:', err));
        }
    };

    return (
        <View style={styles.cardContainer}>
            <Image
                source={{ uri: restaurant.imageUrl }}
                style={styles.cardImage}
                onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
            />
            <View style={styles.infoContainer}>
                <View>
                    <Text style={styles.restaurantName} numberOfLines={2} ellipsizeMode="tail">
                        {restaurant.name}
                    </Text>
                    <Text style={styles.restaurantAddress} numberOfLines={2} ellipsizeMode="tail">
                        {restaurant.address}
                    </Text>

                    {restaurant.cuisine && (
                        <Text style={styles.detailText}>
                            <Ionicons name="pizza-outline" size={14} color="#666" /> <Text> {restaurant.cuisine}</Text>
                        </Text>
                    )}

                    {/* Dynamic Star Rating Display */}
                    {restaurant.rating !== undefined && restaurant.rating !== null && restaurant.rating >= 0 && (
                        <View style={styles.ratingContainer}>
                            {/* Render 5 star icons */}
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={restaurant.rating && restaurant.rating >= star ? 'star' : 'star-outline'}
                                    size={15}
                                    color="#FFD700"
                                />
                            ))}
                            <Text style={styles.restaurantRating}>{restaurant.rating.toFixed(1)}</Text>
                            {restaurant.user_ratings_total !== undefined && restaurant.user_ratings_total !== null && (
                                <Text style={styles.reviewCountText}> ({restaurant.user_ratings_total} reviews)</Text>
                            )}
                        </View>
                    )}

                    {restaurant.price_level !== undefined && restaurant.price_level !== null && (
                        <Text style={styles.detailText}>
                            <Ionicons name="wallet-outline" size={14} color="#666" /> <Text> {getPriceLevelString(restaurant.price_level)}</Text>
                        </Text>
                    )}

                    {restaurant.distanceKm !== undefined && restaurant.distanceKm !== null && (
                        <Text style={styles.distanceText}>
                            <Ionicons name="walk-outline" size={14} color="#777" /> <Text> {restaurant.distanceKm.toFixed(2)} km away</Text>
                        </Text>
                    )}

                    {/* {restaurant.description && (
                        <Text style={styles.descriptionText} numberOfLines={3} ellipsizeMode="tail">
                            {restaurant.description}
                        </Text>
                    )} */}
                </View>

                <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
                    <Ionicons name="map-outline" size={20} color="#fff" />
                    <Text style={styles.mapButtonText}>Maps</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    cardImage: {
        width: '100%',
        height: '48%', // Adjusted: Slightly smaller image height
        resizeMode: 'cover',
    },
    infoContainer: {
        flex: 1,
        padding: 16, // Slightly reduced padding
        justifyContent: 'space-between',
    },
    restaurantName: {
        fontSize: 20, // Adjusted: Smaller font size for title
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2, // Reduced margin
    },
    restaurantAddress: {
        fontSize: 15, // Adjusted: Smaller font size for address
        color: '#666',
        marginBottom: 10, // Maintained space after address
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    restaurantRating: {
        fontSize: 14, // Consistent with detail text
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    reviewCountText: {
        fontSize: 12, // Adjusted: Smaller review count
        color: '#888',
        marginLeft: 4,
    },
    detailText: {
        fontSize: 14, // Adjusted: Standard size for details
        color: '#555',
        marginBottom: 2, // Reduced margin
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 14, // Consistent with other details
        color: '#777',
        marginTop: 6, // Reduced space above distance
        flexDirection: 'row',
        alignItems: 'center',
    },
    descriptionText: {
        fontSize: 13, // Adjusted: Smaller font for description
        color: '#444',
        marginTop: 8,
        lineHeight: 18, // Slightly reduced line height
    },
    mapButton: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: '#007aff',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
});

export default Card;
