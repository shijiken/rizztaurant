import { Restaurant } from '@/src/types/Restaurant';

// Test the filtering logic from SavedRestaurants.tsx
const filterRestaurants = (restaurants: Restaurant[], filters: {
  searchQuery: string;
  cuisine: string | null;
  minRating: number | null;
  maxPriceLevel: string | null;
}) => {
  let filtered = restaurants;

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query) ||
        (restaurant.cuisine &&
          restaurant.cuisine.toLowerCase().includes(query))
    );
  }

  // Cuisine filter
  if (filters.cuisine && filters.cuisine !== 'All') {
    filtered = filtered.filter(
      (restaurant) =>
        restaurant.cuisine &&
        restaurant.cuisine.toLowerCase() === filters.cuisine?.toLowerCase()
    );
  }

  // Rating filter
  if (filters.minRating !== null) {
    filtered = filtered.filter(
      (restaurant) =>
        restaurant.rating && restaurant.rating >= filters.minRating!
    );
  }

  // Price level filter
  if (filters.maxPriceLevel !== null) {
    const priceLevelMap: { [key: string]: number } = {
      Free: 0,
      $: 1,
      $$: 2,
      $$$: 3,
      $$$$: 4,
      'N/A': 99,
    };
    const maxLevel = priceLevelMap[filters.maxPriceLevel];
    filtered = filtered.filter((restaurant) => {
      // Get price level as string
      const getPriceLevelString = (level?: number | string): string => {
        if (typeof level === 'string') {
          switch (level) {
            case 'PRICE_LEVEL_FREE':
              return 'Free';
            case 'PRICE_LEVEL_INEXPENSIVE':
              return '$';
            case 'PRICE_LEVEL_MODERATE':
              return '$$';
            case 'PRICE_LEVEL_EXPENSIVE':
              return '$$$';
            case 'PRICE_LEVEL_VERY_EXPENSIVE':
              return '$$$$';
            default:
              return 'N/A';
          }
        }
        switch (level) {
          case 0:
            return 'Free';
          case 1:
            return '$';
          case 2:
            return '$$';
          case 3:
            return '$$$';
          case 4:
            return '$$$$';
          default:
            return 'N/A';
        }
      };

      const actualPriceLevelString = getPriceLevelString(restaurant.price_level);
      const restaurantPriceLevelNumeric = priceLevelMap[actualPriceLevelString];

      return (
        restaurantPriceLevelNumeric !== undefined &&
        restaurantPriceLevelNumeric <= maxLevel
      );
    });
  }

  return filtered;
};

describe('Restaurant Filtering', () => {
  const mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Pizza Palace',
      address: '123 Main St',
      cuisine: 'Italian',
      rating: 4.5,
      price_level: "PRICE_LEVEL_MODERATE",
      mapsUrl: 'https://maps.google.com',
      imageUrl: 'https://example.com/image1.jpg',
      latitude: 40.7128,
      longitude: -74.0060,
      user_ratings_total: 100,
      distanceKm: 1.5,
    },
    {
      id: '2',
      name: 'Sushi Spot',
      address: '456 Oak Ave',
      cuisine: 'Japanese',
      rating: 4.2,
      price_level: "PRICE_LEVEL_EXPENSIVE",
      mapsUrl: 'https://maps.google.com',
      imageUrl: 'https://example.com/image2.jpg',
      latitude: 40.7589,
      longitude: -73.9851,
      user_ratings_total: 75,
      distanceKm: 2.1,
    },
    {
      id: '3',
      name: 'Burger Barn',
      address: '789 Pine St',
      cuisine: 'American',
      rating: 3.8,
      price_level: "PRICE_LEVEL_INEXPENSIVE",
      mapsUrl: 'https://maps.google.com',
      imageUrl: 'https://example.com/image3.jpg',
      latitude: 40.7505,
      longitude: -73.9934,
      user_ratings_total: 200,
      distanceKm: 0.8,
    },
    {
      id: '4',
      name: 'Pasta Place',
      address: '321 Elm St',
      cuisine: 'Italian',
      rating: 4.0,
      price_level: "PRICE_LEVEL_MODERATE",
      mapsUrl: 'https://maps.google.com',
      imageUrl: 'https://example.com/image4.jpg',
      latitude: 40.7282,
      longitude: -74.0776,
      user_ratings_total: 150,
      distanceKm: 1.2,
    },
  ];

  test('should return all restaurants when no filters applied', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: '',
      cuisine: null,
      minRating: null,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockRestaurants);
  });

  test('should filter restaurants by search query (name)', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: 'pizza',
      cuisine: null,
      minRating: null,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pizza Palace');
  });

  test('should filter restaurants by search query (address)', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: 'main st',
      cuisine: null,
      minRating: null,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].address).toBe('123 Main St');
  });

  test('should filter restaurants by cuisine', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: '',
      cuisine: 'italian',
      minRating: null,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(2);
    expect(result.every(r => r.cuisine?.toLowerCase() === 'italian')).toBe(true);
  });

  test('should filter restaurants by minimum rating', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: '',
      cuisine: null,
      minRating: 4.0,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(3);
    expect(result.every(r => r.rating && r.rating >= 4.0)).toBe(true);
  });

  test('should filter restaurants by maximum price level', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: '',
      cuisine: null,
      minRating: null,
      maxPriceLevel: '$',
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Burger Barn');
  });

  test('should apply multiple filters simultaneously', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: 'place',
      cuisine: 'italian',
      minRating: 4.0,
      maxPriceLevel: '$$',
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pasta Place');
  });

  test('should return empty array when no restaurants match filters', () => {
    const result = filterRestaurants(mockRestaurants, {
      searchQuery: 'nonexistent',
      cuisine: null,
      minRating: null,
      maxPriceLevel: null,
    });
    
    expect(result).toHaveLength(0);
  });
});