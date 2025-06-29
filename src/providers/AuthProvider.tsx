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

type AuthData = {
  session: Session | null;
  profile: any;
  loading: boolean;
};

const AuthContext = createContext<AuthData>({
  session: null,
  loading: true,
  profile: null,
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log("AuthProvider: Initial useEffect runs");

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
        } else {
          setProfile(data || null);
          console.log("AuthProvider: Profile fetched:", data);
        }
      } else {
          console.log("AuthProvider: No session, skipping profile fetch.");
      }

      setLoading(false); // This is crucial. It must be reached.
      console.log("AuthProvider: setLoading(false) called. Auth loading is now false.");
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSessionFromSupabase } }) => {
      console.log("AuthProvider: supabase.auth.getSession() returned. Session:", initialSessionFromSupabase);
      fetchSessionAndProfile(initialSessionFromSupabase);
    }).catch(error => {
      console.error("AuthProvider: Error in getSession():", error.message);
      setLoading(false); // Ensure loading is false even on error
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
  }, []); // Empty dependency array means this runs once on mount

  // --- THIS IS THE REDIRECTION useEffect ---
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
  }, [session, loading, segments, router]); // Dependencies

  return (
    <AuthContext.Provider
      value={{ session, loading, profile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);