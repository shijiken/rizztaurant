// app/screens/SavedRestaurantsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types/Restaurant'; // Correct path relative to 'app'

interface SavedRestaurantsScreenProps {
    savedRestaurants: Restaurant[];
    onUpdateSavedRestaurants: (newSavedList: Restaurant[]) => void;
}

const SavedRestaurantsScreen: React.FC<SavedRestaurantsScreenProps> = ({ savedRestaurants, onUpdateSavedRestaurants }) => {

    const handleRemoveSaved = (idToRemove: string) => {
        Alert.alert(
            "Remove Restaurant",
            "Are you sure you want to remove this restaurant from your saved list?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Remove",
                    onPress: () => {
                        const newSavedList = savedRestaurants.filter(r => r.id !== idToRemove);
                        onUpdateSavedRestaurants(newSavedList);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Restaurant }) => (
        <View style={styles.listItem}>
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAddress}>{item.address}</Text>
                <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(item.mapsUrl)}>
                    <Ionicons name="map" size={16} color="#007aff" />
                    <Text style={styles.itemLink}>View on Maps</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handleRemoveSaved(item.id)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={24} color="#FF6347" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Your Saved Restaurants</Text>
            {savedRestaurants.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="bookmark-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No saved restaurants yet.</Text>
                    <Text style={styles.emptySubText}>Swipe right on the "Swipe" tab to save some!</Text>
                </View>
            ) : (
                <FlatList
                    data={savedRestaurants}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContentContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ececec',
        paddingTop: 60, // Adjust for status bar and header space
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 16,
        color: '#aaa',
        marginTop: 5,
        textAlign: 'center',
    },
    listContentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    itemContent: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    itemAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    itemLink: {
        fontSize: 14,
        color: '#007aff',
        marginLeft: 5,
        textDecorationLine: 'underline',
    },
    removeButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#ffe5e5',
    },
});

export default SavedRestaurantsScreen;