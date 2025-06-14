// screens/SavedRestaurantsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

// Define the type for a restaurant item for better type safety
interface Restaurant {
    id: string; // Ensure you have unique IDs for your restaurants
    name: string;
    address: string;
    mapsUrl: string;
    imageUrl: string;
}

// Define props for the SavedRestaurantsScreen
interface SavedRestaurantsScreenProps {
    navigation: any; // React Navigation's navigation prop
    route: any;      // React Navigation's route prop (though we're not using params from here anymore)
    savedRestaurants: Restaurant[]; // This is the new prop carrying the saved data
}

const SavedRestaurantsScreen: React.FC<SavedRestaurantsScreenProps> = ({ savedRestaurants }) => {
    const navigation = useNavigation(); // Get the navigation object

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* Back button uses navigation.goBack() to go back within the current tab's stack */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Saved Restaurants</Text>
            </View>
            {savedRestaurants.length === 0 ? (
                <Text style={styles.noSavedText}>You haven't saved any restaurants yet!</Text>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    {savedRestaurants.map((restaurant) => (
                        <View key={restaurant.id} style={styles.restaurantCard}>
                            <Image
                                source={{ uri: restaurant.imageUrl }}
                                style={styles.cardImage}
                                resizeMode="cover"
                                onError={(e) => console.log('Image Load Error', e.nativeEvent.error)}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                                <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
                                <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(restaurant.mapsUrl)}>
                                    <Ionicons name="map" size={18} color="#007aff" />
                                    <Text style={styles.link}>View on Google Maps</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ececec',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingTop: 50, // Adjust for status bar/notch
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 2 },
    },
    backButton: {
        paddingRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    noSavedText: {
        fontSize: 18,
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        padding: 15,
    },
    restaurantCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
    },
    cardImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0', // Placeholder background
    },
    cardContent: {
        padding: 15,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    restaurantAddress: {
        fontSize: 15,
        color: '#666',
        marginBottom: 10,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    link: {
        fontSize: 15,
        color: '#007aff',
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
});

export default SavedRestaurantsScreen;