// app/screens/SavedRestaurants.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/Restaurant';

// Import the useSavedRestaurants hook from your context
import { useSavedRestaurants } from '@/src/providers/SavedRestaurantsProvider'; 

const SavedRestaurantsScreen: React.FC = () => {
    const { savedRestaurants, removeSavedRestaurant } = useSavedRestaurants();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [restaurantToRemove, setRestaurantToRemove] = useState<string | null>(null);

    // Logs whenever savedRestaurants updates on this screen
    useEffect(() => {
        console.log("SavedRestaurantsScreen - savedRestaurants UPDATED!");
        console.log("  Current count:", savedRestaurants.length);
        console.log("  Names in list:", savedRestaurants.map(r => r.name));
    }, [savedRestaurants]);

    // Function to open the confirmation modal
    const handleRemoveSaved = (uniqueIdToRemove: string) => {
        console.log("SavedRestaurantsScreen - handleRemoveSaved called for uniqueId:", uniqueIdToRemove);
        setRestaurantToRemove(uniqueIdToRemove);
        setShowConfirmModal(true);
    };

    const confirmRemove = () => {
        if (restaurantToRemove) {
            console.log("SavedRestaurantsScreen - confirmRemove: Attempting to remove uniqueId:", restaurantToRemove);
            removeSavedRestaurant(restaurantToRemove); // Call the context function
            setRestaurantToRemove(null);
        }
        setShowConfirmModal(false);
    };


// const SavedRestaurantsScreen: React.FC = () => { 

//     const { savedRestaurants, removeSavedRestaurant } = useSavedRestaurants(); // <--- This is the key change

//     const [showConfirmModal, setShowConfirmModal] = useState(false);
//     const [restaurantToRemove, setRestaurantToRemove] = useState<string | null>(null);

//     // Function to open the confirmation modal
//     const handleRemoveSaved = (idToRemove: string) => {
//         setRestaurantToRemove(idToRemove);
//         setShowConfirmModal(true);
//     };


//     const confirmRemove = () => {
//         if (restaurantToRemove) {
//             // Use the removeSavedRestaurant function obtained from context
//             removeSavedRestaurant(restaurantToRemove); // Call the context function directly
//             setRestaurantToRemove(null);
//         }
//         setShowConfirmModal(false);
//     };

    // Function to cancel removal from modal
    const cancelRemove = () => {
        setRestaurantToRemove(null);
        setShowConfirmModal(false);
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
            {/* Now savedRestaurants is correctly from context and initialized as an empty array */}
            {savedRestaurants.length === 0 ? ( // This line should now work correctly
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

            {/* Custom Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showConfirmModal}
                onRequestClose={cancelRemove}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Remove Restaurant</Text>
                        <Text style={styles.modalMessage}>Are you sure you want to remove this restaurant from your saved list?</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={cancelRemove}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonRemove]} onPress={confirmRemove}>
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
        backgroundColor: '#ececec',
        paddingTop: 30,
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#ccc',
    },
    modalButtonRemove: {
        backgroundColor: '#FF6347',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SavedRestaurantsScreen;