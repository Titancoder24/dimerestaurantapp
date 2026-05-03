// Hooks for the 10 new restaurant-management modules.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const dayKey = (d: Date = new Date()) => d.toISOString().slice(0, 10);

// ─────────── 1. Shifts & Time Clock ───────────
export type ShiftRow = {
  id: string; restaurant_id: string; user_id: string;
  scheduled_start: string | null; scheduled_end: string | null;
  clock_in: string | null; clock_out: string | null;
  role: string; notes: string | null; status: string;
  user?: { name: string | null; email: string };
};
export function useShifts(restaurantId?: string) {
  return useQuery({
    queryKey: ["shifts", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts").select("*, user:users(name,email)")
        .eq("restaurant_id", restaurantId!)
        .order("scheduled_start", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data as ShiftRow[];
    },
  });
}

// ─────────── 2. Customer CRM ───────────
export type CustomerProfileRow = {
  id: string; restaurant_id: string; full_name: string;
  phone: string | null; email: string | null;
  birthday: string | null; anniversary: string | null;
  dietary: string[]; allergens: string[];
  visits: number; total_spend: number;
  loyalty_tier: string; staff_notes: string | null;
  last_visit: string | null;
};
export function useCustomers(restaurantId?: string) {
  return useQuery({
    queryKey: ["crm-customers", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_profiles").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("last_visit", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return data as CustomerProfileRow[];
    },
  });
}

// ─────────── 3. Cash Reconciliation ───────────
export type CashReconRow = {
  id: string; restaurant_id: string; business_date: string;
  expected_cash: number; expected_card: number; expected_upi: number;
  counted_cash: number; counted_card: number; counted_upi: number;
  variance: number; status: string; notes: string | null;
  closed_at: string | null;
};
export function useCashRecons(restaurantId?: string) {
  return useQuery({
    queryKey: ["cash-recons", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_reconciliations").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("business_date", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data as CashReconRow[];
    },
  });
}

// ─────────── 4. Recipes & Food Cost ───────────
export type RecipeRow = {
  id: string; restaurant_id: string; menu_item_id: string | null;
  yield_qty: number; yield_unit: string; notes: string | null;
  menu_item?: { name: string; price: number } | null;
  total_cost?: number;
};
export function useRecipes(restaurantId?: string) {
  return useQuery({
    queryKey: ["recipes", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes").select(`*, menu_item:menu_items(name,price), recipe_ingredients(line_cost)`)
        .eq("restaurant_id", restaurantId!);
      if (error) throw error;
      return (data ?? []).map((r: { recipe_ingredients?: { line_cost: number }[] } & Record<string, unknown>) => ({
        ...(r as object),
        total_cost: (r.recipe_ingredients ?? []).reduce(
          (s: number, ri: { line_cost: number }) => s + Number(ri.line_cost ?? 0),
          0
        ),
      })) as RecipeRow[];
    },
  });
}

// ─────────── 5. Vendors & Purchase Orders ───────────
export type VendorRow = {
  id: string; restaurant_id: string; name: string;
  contact_name: string | null; phone: string | null; email: string | null;
  payment_terms: string | null; lead_days: number | null;
  category: string | null; is_active: boolean;
};
export function useVendors(restaurantId?: string) {
  return useQuery({
    queryKey: ["vendors", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("name");
      if (error) throw error;
      return data as VendorRow[];
    },
  });
}

export type PORow = {
  id: string; restaurant_id: string; vendor_id: string | null;
  po_number: string | null; status: string;
  subtotal: number; tax: number; total: number;
  expected_delivery: string | null; received_at: string | null;
  notes: string | null;
  created_at: string;
  vendor?: { name: string } | null;
};
export function usePurchaseOrders(restaurantId?: string) {
  return useQuery({
    queryKey: ["pos", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders").select("*, vendor:vendors(name)")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PORow[];
    },
  });
}

// ─────────── 6. Wastage ───────────
export type WastageRow = {
  id: string; restaurant_id: string;
  inventory_id: string | null; menu_item_id: string | null;
  description: string | null; qty: number; unit: string;
  reason: string; cost: number; notes: string | null;
  created_at: string;
};
export function useWastage(restaurantId?: string) {
  return useQuery({
    queryKey: ["wastage", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wastage_logs").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WastageRow[];
    },
  });
}

// ─────────── 8. Tip Pool ───────────
export type TipRow = {
  id: string; restaurant_id: string; user_id: string;
  business_date: string; amount: number; source: string;
  user?: { name: string | null } | null;
};
export function useTips(restaurantId?: string) {
  return useQuery({
    queryKey: ["tips", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tip_entries").select("*, user:users(name)")
        .eq("restaurant_id", restaurantId!)
        .order("business_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as TipRow[];
    },
  });
}

// ─────────── 9. Waitlist ───────────
export type WaitlistRow = {
  id: string; restaurant_id: string;
  guest_name: string; phone: string | null; party_size: number;
  estimated_wait_min: number | null; status: string;
  notified_at: string | null; seated_at: string | null;
  created_at: string;
};
export function useWaitlist(restaurantId?: string) {
  return useQuery({
    queryKey: ["waitlist", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist_entries").select("*")
        .eq("restaurant_id", restaurantId!)
        .in("status", ["waiting", "ready"])
        .order("created_at");
      if (error) throw error;
      return data as WaitlistRow[];
    },
  });
}

// ─────────── 10. 86-list & Daily Specials ───────────
export type EightySixRow = {
  id: string; restaurant_id: string; menu_item_id: string;
  business_date: string; reason: string | null;
  cleared_at: string | null;
  menu_item?: { name: string; price: number } | null;
};
export function useEightySixList(restaurantId?: string) {
  return useQuery({
    queryKey: ["86-list", restaurantId, dayKey()],
    enabled: !!restaurantId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eighty_six_list").select("*, menu_item:menu_items(name,price)")
        .eq("restaurant_id", restaurantId!)
        .eq("business_date", dayKey())
        .is("cleared_at", null);
      if (error) throw error;
      return data as EightySixRow[];
    },
  });
}

export type SpecialRow = {
  id: string; restaurant_id: string; menu_item_id: string | null;
  name: string; description: string | null; special_price: number | null;
  image_url: string | null; business_date: string;
};
export function useDailySpecials(restaurantId?: string) {
  return useQuery({
    queryKey: ["daily-specials", restaurantId, dayKey()],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_specials").select("*")
        .eq("restaurant_id", restaurantId!)
        .eq("business_date", dayKey());
      if (error) throw error;
      return data as SpecialRow[];
    },
  });
}

// ─────────── Generic insert/update helpers ───────────
// We use the untyped supabase client so insert/update accept any shape.
export function useInsert<T extends Record<string, unknown>>(
  table: string,
  invalidate: string[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: T) => {
      const { data, error } = await supabase.from(table).insert(row as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      for (const k of invalidate) qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

export function useUpdate<T extends Record<string, unknown>>(
  table: string,
  invalidate: string[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: T }) => {
      const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      for (const k of invalidate) qc.invalidateQueries({ queryKey: [k] });
    },
  });
}
