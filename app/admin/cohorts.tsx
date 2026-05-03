import { useMemo } from "react";
import { Text, View, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { supabase, type Tables } from "@/lib/supabase";
import { rupees } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_MONO,
} from "@/components/admin/shell";

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
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · GROWTH · COHORTS"
        title="Cohorts & retention"
        subtitle={`${WEEKS}-week window · diners only · paid orders only`}
        rightSlot={<Pill tone="lilac" icon="chart.bar.fill">Heatmap</Pill>}
      />

      <CardShell padded>
        <Text style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2 }}>How to read this matrix</Text>
        <Text style={{ marginTop: 6, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 19 }}>
          Each row is a signup week. Columns show what percentage of that cohort placed at least one paid order in week 0, 1, 2 and onwards.
          Healthier products keep cells bright as you move right. LTV is average spend per customer in that cohort to date.
        </Text>
      </CardShell>

      <CardShell>
        <CardHeader title="Retention matrix" subtitle={`${cohortRows.length} cohorts captured`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
            <View style={{ flexDirection: "row" }}>
              <Cell label="Cohort" head w={88} />
              <Cell label="Size" head w={56} />
              {Array.from({ length: WEEKS }).map((_, i) => (
                <Cell key={i} label={`W${i}`} head w={48} />
              ))}
              <Cell label="LTV" head w={92} />
            </View>
            {cohortRows.map((c, idx) => (
              <View key={idx} style={{ flexDirection: "row" }}>
                <Cell label={c.week} w={88} />
                <Cell label={String(c.size)} w={56} mono />
                {c.matrix.map((pct, i) => (
                  <View key={i} style={{ width: 48, padding: 3 }}>
                    <View
                      style={{
                        backgroundColor: heatColor(pct),
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: "center",
                        borderWidth: 1, borderColor: heatBorder(pct),
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: pct > 40 ? "#fff" : ADMIN_INK2, fontFamily: ADMIN_MONO }}>{pct}%</Text>
                    </View>
                  </View>
                ))}
                <Cell label={rupees(c.ltv)} w={92} mono />
              </View>
            ))}
          </View>
        </ScrollView>
        {cohortRows.length === 0 ? (
          <EmptyState icon="chart.bar.fill" title="Not enough signup data yet" body="Once new diners sign up over the trailing 8 weeks, the heatmap fills in." compact />
        ) : null}
      </CardShell>
    </PageScroll>
  );
}

function Cell({ label, w, head, mono }: { label: string; w: number; head?: boolean; mono?: boolean }) {
  return (
    <View
      style={{
        width: w, paddingHorizontal: 8, paddingVertical: 8,
        justifyContent: "center",
        borderBottomWidth: head ? 1 : 0, borderBottomColor: ADMIN_HAIRLINE,
      }}
    >
      <Text
        style={{
          fontSize: head ? 10 : 12,
          fontWeight: head ? "700" : "600",
          color: head ? ADMIN_INK3 : ADMIN_INK2,
          letterSpacing: head ? 1.2 : 0,
          textTransform: head ? "uppercase" : "none",
          fontFamily: head || mono ? ADMIN_MONO : undefined,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function heatColor(pct: number): string {
  if (pct === 0) return "#141414";
  if (pct < 10) return "#1F0F08";
  if (pct < 25) return "#2B1810";
  if (pct < 40) return "#5C2E18";
  if (pct < 60) return "#A03D1A";
  if (pct < 80) return "#FF5A1F";
  return "#FF7A3F";
}

function heatBorder(pct: number): string {
  if (pct < 25) return "#1F1F1F";
  if (pct < 60) return "#5C2E18";
  return "#FF8A50";
}
