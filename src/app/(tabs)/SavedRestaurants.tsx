// src/app/screens/SavedRestaurants.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/Restaurant';
import { useSavedRestaurants } from '@/src/providers/SavedRestaurantsProvider';

const SavedRestaurantsScreen: React.FC = () => {
    // Destructure removeSavedRestaurant to accept name for now
    const { savedRestaurants, removeSavedRestaurant } = useSavedRestaurants();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Change state to hold both ID and Name for context
    const [restaurantToRemove, setRestaurantToRemove] = useState<{ id: string | undefined; name: string } | null>(null);

    useEffect(() => {
    }, [savedRestaurants]);

    // Function to open the confirmation modal - now accepts both ID and Name
    const handleRemoveSaved = (item: Restaurant) => {
        // Store both ID and Name for the modal
        setRestaurantToRemove({ id: item.id, name: item.name });
        setShowConfirmModal(true);
    };

    const confirmRemove = () => {
        if (restaurantToRemove) {
            console.log("SavedRestaurantsScreen - confirmRemove: Attempting to remove by name:", restaurantToRemove.name);
            // Call removeSavedRestaurant with the name for now
            removeSavedRestaurant(restaurantToRemove.name); // <--- CHANGED HERE
            setRestaurantToRemove(null);
        }
        setShowConfirmModal(false);
    };

    const cancelRemove = () => {
        setRestaurantToRemove(null);
        setShowConfirmModal(false);
    };

    const renderItem = ({ item }: { item: Restaurant }) => {    
        return (
            <View style={styles.listItem}>
                <View style={styles.itemContent}>
                    <Text style={styles.itemName}>
                        {typeof item.name === 'string' ? item.name : 'Unnamed Restaurant'}
                    </Text>
                    <Text style={styles.itemAddress}>
                        {typeof item.address === 'string' ? item.address : 'No address available'}
                    </Text>
                    {item.mapsUrl && (
                        <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(item.mapsUrl)}>
                            <Ionicons name="map" size={16} color="#007aff" />
                            <Text style={styles.itemLink}>View on Maps</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleRemoveSaved(item)} style={styles.removeButton}>
                    <Ionicons name="trash-outline" size={24} color="#FF6347" />
                </TouchableOpacity>
            </View>
        );
    };

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
                    // IMPORTANT: Using name + index for keyExtractor as a temporary measure
                    // until item.id (Google Place ID) is correctly populated.
                    keyExtractor={(item, index) => `${item.id || 'no_id'}_${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContentContainer}
                />
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={showConfirmModal}
                onRequestClose={cancelRemove}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Removal</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to remove "{restaurantToRemove?.name ?? ''}"?</Text>
                            <View style={styles.modalButtonContainer}>
                            <TouchableOpacity onPress={cancelRemove} style={[styles.modalButton, styles.modalButtonCancel]}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmRemove} style={[styles.modalButton, styles.modalButtonConfirm]}>
                                <Text style={styles.modalButtonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 5,
        textAlign: 'center',
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    itemAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
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
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#ffe5e5',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        width: '80%',
        maxWidth: 350,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    modalMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#e0e0e0',
    },
    modalButtonConfirm: {
        backgroundColor: '#FF6347',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default SavedRestaurantsScreen;