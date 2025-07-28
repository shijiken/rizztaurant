import { Share, Alert } from 'react-native';
import { Restaurant } from '@/src/types/Restaurant';

// Mock React Native's Share module
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Extract the sharing logic from SavedRestaurants.tsx
const getPriceLevelString = (level) => {
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

const handleShareRestaurant = async (restaurant) => {
  try {
    const ratingText = restaurant.rating
      ? `⭐ ${restaurant.rating.toFixed(1)}`
      : '';
    const priceText =
      restaurant.price_level !== undefined
        ? `💰 ${getPriceLevelString(restaurant.price_level)}`
        : '';
    const cuisineText = restaurant.cuisine ? `🍽️ ${restaurant.cuisine}` : '';

    const shareMessage =
      `🍴 Check out this restaurant I found on Rizztaurant!\n\n` +
      `📍 ${restaurant.name}\n` +
      `${restaurant.address}\n\n` +
      `${ratingText}${ratingText && priceText ? ' • ' : ''}${priceText}\n` +
      `${cuisineText}\n\n` +
      `${restaurant.mapsUrl ? `View on Maps: ${restaurant.mapsUrl}` : ''}`;

    const result = await Share.share({
      message: shareMessage,
      title: `Check out ${restaurant.name}!`,
    });

    return result;
  } catch (error) {
    console.error('Error sharing restaurant:', error);
    Alert.alert('Error', 'Failed to share restaurant information');
    throw error;
  }
};

describe('Social Sharing Functionality', () => {
  const mockRestaurant = {
    id: '1',
    name: 'Pizza Palace',
    address: '123 Main St, New York, NY',
    cuisine: 'Italian',
    rating: 4.5,
    price_level: 2,
    mapsUrl: 'https://maps.google.com/place/pizza-palace',
    imageUrl: 'https://example.com/pizza.jpg',
    latitude: 40.7128,
    longitude: -74.0060,
    user_ratings_total: 100,
    distanceKm: 1.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate correct share message with all restaurant details', async () => {
    Share.share.mockResolvedValue({ action: Share.sharedAction });

    await handleShareRestaurant(mockRestaurant);

    expect(Share.share).toHaveBeenCalledWith({
      message: expect.stringContaining('🍴 Check out this restaurant I found on Rizztaurant!'),
      title: 'Check out Pizza Palace!',
    });

    const callArgs = Share.share.mock.calls[0][0];
    expect(callArgs.message).toContain('📍 Pizza Palace');
    expect(callArgs.message).toContain('123 Main St, New York, NY');
    expect(callArgs.message).toContain('⭐ 4.5');
    expect(callArgs.message).toContain('💰 $$');
    expect(callArgs.message).toContain('🍽️ Italian');
    expect(callArgs.message).toContain('View on Maps: https://maps.google.com/place/pizza-palace');
  });

  test('should handle restaurant without rating', async () => {
    const restaurantWithoutRating = {
      ...mockRestaurant,
      rating: undefined,
    };

    Share.share.mockResolvedValue({ action: Share.sharedAction });

    await handleShareRestaurant(restaurantWithoutRating);

    const callArgs = Share.share.mock.calls[0][0];
    expect(callArgs.message).not.toContain('⭐');
    expect(callArgs.message).toContain('💰 $$'); // Should still show price
  });

  test('should handle restaurant without price level', async () => {
    const restaurantWithoutPrice = {
      ...mockRestaurant,
      price_level: undefined,
    };

    Share.share.mockResolvedValue({ action: Share.sharedAction });

    await handleShareRestaurant(restaurantWithoutPrice);

    const callArgs = Share.share.mock.calls[0][0];
    expect(callArgs.message).toContain('⭐ 4.5'); // Should still show rating
    expect(callArgs.message).not.toContain('💰');
  });

  test('should handle restaurant without cuisine', async () => {
    const restaurantWithoutCuisine = {
      ...mockRestaurant,
      cuisine: undefined,
    };

    Share.share.mockResolvedValue({ action: Share.sharedAction });

    await handleShareRestaurant(restaurantWithoutCuisine);

    const callArgs = Share.share.mock.calls[0][0];
    expect(callArgs.message).not.toContain('🍽️');
    expect(callArgs.message).toContain('⭐ 4.5'); // Should still show other details
  });

  test('should handle restaurant without maps URL', async () => {
    const restaurantWithoutMaps = {
      ...mockRestaurant,
      mapsUrl: undefined,
    };

    Share.share.mockResolvedValue({ action: Share.sharedAction });

    await handleShareRestaurant(restaurantWithoutMaps);

    const callArgs = Share.share.mock.calls[0][0];
    expect(callArgs.message).not.toContain('View on Maps:');
    expect(callArgs.message).toContain('📍 Pizza Palace'); // Should still show other details
  });

  test('should handle sharing errors gracefully', async () => {
    const shareError = new Error('Share failed');
    Share.share.mockRejectedValue(shareError);

    await expect(handleShareRestaurant(mockRestaurant)).rejects.toThrow('Share failed');
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to share restaurant information');
  });

  test('should format different price levels correctly', () => {
    expect(getPriceLevelString(0)).toBe('Free');
    expect(getPriceLevelString(1)).toBe('$');
    expect(getPriceLevelString(2)).toBe('$$');
    expect(getPriceLevelString(3)).toBe('$$$');
    expect(getPriceLevelString(4)).toBe('$$$$');
    expect(getPriceLevelString('PRICE_LEVEL_FREE')).toBe('Free');
    expect(getPriceLevelString('PRICE_LEVEL_INEXPENSIVE')).toBe('$');
    expect(getPriceLevelString('PRICE_LEVEL_MODERATE')).toBe('$$');
    expect(getPriceLevelString('PRICE_LEVEL_EXPENSIVE')).toBe('$$$');
    expect(getPriceLevelString('PRICE_LEVEL_VERY_EXPENSIVE')).toBe('$$$$');
    expect(getPriceLevelString(undefined)).toBe('N/A');
    expect(getPriceLevelString('unknown')).toBe('N/A');
  });
});