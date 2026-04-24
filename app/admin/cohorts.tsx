import { useMemo } from "react";
import { Text, View, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Header, Icon, Screen } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";

const WEEKS = 8;

export default function Cohorts() {
  const { data: users } = useQuery({
    queryKey: ["cohort-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, created_at, role, loyalty_tier")
        .eq("role", "customer")
        .gte("created_at", dayjs().subtract(WEEKS, "week").toISOString());
      if (error) throw error;
      return data as Pick<Tables<"users">, "id" | "created_at" | "role" | "loyalty_tier">[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["cohort-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("user_id, total_amount, created_at, status")
        .gte("created_at", dayjs().subtract(WEEKS, "week").toISOString())
        .eq("status", "paid");
      if (error) throw error;
      return data as Pick<Tables<"orders">, "user_id" | "total_amount" | "created_at" | "status">[];
    },
  });

  const cohortRows = useMemo(() => {
    if (!users) return [];
    // Group users by signup week
    const byWeek = new Map<string, string[]>();
    for (const u of users) {
      const wk = dayjs(u.created_at).startOf("week").format("YYYY-MM-DD");
      const list = byWeek.get(wk) ?? [];
      list.push(u.id);
      byWeek.set(wk, list);
    }
    const ordersByUser = new Map<string, { ts: string; amount: number }[]>();
    for (const o of orders ?? []) {
      if (!o.user_id) continue;
      const list = ordersByUser.get(o.user_id) ?? [];
      list.push({ ts: o.created_at, amount: Number(o.total_amount) });
      ordersByUser.set(o.user_id, list);
    }

    // Build retention matrix: for each cohort, % active in week 0..N
    const cohorts = Array.from(byWeek.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
    return cohorts.map(([weekStart, ids]) => {
      const cohortStart = dayjs(weekStart);
      const matrix: number[] = [];
      for (let w = 0; w < WEEKS; w++) {
        const winStart = cohortStart.add(w, "week");
        const winEnd = winStart.add(1, "week");
        const active = ids.filter((id) => {
          const list = ordersByUser.get(id) ?? [];
          return list.some((o) => dayjs(o.ts).isAfter(winStart) && dayjs(o.ts).isBefore(winEnd));
        }).length;
        matrix.push(ids.length > 0 ? Math.round((active / ids.length) * 100) : 0);
      }
      const totalSpent = ids.reduce((s, id) => s + (ordersByUser.get(id) ?? []).reduce((a, o) => a + o.amount, 0), 0);
      const ltv = ids.length ? totalSpent / ids.length : 0;
      return { week: cohortStart.format("DD MMM"), size: ids.length, matrix, ltv };
    });
  }, [users, orders]);

  return (
    <Screen>
      <Header title="Cohorts & Retention" subtitle={`${WEEKS}-week window · paid orders`} />

      <View className="mx-4 rounded-2xl border border-dime-border bg-white p-4">
        <Text className="text-[14px] font-semibold text-dime-ink">How to read</Text>
        <Text className="mt-1 text-[12px] text-dime-ink-3">
          Each row is a signup week. Columns show what % of that cohort placed at least one paid order in week 0, 1, 2…
          Healthy products keep colour bright as you move right. LTV is average spend per customer in that cohort to date.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
        <View className="ml-4 mr-4">
          <View className="flex-row">
            <Cell label="Cohort" head w={80} />
            <Cell label="Size" head w={56} />
            {Array.from({ length: WEEKS }).map((_, i) => (
              <Cell key={i} label={`W${i}`} head w={48} />
            ))}
            <Cell label="LTV" head w={80} />
          </View>
          {cohortRows.map((c, idx) => (
            <View key={idx} className="flex-row">
              <Cell label={c.week} w={80} />
              <Cell label={String(c.size)} w={56} />
              {c.matrix.map((pct, i) => (
                <View key={i} style={{ width: 48, padding: 2 }}>
                  <View
                    style={{
                      backgroundColor: heatColor(pct),
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: pct > 40 ? "#fff" : "#1C1C1E" }}>{pct}%</Text>
                  </View>
                </View>
              ))}
              <Cell label={rupees(c.ltv)} w={80} />
            </View>
          ))}
          {cohortRows.length === 0 ? (
            <View className="px-4 py-12 items-center">
              <Icon name="chart.bar.fill" size={28} color="#C7C7CC" />
              <Text className="mt-2 text-[13px] text-dime-ink-3">Not enough signup data yet.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Cell({ label, w, head }: { label: string; w: number; head?: boolean }) {
  return (
    <View style={{ width: w }} className="px-2 py-2 justify-center">
      <Text className={`${head ? "text-[10px] font-bold uppercase tracking-widest text-dime-ink-3" : "text-[12px] text-dime-ink-2"}`}>
        {label}
      </Text>
    </View>
  );
}

function heatColor(pct: number): string {
  // White → orange gradient.
  if (pct === 0) return "#FAFAFA";
  if (pct < 10) return "#FFF4EA";
  if (pct < 25) return "#FFE4CC";
  if (pct < 40) return "#FFCF9E";
  if (pct < 60) return "#FE9C3F";
  if (pct < 80) return "#FC8019";
  return "#E06E10";
}
