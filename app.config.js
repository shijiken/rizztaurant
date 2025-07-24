// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: "rizztaurant",
    slug: "rizztaurant",
    owner: "shijiken",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rizztaurant",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.shijiken.rizztaurant", // ← MUST be unique across the Play Store
      versionCode: 1,    
      "permissions": ["LOCATION"],
  
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: ["expo-router", "expo-secure-store"],
    experiments: {
      typedRoutes: true,
    },
    eas: {
      projectId: "e8a097d2-b52d-438e-ad52-d4d43e170340",
    },
    updates: {
      url: "https://u.expo.dev/e8a097d2-b52d-438e-ad52-d4d43e170340",
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    extra: {
      expoPublicSupabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      expoPublicSupabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      expoPublicGooglePlacesKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
      eas: {
        projectId: "e8a097d2-b52d-438e-ad52-d4d43e170340",
      },
    },
  },
});