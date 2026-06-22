import { useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Profile, ProfileStatus, Role } from "@/lib/types";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ role?: Role; status?: ProfileStatus }>;
  signOut: () => Promise<void>;
};

const demoProfile: Profile = {
  id: "demo-member",
  full_name: "R3CC Rider",
  username: "r3cc",
  email: "member@r3cc.app",
  role: "member",
  status: "approved",
  invite_quota: 5,
  invites_used: 2,
  bio: "Private miles, public discipline.",
  riding_level: "advanced",
  weekly_km: "150-250",
  instagram: "r3cc",
  total_km: 4820,
  total_rides: 138,
  streak_days: 12
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(hasSupabaseConfig ? null : demoProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!hasSupabaseConfig || !session?.user.id) {
        return;
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(data as Profile | null);
    }

    loadProfile();
  }, [session?.user.id]);

  return useMemo(
    () => ({
      session,
      profile,
      loading,
      signIn: async (email, password) => {
        if (!hasSupabaseConfig) {
          const role: Role = email.includes("admin") ? "admin" : "member";
          const nextProfile = { ...demoProfile, email, role, status: "approved" as ProfileStatus };
          setProfile(nextProfile);
          return { role, status: nextProfile.status };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error(`Profile error: ${profileError.message}`);
        }

        if (!profileData) {
          throw new Error("Profile not found. Admin profile may not be set up in database.");
        }

        setProfile(profileData as Profile);
        return { role: profileData.role as Role, status: profileData.status as ProfileStatus };
      },
      signOut: async () => {
        if (hasSupabaseConfig) {
          await supabase.auth.signOut();
        }
        setSession(null);
        setProfile(hasSupabaseConfig ? null : demoProfile);
      }
    }),
    [loading, profile, session]
  );
}
