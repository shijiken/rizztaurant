// src/utils/restaurantData.ts

/**
 * Attempts to infer a single primary cuisine type from Google Places API (New) 'primaryType' and 'types' fields.
 * Prioritizes 'primaryType' if it's a specific food/drink type, then checks the 'types' array.
 * Returns a single formatted string (e.g., "Japanese Restaurant", "Coffee Shop") or undefined.
 */
export const getCuisineFromPlaceTypes = (
    primaryType: string | undefined, // NEW: Now accepts primaryType from Places API (New)
    types: string[] // Existing: accepts types array
  ): string | undefined => {
    // Comprehensive list of food/drink related place types from Google Places API
    // These are kept in lowercase with underscores to match Google's API format
    const specificFoodDrinkTypes = [
      "acai_shop", "afghani_restaurant", "african_restaurant", "american_restaurant", "asian_restaurant",
      "bagel_shop", "bakery", "bar", "bar_and_grill", "barbecue_restaurant", "brazilian_restaurant",
      "breakfast_restaurant", "brunch_restaurant", "buffet_restaurant", "cafe", "cafeteria", "candy_store",
      "cat_cafe", "chinese_restaurant", "chocolate_factory", "chocolate_shop", "coffee_shop", "confectionery",
      "deli", "dessert_restaurant", "dessert_shop", "diner", "dog_cafe", "donut_shop", "fast_food_restaurant",
      "fine_dining_restaurant", "food_court", "french_restaurant", "greek_restaurant", "hamburger_restaurant",
      "ice_cream_shop", "indian_restaurant", "indonesian_restaurant", "italian_restaurant", "japanese_restaurant",
      "juice_shop", "korean_restaurant", "lebanese_restaurant", "meal_delivery", "meal_takeaway",
      "mediterranean_restaurant", "mexican_restaurant", "middle_eastern_restaurant", "pizza_restaurant", "pub",
      "ramen_restaurant", "restaurant", // Keep 'restaurant' as a general type if more specific ones aren't found
      "sandwich_shop", "seafood_restaurant", "spanish_restaurant", "steak_house", "sushi_restaurant",
      "tea_house", "thai_restaurant", "turkish_restaurant", "vegan_restaurant", "vegetarian_restaurant",
      "vietnamese_restaurant", "wine_bar"
    ];
  
    const lowerCaseTypes = types.map(type => type.toLowerCase());
  
    // 1. Prioritize primaryType if it's a specific food/drink type
    if (primaryType) {
      const lowerCasePrimaryType = primaryType.toLowerCase();
      if (specificFoodDrinkTypes.includes(lowerCasePrimaryType)) {
        return lowerCasePrimaryType
          .replace(/_/g, " ")
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  
    // 2. Fallback to checking the 'types' array for specific food/drink types
    for (const preferredType of specificFoodDrinkTypes) {
      if (lowerCaseTypes.includes(preferredType)) {
        return preferredType
          .replace(/_/g, " ")
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }
  
    // 3. If no specific food/drink type is found in primaryType or types, return undefined
    return undefined;
  };