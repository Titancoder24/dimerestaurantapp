// Hooks for the 8 additional restaurant-management modules.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* ── 1. Loyalty ─────────────────────────────────────────────── */
export type LoyaltyProgramRow = {
  id: string; restaurant_id: string;
  name: string; points_per_rupee: number; redemption_rate: number;
  birthday_bonus_pts: number; tier_thresholds: Record<string, number>;
  is_active: boolean;
};
export type LoyaltyRewardRow = {
  id: string; restaurant_id: string;
  name: string; description: string | null;
  points_required: number; reward_type: string; reward_value: number;
  valid_from: string | null; valid_to: string | null; is_active: boolean;
};
export function useLoyalty(restaurantId?: string) {
  return useQuery({
    queryKey: ["loyalty", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const [progs, rewards] = await Promise.all([
        supabase.from("loyalty_programs").select("*").eq("restaurant_id", restaurantId!),
        supabase.from("loyalty_rewards").select("*").eq("restaurant_id", restaurantId!).order("points_required"),
      ]);
      if (progs.error) throw progs.error;
      if (rewards.error) throw rewards.error;
      return {
        program: (progs.data?.[0] ?? null) as LoyaltyProgramRow | null,
        rewards: (rewards.data ?? []) as LoyaltyRewardRow[],
      };
    },
  });
}

/* ── 2. Expenses ────────────────────────────────────────────── */
export type ExpenseRow = {
  id: string; restaurant_id: string;
  category: string; vendor_name: string | null; description: string | null;
  amount: number; date: string; payment_method: string | null;
  receipt_url: string | null; notes: string | null;
};
export function useExpenses(restaurantId?: string) {
  return useQuery({
    queryKey: ["expenses", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("date", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
  });
}

/* ── 3. Compliance items ────────────────────────────────────── */
export type ComplianceRow = {
  id: string; restaurant_id: string;
  kind: string; title: string; reference_number: string | null;
  document_url: string | null; issued_at: string | null;
  expires_at: string | null; status: "active" | "expired" | "renewing" | "superseded";
  notes: string | null;
};
export function useCompliance(restaurantId?: string) {
  return useQuery({
    queryKey: ["compliance", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_items").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("expires_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ComplianceRow[];
    },
  });
}

/* ── 6. Equipment + service log ─────────────────────────────── */
export type EquipmentRow = {
  id: string; restaurant_id: string;
  name: string; category: string | null; serial_number: string | null;
  vendor_name: string | null; purchase_date: string | null;
  warranty_until: string | null; last_serviced_at: string | null;
  next_service_due: string | null;
  status: "operational" | "needs_service" | "out_of_service" | "retired";
  notes: string | null;
};
export function useEquipment(restaurantId?: string) {
  return useQuery({
    queryKey: ["equipment", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("next_service_due", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as EquipmentRow[];
    },
  });
}

/* ── 7. Banquet events ──────────────────────────────────────── */
export type BanquetRow = {
  id: string; restaurant_id: string;
  customer_name: string; phone: string | null; email: string | null;
  event_date: string; event_time: string | null; guest_count: number;
  event_type: string; package_name: string | null;
  total_quote: number; deposit_paid: number; balance_due: number;
  status: "inquiry" | "quoted" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
};
export function useBanquets(restaurantId?: string) {
  return useQuery({
    queryKey: ["banquets", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banquet_events").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BanquetRow[];
    },
  });
}

/* ── 8. Delivery reconciliations ────────────────────────────── */
export type DeliveryReconRow = {
  id: string; restaurant_id: string;
  platform: "swiggy" | "zomato" | "dunzo" | "magicpin" | "other";
  business_date: string;
  gross_sales: number; order_count: number;
  commission_pct: number; commission_amount: number;
  delivery_fees: number; taxes: number; refunds: number;
  net_payout: number;
  payout_received_at: string | null; notes: string | null;
};
export function useDeliveryRecons(restaurantId?: string) {
  return useQuery({
    queryKey: ["delivery-recon", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_reconciliations").select("*")
        .eq("restaurant_id", restaurantId!)
        .order("business_date", { ascending: false }).limit(180);
      if (error) throw error;
      return (data ?? []) as DeliveryReconRow[];
    },
  });
}
