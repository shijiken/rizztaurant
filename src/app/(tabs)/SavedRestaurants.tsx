// src/app/screens/SavedRestaurants.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/src/types/Restaurant';
import { useSavedRestaurants } from '@/src/providers/SavedRestaurantsProvider';
import FilterModal from '@/src/components/FilterModal'; // New import

// Define types for filter options
export type PriceLevel = '$' | '$$' | '$$$' | '$$$$' | 'N/A' | 'Free' | null;
export type Rating = 1 | 2 | 3 | 4 | 5 | null;

export interface FilterOptions {
  cuisine: string | null;
  minRating: Rating;
  maxPriceLevel: PriceLevel;
  searchQuery: string;
}

const getPriceLevelString = (level?: number | string): string => {
  if (typeof level === 'string') {
    switch (level) {
      case "PRICE_LEVEL_FREE":
        return "Free";
      case "PRICE_LEVEL_INEXPENSIVE":
        return "$";
      case "PRICE_LEVEL_MODERATE":
        return "$$";
      case "PRICE_LEVEL_EXPENSIVE":
        return "$$$";
      case "PRICE_LEVEL_VERY_EXPENSIVE":
        return "$$$$";
      default:
        return "N/A";
    }
  }
  switch (level) {
    case 0:
      return "Free";
    case 1:
      return "$";
    case 2:
      return "$$";
    case 3:
      return "$$$";
    case 4:
      return "$$$$";
    default:
      return "N/A";
  }
};


const SavedRestaurantsScreen: React.FC = () => {
  const { savedRestaurants, removeSavedRestaurant } = useSavedRestaurants();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restaurantToRemove, setRestaurantToRemove] = useState<Restaurant | null>(null);

  // State for filter modal visibility
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for filter options
  const [filters, setFilters] = useState<FilterOptions>({
    cuisine: null,
    minRating: null,
    maxPriceLevel: null,
    searchQuery: '',
  });

  useEffect(() => {
    console.log("SavedRestaurantsScreen: savedRestaurants updated. Count:", savedRestaurants.length);
  }, [savedRestaurants]);

  const handleRemoveSaved = (item: Restaurant) => {
    setRestaurantToRemove(item);
    setShowConfirmModal(true);
  };

  const confirmRemove = async () => {
    if (restaurantToRemove && restaurantToRemove.id) {
      console.log("SavedRestaurantsScreen - confirmRemove: Attempting to remove restaurant with ID:", restaurantToRemove.id);
      await removeSavedRestaurant(restaurantToRemove.id);
      setRestaurantToRemove(null);
    } else {
      console.warn("Attempted to confirm removal without a valid restaurant ID.");
    }
    setShowConfirmModal(false);
  };

  const cancelRemove = () => {
    setRestaurantToRemove(null);
    setShowConfirmModal(false);
  };

  // Memoized filtered restaurants
  const filteredRestaurants = useMemo(() => {
    let filtered = savedRestaurants;

    // 1. Search Query Filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query) ||
          (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(query))
      );
    }

    // 2. Cuisine Filter
    if (filters.cuisine && filters.cuisine !== 'All') {
      filtered = filtered.filter(
        (restaurant) => restaurant.cuisine && restaurant.cuisine.toLowerCase() === filters.cuisine?.toLowerCase()
      );
    }

    // 3. Minimum Rating Filter
    if (filters.minRating !== null) {
      filtered = filtered.filter(
        (restaurant) => restaurant.rating && restaurant.rating >= filters.minRating!
      );
    }

    // 4. Maximum Price Level Filter
    if (filters.maxPriceLevel !== null) {
      const priceLevelMap: { [key: string]: number } = {
        'Free': 0, '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, 'N/A': 99 // N/A is effectively highest cost
      };
      const maxLevel = priceLevelMap[filters.maxPriceLevel];
      filtered = filtered.filter((restaurant) => {
        // Convert the restaurant's price_level to its dollar sign string FIRST,
        // then use that string to get the numeric value for comparison.
        const actualPriceLevelString = getPriceLevelString(restaurant.price_level);
        const restaurantPriceLevelNumeric = priceLevelMap[actualPriceLevelString];

        return restaurantPriceLevelNumeric !== undefined && restaurantPriceLevelNumeric <= maxLevel;
      });
    }

    return filtered;
  }, [savedRestaurants, filters]);


  const renderItem = ({ item }: { item: Restaurant }) => {
    const key = item.id;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">
            {typeof item.name === 'string' ? item.name : 'Unnamed Restaurant'}
          </Text>
          <Text style={styles.itemAddress} numberOfLines={2} ellipsizeMode="tail">
            {typeof item.address === 'string' ? item.address : 'No address available'}
          </Text>
          <View style={styles.itemDetailsRow}>
            {item.cuisine && <Text style={styles.itemDetailText}>{item.cuisine}</Text>}
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.itemDetailText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
            {item.price_level !== undefined && (
              <Text style={styles.itemDetailText}>
                Cost: {getPriceLevelString(item.price_level)} {/* ALWAYS use the helper function here */}
              </Text>
            )}
          </View>
          {item.mapsUrl && (
            <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(item.mapsUrl).catch(err => console.error('Failed to open URL:', err))}>
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
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#007aff" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, address, or cuisine..."
        placeholderTextColor="#888"
        value={filters.searchQuery}
        onChangeText={(text) => setFilters((prev) => ({ ...prev, searchQuery: text }))}
      />

      {filteredRestaurants.length === 0 && savedRestaurants.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No restaurants match your filters.</Text>
          <Text style={styles.emptySubText}>Try adjusting your search or filter options.</Text>
        </View>
      ) : filteredRestaurants.length === 0 && savedRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No saved restaurants yet.</Text>
          <Text style={styles.emptySubText}>Swipe right on the "Swipe" tab to save some!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
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

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setShowFilterModal(false);
        }}
        onClearFilters={() => {
          setFilters({ cuisine: null, minRating: null, maxPriceLevel: null, searchQuery: '' });
          setShowFilterModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filterButtonText: {
    marginLeft: 5,
    color: '#007aff',
    fontWeight: '600',
  },
  searchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  itemDetailText: {
    fontSize: 13,
    color: '#555',
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
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