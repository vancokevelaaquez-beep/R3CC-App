import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Demo/mock auth (no real Supabase project configured) is only ever allowed
// in local development builds. If a release build somehow ships without
// EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY set, we want auth
// calls to fail loudly against Supabase rather than silently grant access.
export const demoModeEnabled = __DEV__ && !hasSupabaseConfig;

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});