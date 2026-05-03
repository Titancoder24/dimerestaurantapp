import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Avatar, haptic } from "@/components/ui";
import { useAdminTickets } from "@/hooks/admin";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  StatRow, StatTile,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_PANEL, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type StatusFilter = "all" | "open" | "in_progress" | "resolved";
const filters: StatusFilter[] = ["all", "open", "in_progress", "resolved"];

const priorityTone: Record<string, "neutral" | "red" | "amber" | "green"> = {
  critical: "red", high: "amber", medium: "neutral", low: "neutral",
};

const statusTone: Record<string, "neutral" | "saffron" | "lilac" | "green" | "red" | "amber"> = {
  open: "red", in_progress: "amber", resolved: "green", closed: "green",
};

export default function AdminSupport() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useAdminTickets();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const list = data ?? [];
  const filtered = list.filter((t) => filter === "all" || t.status === filter);
  const counts = {
    open: list.filter((t) => t.status === "open").length,
    inProgress: list.filter((t) => t.status === "in_progress").length,
    resolved: list.filter((t) => t.status === "resolved").length,
    critical: list.filter((t) => t.priority === "critical").length,
  };

  async function setStatus(id: string, status: "in_progress" | "resolved" | "open") {
    try {
      await supabase.from("support_tickets").update({ status }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast.success(status === "in_progress" ? "Ticket taken" : status === "resolved" ? "Resolved" : "Re-opened");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · PLATFORM · INBOX"
        title="Support helpdesk"
        subtitle={`${list.length} tickets total · ${counts.open} unassigned`}
      />

      <StatRow>
        <StatTile icon="exclamationmark.triangle.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Open" value={String(counts.open)} hint="Awaiting first response" />
        <StatTile icon="clock.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="In progress" value={String(counts.inProgress)} hint="Active investigation" />
        <StatTile icon="checkmark.circle.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Resolved" value={String(counts.resolved)} hint="Closed this view" />
        <StatTile icon="exclamationmark.octagon.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Critical" value={String(counts.critical)} hint="Highest priority" />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = f === filter;
          const count = f === "all" ? list.length : list.filter((t) => t.status === f).length;
          return (
            <Pressable
              key={f}
              onPress={() => { haptic.light(); setFilter(f); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2, textTransform: "capitalize" }}>{f.replace("_", " ")}</Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: active ? ADMIN_BG : ADMIN_INK3, fontFamily: ADMIN_MONO }}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Ticket queue" subtitle={`${filtered.length} match · click Take to claim`} />
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="checkmark.circle.fill"
            iconColor={ADMIN_GREEN}
            iconBg="#0E2F1F"
            title="Inbox zero"
            body="No tickets in this bucket. Healthy support load — nice work."
            compact
          />
        ) : null}
        {filtered.map((t, i) => (
          <View
            key={t.id}
            style={{
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={t.users?.name ?? t.users?.email ?? "?"} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: ADMIN_INK }}>{t.subject}</Text>
                <View style={{ marginTop: 2, flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <MonoText size={11} color={ADMIN_INK3}>{t.ticket_number}</MonoText>
                  <Text numberOfLines={1} style={{ fontSize: 11.5, color: ADMIN_INK2 }}>{t.users?.email ?? "—"}</Text>
                </View>
                <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(t.created_at).toUpperCase()}</MonoText>
              </View>
              <Pill tone={priorityTone[t.priority] ?? "neutral"}>{t.priority}</Pill>
            </View>
            <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Pill tone="lilac">{t.category.replace("_", " ")}</Pill>
              <Pill tone={statusTone[t.status] ?? "neutral"}>{t.status.replace("_", " ")}</Pill>
              <View style={{ flex: 1 }} />
              {t.status === "open" ? (
                <Pressable
                  onPress={() => setStatus(t.id, "in_progress")}
                  style={{ height: 28, paddingHorizontal: 11, borderRadius: 7, backgroundColor: ADMIN_INK, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: ADMIN_BG }}>Take</Text>
                </Pressable>
              ) : null}
              {t.status === "in_progress" ? (
                <Pressable
                  onPress={() => setStatus(t.id, "resolved")}
                  style={{ height: 28, paddingHorizontal: 11, borderRadius: 7, backgroundColor: ADMIN_GREEN, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#04190E" }}>Resolve</Text>
                </Pressable>
              ) : null}
              {t.status === "resolved" ? (
                <Pressable
                  onPress={() => setStatus(t.id, "open")}
                  style={{ height: 28, paddingHorizontal: 11, borderRadius: 7, backgroundColor: ADMIN_HOVER, borderWidth: 1, borderColor: ADMIN_HAIRLINE, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: ADMIN_INK2 }}>Re-open</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </CardShell>
    </PageScroll>
  );
}
