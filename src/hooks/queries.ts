import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";

export function useRestaurants(filters?: { city?: string; featured?: boolean }) {
  return useQuery({
    queryKey: ["restaurants", filters ?? {}],
    queryFn: async () => {
      let q = supabase.from("restaurants").select("*").eq("status", "verified").order("featured", { ascending: false }).order("created_at", { ascending: false }).order("rating", { ascending: false });
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

export function useMoodCategories() {
  return useQuery({
    queryKey: ["mood-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as { id: string; key: string; title: string; query: string; icon_url: string | null; sort_order: number }[];
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

// Augmented restaurant row type that includes columns added in
// migration 015_dineout_metadata. Each is optional so the UI works
// before the migration is applied (values fall back to sensible
// defaults at the call site).
export type DineoutRestaurant = Tables<"restaurants"> & {
  cost_for_two?: number | null;
  distance_km?: number | null;
  pre_booking_discount_pct?: number | null;
  bank_offer_label?: string | null;
  cashback_pct?: number | null;
  gallery_urls?: string[] | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type DineoutFilters = {
  city?: string;
  withinKm?: number;
  minRating?: number;
  pureVeg?: boolean;
  servesAlcohol?: boolean;
  cuisine?: string;
  search?: string;
  bookable?: boolean;
};

export function useDineoutRestaurants(filters?: DineoutFilters) {
  return useQuery({
    queryKey: ["dineout-restaurants", filters ?? {}],
    queryFn: async () => {
      let q = supabase
        .from("restaurants")
        .select("*")
        .eq("status", "verified")
        .order("featured", { ascending: false })
        .order("rating", { ascending: false });

      if (filters?.city) q = q.eq("city", filters.city);
      if (filters?.minRating) q = q.gte("rating", filters.minRating);
      if (filters?.cuisine && filters.cuisine !== "All") q = q.contains("cuisines", [filters.cuisine]);
      if (filters?.pureVeg) q = q.contains("amenities", ["Pure Veg"]);
      if (filters?.servesAlcohol) q = q.contains("amenities", ["Serves Alcohol"]);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;

      let list = (data ?? []) as DineoutRestaurant[];
      // Within-km filter is client-side because it reads a column the
      // server-side filter chain would also need to handle nulls for.
      if (filters?.withinKm != null) {
        const km = filters.withinKm;
        list = list.filter((r) => {
          const d = r.distance_km;
          return d == null || Number(d) <= km;
        });
      }
      return list;
    },
  });
}

export type ReviewBreakdown = {
  food: number;
  beverages: number;
  service: number;
  overall: number;
  total: number;
};

export function useReviewBreakdown(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["review-breakdown", restaurantId],
    enabled: !!restaurantId,
    queryFn: async (): Promise<ReviewBreakdown> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("food_rating, beverages_rating, service_rating, overall_rating")
        .eq("restaurant_id", restaurantId!)
        .eq("is_published", true);
      if (error) throw error;
      const rows = (data ?? []) as {
        food_rating: number | null;
        beverages_rating: number | null;
        service_rating: number | null;
        overall_rating: number | null;
      }[];
      const total = rows.length;
      if (total === 0) return { food: 0, beverages: 0, service: 0, overall: 0, total: 0 };

      const avg = (key: keyof (typeof rows)[number]) => {
        const vals = rows.map((r) => r[key]).filter((v): v is number => v != null);
        if (vals.length === 0) return 0;
        return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
      };

      return {
        food: avg("food_rating"),
        beverages: avg("beverages_rating"),
        service: avg("service_rating"),
        overall: avg("overall_rating"),
        total,
      };
    },
  });
}

export function useSimilarRestaurants(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["similar-restaurants", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data: source, error: srcErr } = await supabase
        .from("restaurants")
        .select("city, cuisines")
        .eq("id", restaurantId!)
        .maybeSingle();
      if (srcErr) throw srcErr;
      if (!source) return [];
      const { city, cuisines } = source as { city: string; cuisines: string[] };

      let q = supabase
        .from("restaurants")
        .select("*")
        .eq("status", "verified")
        .eq("city", city)
        .neq("id", restaurantId!)
        .limit(6);
      if (cuisines && cuisines.length > 0) q = q.overlaps("cuisines", cuisines);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Tables<"restaurants">[];
    },
  });
}

export function usePaginatedReviews(restaurantId: string | undefined, page: number, pageSize: number = 20) {
  return useQuery({
    queryKey: ["reviews-paged", restaurantId, page, pageSize],
    enabled: !!restaurantId,
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("reviews")
        .select("*, users(name, avatar_url)", { count: "exact" })
        .eq("restaurant_id", restaurantId!)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data as (Tables<"reviews"> & { users: { name: string | null; avatar_url: string | null } })[];
    },
  });
}
