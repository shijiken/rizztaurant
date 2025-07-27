// app/components/Card/Card.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/Restaurant';
import { Linking } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider'; 

interface CardProps {
    restaurant: Restaurant;
    getPriceLevelString: (level?: number | string) => string;
}

const Card: React.FC<CardProps> = ({ restaurant, getPriceLevelString }) => {

    const { theme, isDark } = useTheme();

    const handleOpenMaps = () => {
        if (restaurant.mapsUrl) {
            Linking.openURL(restaurant.mapsUrl).catch(err => console.error('Failed to open URL:', err));
        }
    };

    return (
        <View style={[styles.cardContainer, isDark && darkCardStyles.cardContainer]}>
            <Image
                source={{ uri: restaurant.imageUrl }}
                style={styles.cardImage}
                onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
            />
            <View style={styles.infoContainer}>
                <View>
                    <Text style={[styles.restaurantName, isDark && darkCardStyles.restaurantName]} numberOfLines={2} ellipsizeMode="tail">
                        {restaurant.name}
                    </Text>
                    <Text style={[styles.restaurantAddress, isDark && darkCardStyles.restaurantAddress]} numberOfLines={2} ellipsizeMode="tail">
                        {restaurant.address}
                    </Text>

                    {restaurant.cuisine && (
                        <Text style={[styles.detailText, isDark && darkCardStyles.detailText]}>
                            <Ionicons name="pizza-outline" size={14} color={isDark ? theme.textSecondary : "#666"} />{' '}
                            <Text> {restaurant.cuisine}</Text>
                        </Text>
                    )}

                    {restaurant.rating !== undefined && restaurant.rating !== null && restaurant.rating >= 0 && (
                        <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={restaurant.rating && restaurant.rating >= star ? 'star' : 'star-outline'}
                                    size={15}
                                    color="#FFD700"
                                />
                            ))}
                            <Text style={[styles.restaurantRating, isDark && darkCardStyles.restaurantRating]}>{restaurant.rating.toFixed(1)}</Text>
                            {restaurant.user_ratings_total !== undefined && restaurant.user_ratings_total !== null && (
                                <Text style={[styles.reviewCountText, isDark && darkCardStyles.reviewCountText]}> ({restaurant.user_ratings_total} reviews)</Text>
                            )}
                        </View>
                    )}

                    {restaurant.price_level !== undefined && restaurant.price_level !== null && (
                        <Text style={[styles.detailText, isDark && darkCardStyles.detailText]}>
                            <Ionicons name="wallet-outline" size={14} color={isDark ? theme.textSecondary : "#666"} />{' '}
                            <Text> {getPriceLevelString(restaurant.price_level)}</Text>
                        </Text>
                    )}

                    {restaurant.distanceKm !== undefined && restaurant.distanceKm !== null && (
                        <Text style={[styles.distanceText, isDark && darkCardStyles.distanceText]}>
                            <Ionicons name="walk-outline" size={14} color={isDark ? theme.textTertiary : "#777"} />{' '}
                            <Text> {restaurant.distanceKm.toFixed(2)} km away</Text>
                        </Text>
                    )}
                </View>

                <TouchableOpacity style={[styles.mapButton, isDark && darkCardStyles.mapButton]} onPress={handleOpenMaps}>
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
        height: '48%',
        resizeMode: 'cover',
    },
    infoContainer: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    restaurantAddress: {
        fontSize: 15,
        color: '#666',
        marginBottom: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    restaurantRating: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    reviewCountText: {
        fontSize: 12,
        color: '#888',
        marginLeft: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 14,
        color: '#777',
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
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


const darkCardStyles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#2c2c2e', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    restaurantName: {
        color: '#ffffff', 
    },
    restaurantAddress: {
        color: '#ebebf5', 
    },
    detailText: {
        color: '#ebebf5', 
    },
    restaurantRating: {
        color: '#FFD700', 
    },
    reviewCountText: {
        color: '#8e8e93', 
    },
    distanceText: {
        color: '#8e8e93', 
    },
    mapButton: {
        backgroundColor: '#0a7aff', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.7,
        shadowRadius: 3,
        elevation: 6,
    },
});
export default Card;