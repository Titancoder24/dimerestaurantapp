import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

/**
 * Returns the restaurant the current owner (or manager staff) is acting on.
 * For simplicity: first restaurant owned. In multi-restaurant ownership, show a picker.
 */
export function useOwnedRestaurant() {
  const profile = useAuth((s) => s.profile);
  return useQuery({
    queryKey: ["owned-restaurant", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", profile!.id)
        .order("created_at")
        .limit(1);
      if (error) throw error;
      return (data?.[0] ?? null) as Tables<"restaurants"> | null;
    },
  });
}

export function useRestaurantOrders(restaurantId?: string) {
  return useQuery({
    queryKey: ["restaurant-orders", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Tables<"orders">[];
    },
  });
}

export function useRestaurantStaff(restaurantId?: string) {
  return useQuery({
    queryKey: ["restaurant-staff", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("role");
      if (error) throw error;
      return data as Tables<"staff">[];
    },
  });
}

export function useKdsOrders(restaurantId?: string) {
  return useQuery({
    queryKey: ["kds-orders", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId!)
        .in("status", ["received", "preparing", "ready"])
        .order("created_at");
      if (error) throw error;
      return data as (Tables<"orders"> & { order_items: Tables<"order_items">[] })[];
    },
  });
}

export function useInventory(restaurantId?: string) {
  return useQuery({
    queryKey: ["inventory", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("name");
      if (error) throw error;
      return data as Tables<"inventory">[];
    },
  });
}

export function useExpenses(restaurantId?: string) {
  return useQuery({
    queryKey: ["expenses", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Tables<"expenses">[];
    },
  });
}

export function useRestaurantReviews(restaurantId?: string) {
  return useQuery({
    queryKey: ["restaurant-reviews", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(name, avatar_url)")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (Tables<"reviews"> & { users: { name: string | null; avatar_url: string | null } | null })[];
    },
  });
}

export function useRestaurantBookings(restaurantId?: string) {
  return useQuery({
    queryKey: ["restaurant-bookings", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, users(name, phone)")
        .eq("restaurant_id", restaurantId!)
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as (Tables<"bookings"> & { users: { name: string | null; phone: string | null } | null })[];
    },
  });
}
