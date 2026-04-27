import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/lib/supabase";

export function usePlatformStats() {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [restaurants, users, orders, pending] = await Promise.all([
        supabase.from("restaurants").select("id,status,city", { count: "exact" }),
        supabase.from("users").select("id,role", { count: "exact" }),
        supabase.from("orders").select("id,total_amount,created_at", { count: "exact" }).gte("created_at", new Date(Date.now() - 30 * 86400 * 1000).toISOString()),
        supabase.from("restaurants").select("id").eq("status", "pending"),
      ]);
      return {
        restaurants: restaurants.data ?? [],
        restaurantCount: restaurants.count ?? 0,
        users: users.data ?? [],
        userCount: users.count ?? 0,
        recentOrders: orders.data ?? [],
        pendingApplications: pending.data?.length ?? 0,
      };
    },
  });
}

export function useAdminRestaurants() {
  return useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"restaurants">[];
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"users">[];
    },
  });
}

export function useAdminTickets() {
  return useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, users(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Tables<"support_tickets"> & { users: { name: string | null; email: string } | null })[];
    },
  });
}
