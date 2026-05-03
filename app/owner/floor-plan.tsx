// Module 7 — Floor plan with QR codes
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useTables } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, StatRow, StatTile,
  OWNER_INK, OWNER_INK2, OWNER_MUTED, OWNER_ACCENT, OWNER_HAIRLINE,
} from "@/components/owner/shell";

const STATUS_DOT: Record<string, string> = {
  available: "#0F8A4F", occupied: "#D43A2F", reserved: "#D97706", cleaning: "#A1A09A",
};

export default function FloorPlan() {
  const { data: restaurant } = useOwnedRestaurant();
  const { data: tables } = useTables(restaurant?.id);
  const qc = useQueryClient();
  const toast = useToast();

  const cycle = async (id: string, cur: string) => {
    const next = cur === "available" ? "occupied" : cur === "occupied" ? "cleaning" : "available";
    await supabase.from("tables").update({ status: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tables", restaurant?.id] });
    toast.success("Updated");
  };

  const generateQR = async (id: string) => {
    const token = `t-${Math.random().toString(36).slice(2, 10)}`;
    await supabase.from("tables").update({ qr_token: token }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["tables", restaurant?.id] });
    toast.success("QR token regenerated");
  };

  return (
    <PageScroll>
      <PageHeader title="Floor plan" subtitle="Tables, QR tokens, real-time status." />

      {(() => {
        const t = tables ?? [];
        const occ = t.filter((x) => x.status === "occupied").length;
        const avail = t.filter((x) => x.status === "available").length;
        const cleaning = t.filter((x) => String(x.status) === "cleaning").length;
        const totalSeats = t.reduce((s, x) => s + Number(x.seats ?? 0), 0);
        return (
          <StatRow>
            <StatTile icon="tablecells" label="Total tables" value={String(t.length)} hint={`${totalSeats} seats overall`} />
            <StatTile icon="checkmark.circle.fill" iconColor="#0F8A4F" iconBg="#E6F4ED" label="Available" value={String(avail)} hint="Ready to seat" />
            <StatTile icon="person.2.fill" iconColor="#D43A2F" iconBg="#FCEAE6" label="Occupied" value={String(occ)} hint="Diners seated" />
            <StatTile icon="sparkles" iconColor={OWNER_ACCENT} iconBg="#EEEAF6" label="Cleaning" value={String(cleaning)} hint="Resetting between covers" />
          </StatRow>
        );
      })()}

      <CardShell>
        <CardHeader title="All tables" subtitle={`${(tables ?? []).length} configured`} />
        {(tables ?? []).length === 0 ? (
          <EmptyState
            icon="tablecells"
            title="Set up your floor plan"
            body="Add tables in the Tables module first, then come back here to assign QR tokens, cycle status, and visualise occupancy."
          />
        ) : null}
        <View style={{ padding: 18, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {(tables ?? []).map((t) => (
            <Pressable
              key={t.id}
              onPress={() => cycle(t.id, t.status)}
              style={{
                width: 140, padding: 14, borderRadius: 10,
                backgroundColor: "#fff", borderWidth: 1, borderColor: OWNER_HAIRLINE,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: OWNER_INK }}>Table {t.number}</Text>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_DOT[t.status] ?? OWNER_MUTED }} />
              </View>
              <MonoText size={11} color={OWNER_MUTED}>
                Seats {t.seats} · {t.zone}
              </MonoText>
              <Text style={{ marginTop: 8, fontSize: 11, color: OWNER_INK2, textTransform: "capitalize" }}>
                {t.status}
              </Text>
              <Pressable
                onPress={(e) => { e.stopPropagation(); generateQR(t.id); }}
                style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon name="qrcode" size={11} color={OWNER_ACCENT} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: OWNER_ACCENT }}>
                  {(t as { qr_token?: string }).qr_token ? "Regenerate QR" : "Generate QR"}
                </Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      </CardShell>

      <Text style={{ fontSize: 11, color: OWNER_MUTED, paddingHorizontal: 4 }}>
        Tip: Tap a table to cycle status (available → occupied → cleaning → available). Generate QR creates a unique scan token customers use to start a dine-in session.
      </Text>
    </PageScroll>
  );
}
