// src/providers/AuthProvider.tsx
import { supabase } from "@/src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, useSegments } from 'expo-router';
import React from "react";
import { ActivityIndicator, View, StyleSheet, Text, Alert } from "react-native"; // Import Alert

// Define the shape of the authentication context data
type AuthData = {
  session: Session | null;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
};

// Create the AuthContext with a default value that matches AuthData
const AuthContext = createContext<AuthData>({
  session: null,
  loading: true,
  profile: null,
  signOut: async () => { /* no-op default */ },
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Function to handle fetching session and profile
  const fetchSessionAndProfile = async (initialSession: Session | null) => {
    console.log("AuthProvider: fetchSessionAndProfile called with initialSession:", initialSession);
    setSession(initialSession);
    setProfile(null); // Clear profile when session changes or is null

    if (initialSession) {
      console.log("AuthProvider: Session found, fetching profile...");
      // fetch profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", initialSession.user.id)
        .single();

      if (error) {
        console.error("AuthProvider: Error fetching profile:", error.message);
        Alert.alert("Profile Error", error.message); // Show alert for profile fetch error
      } else {
        setProfile(data || null);
        console.log("AuthProvider: Profile fetched:", data);
      }
    } else {
        console.log("AuthProvider: No session, skipping profile fetch.");
    }

    setLoading(false);
    console.log("AuthProvider: setLoading(false) called. Auth loading is now false.");
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      Alert.alert("Sign Out Error", error.message); // Show alert for sign out error
    } else {
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log("AuthProvider: Initial useEffect runs");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSessionFromSupabase } }) => {
      console.log("AuthProvider: supabase.auth.getSession() returned. Session:", initialSessionFromSupabase);
      fetchSessionAndProfile(initialSessionFromSupabase);
    }).catch(error => {
      console.error("AuthProvider: Error in getSession():", error.message);
      setLoading(false); // Ensure loading is false even on error
      Alert.alert("Session Error", error.message); // Show alert for session error
    });


    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("AuthProvider: onAuthStateChange fired. Event:", _event, "New Session:", newSession);
      fetchSessionAndProfile(newSession);
    });

    return () => {
      console.log("AuthProvider: Cleaning up auth state change subscription.");
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log("AuthProvider: Redirect Effect running.");
    console.log(`  - Current loading: ${loading}`);
    console.log(`  - Current session: ${session ? "EXISTS" : "DOES NOT EXIST"}`);
    console.log(`  - Current segments: ${JSON.stringify(segments)}`);
    console.log(`  - Initial route name: ${segments[0]}`);

    if (loading) {
      console.log("AuthProvider: Redirect Effect: Still loading, returning early.");
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log(`  - Is in Auth Group ('(auth)' === '${segments[0]}'): ${inAuthGroup}`);

    if (session && inAuthGroup) {
      console.log("AuthProvider: Redirect Effect: User logged in AND in auth group. Redirecting to /(tabs).");
      router.replace('/(tabs)' as any);
    } else if (!session && !inAuthGroup) {
      console.log("AuthProvider: Redirect Effect: User NOT logged in AND NOT in auth group. Redirecting to /(auth)/sign-in.");
      router.replace('/(auth)/sign-in');
    } else {
      console.log("AuthProvider: Redirect Effect: No redirect needed for current state/path.");
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.statusText}>Loading authentication...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, profile, signOut: handleSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
});
