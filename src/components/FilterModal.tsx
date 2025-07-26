// src/components/FilterModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PriceLevel, Rating, FilterOptions } from '@/src/app/(tabs)/SavedRestaurants'; // Import types

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const allCuisines = [
  'All', 
  "Acai Shop", "Afghani Restaurant", "African Restaurant", "American Restaurant", "Asian Restaurant",
  "Bagel Shop", "Bakery", "Bar", "Bar and Grill", "Barbecue Restaurant", "Brazilian Restaurant",
  "Breakfast Restaurant", "Brunch Restaurant", "Buffet Restaurant", "Cafe", "Cafeteria", "Candy Store",
  "Cat Cafe", "Chinese Restaurant", "Chocolate Factory", "Chocolate Shop", "Coffee Shop", "Confectionery",
  "Deli", "Dessert Restaurant", "Dessert Shop", "Diner", "Dog Cafe", "Donut Shop", "Fast Food Restaurant",
  "Fine Dining Restaurant", "Food Court", "French Restaurant", "Greek Restaurant", "Hamburger Restaurant",
  "Ice Cream Shop", "Indian Restaurant", "Indonesian Restaurant", "Italian Restaurant", "Japanese Restaurant",
  "Juice Shop", "Korean Restaurant", "Lebanese Restaurant", "Meal Delivery", "Meal Takeaway",
  "Mediterranean Restaurant", "Mexican Restaurant", "Middle Eastern Restaurant", "Pizza Restaurant", "Pub",
  "Ramen Restaurant", "Restaurant",
  "Sandwich Shop", "Seafood Restaurant", "Spanish Restaurant", "Steak House", "Sushi Restaurant",
  "Tea House", "Thai Restaurant", "Turkish Restaurant", "Vegan Restaurant", "Vegetarian Restaurant",
  "Vietnamese Restaurant", "Wine Bar"
];

const priceLevels: PriceLevel[] = ['$', '$$', '$$$', '$$$$'];
const ratings: Rating[] = [1, 2, 3, 4, 5];

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  onClearFilters,
}) => {
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(currentFilters.cuisine);
  const [minRating, setMinRating] = useState<Rating>(currentFilters.minRating);
  const [maxPriceLevel, setMaxPriceLevel] = useState<PriceLevel>(currentFilters.maxPriceLevel);

  useEffect(() => {
    // Update internal state when currentFilters prop changes
    setSelectedCuisine(currentFilters.cuisine);
    setMinRating(currentFilters.minRating);
    setMaxPriceLevel(currentFilters.maxPriceLevel);
  }, [currentFilters]);

  const handleApply = () => {
    onApplyFilters({
      cuisine: selectedCuisine,
      minRating: minRating,
      maxPriceLevel: maxPriceLevel,
      searchQuery: currentFilters.searchQuery, // Keep search query from parent
    });
  };

  const handleClear = () => {
    setSelectedCuisine(null);
    setMinRating(null);
    setMaxPriceLevel(null);
    onClearFilters(); // Also clear in parent
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Restaurants</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={30} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            {/* Cuisine Filter */}
            <Text style={styles.filterSectionTitle}>Restaurant Type</Text>
            {/* The optionsContainer is already inside a ScrollView,
                so it will automatically scroll if content overflows */}
            <View style={styles.optionsContainer}>
              {allCuisines.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.optionButton,
                    selectedCuisine === cuisine && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedCuisine(cuisine === 'All' ? null : cuisine)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedCuisine === cuisine && styles.optionButtonTextSelected,
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minimum Rating Filter */}
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.optionsContainer}>
              {ratings.map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.optionButton,
                    minRating === rating && styles.optionButtonSelected,
                  ]}
                  onPress={() => setMinRating(minRating === rating ? null : rating)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      minRating === rating && styles.optionButtonTextSelected,
                    ]}
                  >
                    {rating} <Ionicons name="star" size={12} color={minRating === rating ? '#fff' : '#333'} />
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Maximum Price Level Filter */}
            <Text style={styles.filterSectionTitle}>Maximum Cost</Text>
            <View style={styles.optionsContainer}>
              {priceLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    maxPriceLevel === level && styles.optionButtonSelected,
                  ]}
                  onPress={() => setMaxPriceLevel(maxPriceLevel === level ? null : level)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      maxPriceLevel === level && styles.optionButtonTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleClear} style={[styles.actionButton, styles.clearButton]}>
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={[styles.actionButton, styles.applyButton]}>
              <Text style={styles.actionButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%', // Limit modal height
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollView: {
    flexGrow: 1, // Allows the ScrollView to grow and take available space
  },
  scrollViewContent: {
    paddingBottom: 20, // Add some padding at the bottom of the scrollable content
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap to the next line
    marginBottom: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  optionButtonText: {
    color: '#333',
    fontSize: 14,
  },
  optionButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  clearButton: {
    backgroundColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#007aff',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default FilterModal;