import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Database } from "@/types/database";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

const storage = Platform.OS === "web"
  ? (typeof window !== "undefined" ? window.localStorage : undefined)
  : AsyncStorage;

// We intentionally use the untyped SupabaseClient here. Hand-maintaining a
// fully-typed Database surface for 20 tables creates more friction than it
// saves in this MVP. Row types are still strongly typed via Tables<> below
// so .select() results are statically known where needed.
export const supabase: SupabaseClient = createClient(url, key, {
  auth: {
    storage: storage as never,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
  global: {
    headers: { "x-application-name": "dime" },
  },
});

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
