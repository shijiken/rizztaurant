// app.config.js
import 'dotenv/config'; 

export default ({ config }) => {
  return {
    ...config,
    extra: {
      expoPublicSupabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        expoPublicSupabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      expoPublicGooglePlacesKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
    },
  };
};