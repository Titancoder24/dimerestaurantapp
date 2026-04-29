import { create } from "zustand";
import type { Session, User as AuthUser } from "@supabase/supabase-js";
import { supabase, type Tables } from "@/lib/supabase";

type DimeUser = Tables<"users">;

type AuthState = {
  hydrated: boolean;
  session: Session | null;
  authUser: AuthUser | null;
  profile: DimeUser | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: DimeUser | null) => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Staff-panel alternate auth (PIN-based, session is not a Supabase session)
  staff: {
    id: string;
    restaurantId: string;
    name: string;
    role: string;
    permissions: Record<string, boolean>;
  } | null;
  setStaff: (s: AuthState["staff"]) => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  session: null,
  authUser: null,
  profile: null,
  staff: null,

  setSession: (session) => set({ session, authUser: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setStaff: (staff) => set({ staff }),

  refreshProfile: async () => {
    const user = get().authUser;
    if (!user) return set({ profile: null });
    const { data } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
    set({ profile: data ?? null });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await get().refreshProfile();
  },

  signUp: async (email, password, name, role?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, ...(role ? { role } : {}) } },
    });
    if (error) throw error;
    if (data.session) {
      set({ session: data.session, authUser: data.session.user });
      await get().refreshProfile();
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, authUser: null, profile: null, staff: null });
  },
}));

// Wire Supabase session listener into the store.
export async function bootstrapAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  useAuth.getState().setSession(data.session ?? null);
  if (data.session) {
    await useAuth.getState().refreshProfile();
  }
  useAuth.setState({ hydrated: true });

  supabase.auth.onAuthStateChange(async (event, session) => {
    const prev = useAuth.getState().session;
    if (prev?.access_token === session?.access_token) return;
    useAuth.getState().setSession(session);
    if (session) {
      if (event === "SIGNED_IN") {
        // Small delay on sign-in to let DB triggers finish creating the user row
        await new Promise((r) => setTimeout(r, 500));
      }
      await useAuth.getState().refreshProfile();
    } else {
      useAuth.getState().setProfile(null);
    }
  });
}
