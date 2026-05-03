import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Icon, StarRating } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees, timeAgo } from "@/lib/format";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState,
  Pill, StatusDot,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_ACCENT2, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type WithRestaurant<T> = T & { restaurants: { name: string | null } | null };

const roleTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "amber"> = {
  customer: "neutral", owner: "saffron", manager: "lilac", super_admin: "amber",
};

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
    try {
      await supabase.from("users").update({ is_active: !user.is_active }).eq("id", user.id);
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(user.is_active ? "User suspended" : "User reactivated");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }

  async function adjustPoints(delta: number) {
    if (!user) return;
    try {
      const { error } = await supabase.from("loyalty_transactions").insert({
        user_id: user.id,
        type: "adjusted_admin",
        points: delta,
        description: `Admin adjustment ${delta > 0 ? "+" : ""}${delta}`,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      toast.success(`${delta > 0 ? "+" : ""}${delta} points`);
    } catch (e) {
      toast.error("Could not adjust", (e as Error).message);
    }
  }

  if (!user) {
    return (
      <PageScroll>
        <PageHeader title="Customer profile" subtitle="Loading…" />
      </PageScroll>
    );
  }

  const totalSpend = (orders ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const noShows = (bookings ?? []).filter((b) => b.status === "no_show").length;
  const cancellations = (bookings ?? []).filter((b) => b.status === "cancelled").length;

  return (
    <PageScroll>
      <Pressable
        onPress={() => router.back()}
        style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: ADMIN_PANEL, borderWidth: 1, borderColor: ADMIN_HAIRLINE }}
      >
        <Icon name="chevron.left" size={11} color={ADMIN_INK2} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: ADMIN_INK2 }}>Back to people</Text>
      </Pressable>

      <CardShell padded>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Avatar name={user.name ?? user.email} uri={user.avatar_url} size={64} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.4 }}>{user.name ?? "Unnamed"}</Text>
            <Text style={{ marginTop: 2, fontSize: 12.5, color: ADMIN_INK2 }}>{user.email}</Text>
            <Text style={{ marginTop: 1, fontSize: 12, color: ADMIN_INK3 }}>{user.phone ?? "No phone on file"}</Text>
            <View style={{ marginTop: 8, flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <Pill tone={roleTone[user.role] ?? "neutral"}>{user.role.replace("_", " ")}</Pill>
              <Pill tone={user.is_active ? "green" : "red"}>{user.is_active ? "Active" : "Suspended"}</Pill>
              <Pill tone="amber" icon="star.fill">{user.loyalty_tier} · {user.loyalty_points} pts</Pill>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 18, paddingTop: 16,
            borderTopWidth: 1, borderTopColor: ADMIN_HAIRLINE,
            flexDirection: "row", flexWrap: "wrap", gap: 16,
          }}
        >
          <Stat label="Orders" value={String(orders?.length ?? 0)} />
          <Stat label="Bookings" value={String(bookings?.length ?? 0)} />
          <Stat label="Reviews" value={String(reviews?.length ?? 0)} />
          <Stat label="Tickets" value={String(tickets?.length ?? 0)} />
          <Stat label="Total spend" value={rupees(totalSpend)} />
          <Stat label="Points" value={String(user.loyalty_points)} />
          <Stat label="No-shows" value={String(noShows)} mute={noShows > 0} />
          <Stat label="Cancels" value={String(cancellations)} mute={cancellations > 0} />
        </View>
      </CardShell>

      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label="+50 points" variant="secondary" onPress={() => adjustPoints(50)} fullWidth />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label="-50 points" variant="secondary" onPress={() => adjustPoints(-50)} fullWidth />
        </View>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Button
            label={user.is_active ? "Suspend account" : "Reactivate account"}
            variant={user.is_active ? "destructive" : "primary"}
            onPress={toggleActive}
            fullWidth
          />
        </View>
      </View>

      <Button
        label="Delete user (irreversible)"
        variant="destructive"
        onPress={async () => {
          if (typeof window !== "undefined" && !window.confirm(`Permanently delete ${user.name ?? user.email}? This removes orders, bookings, reviews, chats, and the account itself.`)) return;
          try {
            const { error } = await supabase.rpc("admin_delete_user", { p_user_id: user.id });
            if (error) throw error;
            toast.success("User deleted");
            qc.invalidateQueries({ queryKey: ["admin-users"] });
            router.replace("/admin/users");
          } catch (e) {
            toast.error("Could not delete", (e as Error).message);
          }
        }}
        fullWidth
      />

      {tickets && tickets.length > 0 ? (
        <CardShell>
          <CardHeader title="Complaints & tickets" subtitle={`${tickets.length} on record`} right={<Pill tone="red" icon="exclamationmark.triangle.fill">Hot</Pill>} />
          {tickets.slice(0, 5).map((t, i) => (
            <View
              key={t.id}
              style={{
                paddingHorizontal: 18, paddingVertical: 14,
                borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MonoText size={11} color={ADMIN_INK3}>{t.ticket_number}</MonoText>
                <Pill tone={t.priority === "critical" ? "red" : t.priority === "high" ? "amber" : "neutral"}>{t.priority}</Pill>
                <Pill tone={t.status === "resolved" || t.status === "closed" ? "green" : "amber"}>{t.status.replace("_", " ")}</Pill>
              </View>
              <Text style={{ marginTop: 6, fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>{t.subject}</Text>
              <Text style={{ marginTop: 2, fontSize: 11.5, color: ADMIN_INK3 }}>{t.category.replace("_", " ")} · {timeAgo(t.created_at)}</Text>
            </View>
          ))}
        </CardShell>
      ) : null}

      <CardShell>
        <CardHeader title="Bookings" subtitle={`${bookings?.length ?? 0} total`} />
        {(bookings ?? []).length === 0 ? (
          <EmptyState icon="calendar" title="No bookings" body="This customer hasn't reserved a table yet." compact />
        ) : null}
        {(bookings ?? []).slice(0, 8).map((b, i) => (
          <View
            key={b.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>{b.restaurants?.name ?? "—"}</Text>
              <MonoText size={11} color={ADMIN_INK3}>{b.date} · {b.time} · {b.guests} GUESTS</MonoText>
            </View>
            <Pill tone={b.status === "completed" || b.status === "arrived" ? "green" : b.status === "cancelled" || b.status === "no_show" ? "red" : "amber"}>
              {b.status}
            </Pill>
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader title="Orders" subtitle={`${orders?.length ?? 0} total · ${rupees(totalSpend)} lifetime`} />
        {(orders ?? []).length === 0 ? (
          <EmptyState icon="bag.fill" title="No orders" body="No orders placed yet." compact />
        ) : null}
        {(orders ?? []).slice(0, 8).map((o, i) => (
          <View
            key={o.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingHorizontal: 18, paddingVertical: 12,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <MonoText size={11} color={ADMIN_INK3}>{o.order_number}</MonoText>
              <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 13, fontWeight: "600", color: ADMIN_INK }}>{o.restaurants?.name ?? "—"}</Text>
              <Text style={{ fontSize: 11, color: ADMIN_INK3 }}>{timeAgo(o.created_at)}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <MonoText size={13} weight="700">{rupees(o.total_amount)}</MonoText>
              <Pill tone={o.status === "paid" ? "green" : o.status === "cancelled" ? "red" : "amber"}>{o.status}</Pill>
            </View>
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader title="Reviews" subtitle={`${reviews?.length ?? 0} total`} />
        {(reviews ?? []).length === 0 ? (
          <EmptyState icon="star.fill" title="No reviews yet" body="No public reviews from this account." compact />
        ) : null}
        {(reviews ?? []).slice(0, 6).map((r, i) => (
          <View
            key={r.id}
            style={{
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>{r.restaurants?.name ?? "—"}</Text>
              <StarRating value={r.overall_rating} readOnly size={13} />
            </View>
            {r.text ? (
              <Text numberOfLines={3} style={{ marginTop: 4, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 18 }}>{r.text}</Text>
            ) : null}
            <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(r.created_at).toUpperCase()}</MonoText>
          </View>
        ))}
      </CardShell>
    </PageScroll>
  );
}

function Stat({ label, value, mute }: { label: string; value: string; mute?: boolean }) {
  return (
    <View style={{ minWidth: 110 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: ADMIN_INK3, letterSpacing: 0.6, fontFamily: ADMIN_MONO, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 18, fontWeight: "700", color: mute ? ADMIN_RED : ADMIN_INK, letterSpacing: -0.4, fontFamily: ADMIN_MONO }}>{value}</Text>
    </View>
  );
}
