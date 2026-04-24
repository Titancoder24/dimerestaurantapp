import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";

export function useRestaurants(filters?: { city?: string; featured?: boolean }) {
  return useQuery({
    queryKey: ["restaurants", filters ?? {}],
    queryFn: async () => {
      let q = supabase.from("restaurants").select("*").eq("status", "verified").order("featured", { ascending: false }).order("rating", { ascending: false });
      if (filters?.city) q = q.eq("city", filters.city);
      if (filters?.featured) q = q.eq("featured", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Tables<"restaurants">[];
    },
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Tables<"restaurants"> | null;
    },
  });
}

export function useMenu(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["menu", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const [cats, items] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("*")
          .eq("restaurant_id", restaurantId!)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId!)
          .order("sort_order"),
      ]);
      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      return {
        categories: cats.data as Tables<"menu_categories">[],
        items: items.data as Tables<"menu_items">[],
      };
    },
  });
}

export function useActiveOffers(restaurantId?: string | null) {
  return useQuery({
    queryKey: ["offers", restaurantId ?? "platform"],
    queryFn: async () => {
      let q = supabase.from("offers").select("*").eq("is_active", true);
      if (restaurantId) q = q.eq("restaurant_id", restaurantId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Tables<"offers">[];
    },
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["bookings", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, restaurants(name, cover_image_url, address)")
        .order("date", { ascending: false })
        .order("time", { ascending: false });
      if (error) throw error;
      return data as (Tables<"bookings"> & { restaurants: { name: string; cover_image_url: string | null; address: string | null } })[];
    },
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name, cover_image_url)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (Tables<"orders"> & { restaurants: { name: string; cover_image_url: string | null } })[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const [order, items] = await Promise.all([
        supabase.from("orders").select("*, restaurants(name, phone, address, cover_image_url)").eq("id", id!).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id!).order("created_at"),
      ]);
      if (order.error) throw order.error;
      if (items.error) throw items.error;
      return { order: order.data, items: items.data as Tables<"order_items">[] };
    },
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as Tables<"banners">[];
    },
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Tables<"collections">[];
    },
  });
}

export function useReviews(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(name, avatar_url)")
        .eq("restaurant_id", restaurantId!)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as (Tables<"reviews"> & { users: { name: string | null; avatar_url: string | null } })[];
    },
  });
}

export function useTables(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["tables", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order("number");
      if (error) throw error;
      return data as Tables<"tables">[];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Tables<"notifications">[];
    },
  });
}
