import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Button, Header, Icon, Screen, StarRating } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";
import { useToast } from "@/store/toast";

type WithRestaurant<T> = T & { restaurants: { name: string | null } | null };

export default function AdminUserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: user } = useQuery({
    queryKey: ["admin-user", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Tables<"users"> | null;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-user-orders", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders").select("*, restaurants(name)").eq("user_id", id!).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data as WithRestaurant<Tables<"orders">>[];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["admin-user-bookings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings").select("*, restaurants(name)").eq("user_id", id!).order("date", { ascending: false }).limit(20);
      if (error) throw error;
      return data as WithRestaurant<Tables<"bookings">>[];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["admin-user-reviews", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews").select("*, restaurants(name)").eq("user_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as WithRestaurant<Tables<"reviews">>[];
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ["admin-user-tickets", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets").select("*").eq("user_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"support_tickets">[];
    },
  });

  async function toggleActive() {
    if (!user) return;
    await supabase.from("users").update({ is_active: !user.is_active }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["admin-user", id] });
    toast.success(user.is_active ? "User suspended" : "User reactivated");
  }

  async function adjustPoints(delta: number) {
    if (!user) return;
    await supabase.from("loyalty_transactions").insert({
      user_id: user.id,
      type: "adjusted_admin",
      points: delta,
      description: `Admin adjustment ${delta > 0 ? "+" : ""}${delta}`,
    });
    qc.invalidateQueries({ queryKey: ["admin-user", id] });
    toast.success(`${delta > 0 ? "+" : ""}${delta} points`);
  }

  if (!user) return null;

  const totalSpend = (orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const noShows = (bookings ?? []).filter((b) => b.status === "no_show").length;
  const cancellations = (bookings ?? []).filter((b) => b.status === "cancelled").length;

  return (
    <Screen>
      <Header title="Customer profile" back />

      <View className="mx-4 overflow-hidden rounded-2xl bg-dime-ink" style={{ backgroundColor: "#1C1C1E" }}>
        <View className="p-5">
          <View className="flex-row items-center gap-3">
            <Avatar name={user.name ?? user.email} uri={user.avatar_url} size={56} />
            <View className="flex-1">
              <Text className="text-[18px] font-semibold text-white">{user.name ?? "—"}</Text>
              <Text className="text-[12px] text-white/60">{user.email}</Text>
              <Text className="text-[12px] text-white/60">{user.phone ?? "no phone"}</Text>
              <View className="mt-1.5 flex-row gap-2">
                <Badge tone={user.role === "super_admin" ? "gold" : user.role === "owner" ? "orange" : "gray"} label={user.role} />
                <Badge tone={user.is_active ? "green" : "red"} label={user.is_active ? "Active" : "Suspended"} />
                <Badge tone="gold" label={user.loyalty_tier} />
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row justify-around border-t border-white/10 pt-4">
            <Stat label="Orders" value={String(orders?.length ?? 0)} />
            <Stat label="Bookings" value={String(bookings?.length ?? 0)} />
            <Stat label="Reviews" value={String(reviews?.length ?? 0)} />
            <Stat label="Tickets" value={String(tickets?.length ?? 0)} />
          </View>
          <View className="mt-3 flex-row justify-around">
            <Stat label="Total spend" value={rupees(totalSpend)} />
            <Stat label="Points" value={String(user.loyalty_points)} />
            <Stat label="No-shows" value={String(noShows)} />
            <Stat label="Cancels" value={String(cancellations)} />
          </View>
        </View>
      </View>

      <View className="mx-4 mt-4 flex-row gap-2">
        <View className="flex-1">
          <Button label="+50 points" variant="secondary" onPress={() => adjustPoints(50)} fullWidth />
        </View>
        <View className="flex-1">
          <Button label="-50 points" variant="secondary" onPress={() => adjustPoints(-50)} fullWidth />
        </View>
        <View className="flex-1">
          <Button
            label={user.is_active ? "Suspend" : "Reactivate"}
            variant={user.is_active ? "destructive" : "primary"}
            onPress={toggleActive}
            fullWidth
          />
        </View>
      </View>

      {tickets && tickets.length > 0 ? (
        <Section title="Complaints & tickets" icon="tray.fill">
          <View className="gap-2">
            {tickets.slice(0, 5).map((t) => (
              <View key={t.id} className="rounded-xl border border-dime-border bg-white p-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-dime-ink-3">{t.ticket_number}</Text>
                  <Badge tone={t.priority === "critical" ? "red" : t.priority === "high" ? "orange" : "gray"} label={t.priority} />
                  <Badge tone={t.status === "resolved" || t.status === "closed" ? "green" : "red"} label={t.status.replace("_", " ")} />
                </View>
                <Text className="mt-1 text-[14px] font-semibold text-dime-ink">{t.subject}</Text>
                <Text className="text-[11px] text-dime-ink-3">{t.category.replace("_", " ")} · {timeAgo(t.created_at)}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Bookings" icon="calendar">
        <View className="gap-2">
          {(bookings ?? []).slice(0, 8).map((b) => (
            <View key={b.id} className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink">{b.restaurants?.name ?? "—"}</Text>
                <Text className="text-[11px] text-dime-ink-3">{b.date} · {b.time} · {b.guests} guests</Text>
              </View>
              <Badge tone={b.status === "completed" || b.status === "arrived" ? "green" : b.status === "cancelled" || b.status === "no_show" ? "red" : "orange"} label={b.status} />
            </View>
          ))}
          {(bookings ?? []).length === 0 ? <Text className="text-[12px] text-dime-ink-3">No bookings.</Text> : null}
        </View>
      </Section>

      <Section title="Orders" icon="bag.fill">
        <View className="gap-2">
          {(orders ?? []).slice(0, 8).map((o) => (
            <View key={o.id} className="flex-row items-center gap-3 rounded-xl border border-dime-border bg-white p-3">
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-dime-ink">{o.order_number}</Text>
                <Text className="text-[11px] text-dime-ink-3">{o.restaurants?.name ?? "—"} · {timeAgo(o.created_at)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[13px] font-semibold text-dime-ink">{rupees(o.total_amount)}</Text>
                <Badge tone={o.status === "paid" ? "gray" : o.status === "cancelled" ? "red" : "orange"} label={o.status} />
              </View>
            </View>
          ))}
          {(orders ?? []).length === 0 ? <Text className="text-[12px] text-dime-ink-3">No orders.</Text> : null}
        </View>
      </Section>

      <Section title="Reviews" icon="star.fill">
        <View className="gap-2">
          {(reviews ?? []).slice(0, 6).map((r) => (
            <View key={r.id} className="rounded-xl border border-dime-border bg-white p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-dime-ink">{r.restaurants?.name ?? "—"}</Text>
                <StarRating value={r.overall_rating} readOnly size={14} />
              </View>
              {r.text ? <Text numberOfLines={3} className="mt-1 text-[12px] text-dime-ink-2">{r.text}</Text> : null}
              <Text className="mt-1 text-[10px] text-dime-ink-3">{timeAgo(r.created_at)}</Text>
            </View>
          ))}
          {(reviews ?? []).length === 0 ? <Text className="text-[12px] text-dime-ink-3">No reviews.</Text> : null}
        </View>
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="items-center">
      <Text className="text-[16px] font-semibold text-white">{value}</Text>
      <Text className="text-[10px] uppercase tracking-widest text-white/60">{label}</Text>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-5">
      <View className="mb-2 flex-row items-center gap-2">
        <Icon name={icon} size={14} color="#FC8019" />
        <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-ink-3">{title}</Text>
      </View>
      {children}
    </View>
  );
}
