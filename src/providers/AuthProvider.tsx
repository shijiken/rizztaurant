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
import { ActivityIndicator, View, StyleSheet, Text, Alert } from "react-native";

// Define the shape of the authentication context data
type AuthData = {
  session: Session | null;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
};

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

  const fetchSessionAndProfile = async (initialSession: Session | null) => {
    setSession(initialSession);
    setProfile(null);

    if (initialSession) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", initialSession.user.id)
        .single();

      if (error) {
        Alert.alert("Profile Error", error.message);
      } else {
        setProfile(data || null);
      }
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Sign Out Error", error.message);
    } else {
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSessionFromSupabase } }) => {
      fetchSessionAndProfile(initialSessionFromSupabase);
    }).catch(error => {
      setLoading(false);
      Alert.alert("Session Error", error.message);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      fetchSessionAndProfile(newSession);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)' as any);
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
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
