// Module 1 of 10 — Shifts & Time Clock
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input, Sheet, Button, Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useAuth } from "@/store/auth";
import { useShifts, useInsert, useUpdate, type ShiftRow } from "@/hooks/management";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatusDot, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const STATUS_DOT: Record<string, string> = {
  scheduled: "#A1A09A", active: "#0F8A4F", completed: "#6F5BFF", no_show: "#D43A2F",
};

export default function Shifts() {
  const { data: restaurant } = useOwnedRestaurant();
  const me = useAuth((s) => s.profile);
  const { data: shifts } = useShifts(restaurant?.id);
  const insert = useInsert<Record<string, unknown>>("shifts", ["shifts"]);
  const update = useUpdate<Record<string, unknown>>("shifts", ["shifts"]);
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [role, setRole] = useState("server");

  const myActive = (shifts ?? []).find((s) => s.user_id === me?.id && s.status === "active");
  const today = new Date().toISOString().slice(0, 10);
  const activeCount = (shifts ?? []).filter((s) => s.status === "active").length;
  const scheduledCount = (shifts ?? []).filter((s) => s.status === "scheduled" && s.scheduled_start?.startsWith(today)).length;
  const completedToday = (shifts ?? []).filter((s) => s.status === "completed" && s.clock_out?.startsWith(today)).length;
  const totalHoursToday = (shifts ?? []).reduce((sum, s) => {
    if (!s.clock_in || !s.clock_out) return sum;
    if (!s.clock_in.startsWith(today)) return sum;
    const ms = new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime();
    return sum + Math.max(0, ms / 3_600_000);
  }, 0);

  const clockIn = async () => {
    if (!restaurant?.id || !me?.id) return;
    await insert.mutateAsync({
      restaurant_id: restaurant.id,
      user_id: me.id,
      role: me.role,
      clock_in: new Date().toISOString(),
      status: "active",
    });
    toast.success("Clocked in");
  };

  const clockOut = async (s: ShiftRow) => {
    await update.mutateAsync({
      id: s.id,
      patch: { clock_out: new Date().toISOString(), status: "completed" },
    });
    toast.success("Clocked out");
  };

  const addShift = async () => {
    if (!restaurant?.id || !me?.id || !start) return;
    await insert.mutateAsync({
      restaurant_id: restaurant.id, user_id: me.id, role,
      scheduled_start: new Date(start).toISOString(),
      scheduled_end: end ? new Date(end).toISOString() : null,
      status: "scheduled",
    });
    setShowAdd(false); setStart(""); setEnd("");
    toast.success("Shift scheduled");
  };

  return (
    <PageScroll>
      <PageHeader
        title="Shifts & time clock"
        subtitle="Schedule shifts, clock in/out, track hours."
        rightAction={myActive ? "Clock out" : "Clock in"}
        actionIcon={myActive ? "stop.fill" : "play.fill"}
        onAction={() => myActive ? clockOut(myActive) : clockIn()}
      />

      <StatRow>
        <StatTile icon="bolt.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="On the clock" value={String(activeCount)} hint="Currently active" />
        <StatTile icon="calendar" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Scheduled today" value={String(scheduledCount)} hint="Upcoming shifts" />
        <StatTile icon="checkmark.circle.fill" iconColor="#3358D4" iconBg="#E6EDFA" label="Completed today" value={String(completedToday)} hint="Finished shifts" />
        <StatTile icon="clock.fill" iconColor="#D97706" iconBg="#FFF7E0" label="Hours logged" value={`${totalHoursToday.toFixed(1)}h`} hint="Across all staff today" />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={{ height: 30, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: OWNER_HAIRLINE, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Icon name="plus" size={11} color={OWNER_INK} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: OWNER_INK }}>Schedule shift</Text>
        </Pressable>
      </View>

      <CardShell>
        <CardHeader title="Recent shifts" subtitle={`${(shifts ?? []).length} entries`} />
        {(shifts ?? []).length === 0 ? (
          <EmptyState
            icon="clock.fill"
            title="No shifts yet"
            body="Schedule a shift or clock in to start tracking staff hours. Each shift records role, clock-in, clock-out, and total hours."
            actionLabel="Schedule first shift"
            onAction={() => setShowAdd(true)}
          />
        ) : null}
        {(shifts ?? []).map((s, i) => (
          <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: OWNER_HAIRLINE }}>
            <StatusDot color={STATUS_DOT[s.status] ?? OWNER_MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: OWNER_INK }}>{s.user?.name ?? s.user?.email ?? "—"}</Text>
              <MonoText size={11} color={OWNER_MUTED}>
                {s.clock_in ? `In ${timeAgo(s.clock_in)}` : s.scheduled_start ? `Scheduled ${new Date(s.scheduled_start).toLocaleString()}` : "—"}
                {s.clock_out ? ` · Out ${timeAgo(s.clock_out)}` : ""}
              </MonoText>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: OWNER_INK2, textTransform: "capitalize" }}>{s.status.replace("_", " ")}</Text>
          </View>
        ))}
      </CardShell>

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <Sheet.Body>
          <Text style={{ fontSize: 18, fontWeight: "700", color: OWNER_INK, letterSpacing: -0.4 }}>Schedule shift</Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            <Input label="Start (YYYY-MM-DD HH:mm)" value={start} onChangeText={setStart} placeholder="2026-05-04 18:00" />
            <Input label="End (optional)" value={end} onChangeText={setEnd} placeholder="2026-05-04 23:00" />
            <Input label="Role" value={role} onChangeText={setRole} />
            <Button label="Save" onPress={addShift} loading={insert.isPending} />
          </View>
        </Sheet.Body>
      </Sheet>
    </PageScroll>
  );
}
