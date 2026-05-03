import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Sheet, haptic } from "@/components/ui";
import { PosterCard } from "@/components/poster/PosterCard";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { rupees, timeAgo } from "@/lib/format";
import type { PosterStyle } from "@/poster-designer/types";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  StatRow, StatTile,
  ADMIN_BG, ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_PANEL, ADMIN_PANEL2, ADMIN_HOVER, ADMIN_ACCENT, ADMIN_GREEN, ADMIN_RED, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type Ad = Tables<"ads"> & { restaurants: { name: string | null; city: string | null } | null };
type Filter = "pending_review" | "active" | "rejected" | "all";

export default function AdminAds() {
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("pending_review");
  const [reviewing, setReviewing] = useState<Ad | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["admin-ads", filter],
    queryFn: async () => {
      let q = supabase
        .from("ads")
        .select("*, restaurants(name, city)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Ad[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-ads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ads" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const allAds = data ?? [];
  const counts = {
    pending: allAds.filter((a) => a.status === "pending_review").length,
    active: allAds.filter((a) => a.status === "active").length,
    rejected: allAds.filter((a) => a.status === "rejected").length,
    revenue: allAds.filter((a) => a.status === "active" || a.status === "completed").reduce((s, a) => s + Number(a.total_cost), 0),
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "pending_review", label: "Needs review" },
    { id: "active", label: "Live" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
  ];

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · MARKETING · ACQUISITION"
        title="Ads pipeline"
        subtitle="Review submitted poster ads, approve, reject or pause — live impression & click data attached."
      />

      <StatRow>
        <StatTile icon="clock.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="Pending review" value={String(counts.pending)} hint="Operator submissions" />
        <StatTile icon="bolt.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Live" value={String(counts.active)} hint="Running in feed" />
        <StatTile icon="xmark.octagon.fill" iconBg="#3A1212" iconColor={ADMIN_RED} label="Rejected" value={String(counts.rejected)} hint="Policy or quality" />
        <StatTile icon="indianrupeesign.circle.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Ad revenue" value={rupees(counts.revenue)} hint="From active + completed" />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => { haptic.light(); setFilter(f.id); }}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7,
                backgroundColor: active ? ADMIN_INK : ADMIN_PANEL,
                borderWidth: 1, borderColor: active ? ADMIN_INK : ADMIN_HAIRLINE,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? ADMIN_BG : ADMIN_INK2 }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <CardShell>
        <CardHeader title="Ad queue" subtitle={`${allAds.length} match · auto-refreshes via realtime`} />
        {allAds.length === 0 ? (
          <EmptyState
            icon="checkmark.circle.fill"
            iconColor={ADMIN_GREEN}
            iconBg="#0E2F1F"
            title="Nothing to review"
            body="All caught up — when operators submit new poster ads, they'll show up here."
            compact
          />
        ) : null}
        {allAds.map((ad, i) => (
          <Pressable
            key={ad.id}
            onPress={() => setReviewing(ad)}
            style={({ hovered }: any) => ({
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered ? ADMIN_HOVER : "transparent",
            })}
          >
            <View style={{ borderRadius: 12, overflow: "hidden", backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE }}>
              <PosterCard
                templateId={ad.template_id}
                data={{ title: ad.title, subtitle: ad.subtitle, body: ad.body, ctaText: ad.cta_text, imageUrl: ad.image_url }}
                style={(ad.design_json as { style: PosterStyle })?.style ?? defaultStyle}
              />
            </View>
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "700", color: ADMIN_INK }}>{ad.title}</Text>
              <StatusPill status={ad.status} />
            </View>
            <MonoText size={11} color={ADMIN_INK3}>
              {(ad.restaurants?.name ?? "PLATFORM").toUpperCase()} · {(ad.restaurants?.city ?? "").toUpperCase()} · {timeAgo(ad.created_at).toUpperCase()}
            </MonoText>
            <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              <Pill tone="saffron">{ad.placement.replace("_", " ")}</Pill>
              <Pill tone="green">{rupees(ad.daily_budget)}/day · {ad.duration_days}d</Pill>
              <Pill tone="lilac">Total {rupees(Number(ad.total_cost))}</Pill>
              {ad.status === "active" || ad.status === "completed" ? (
                <Pill>{ad.impressions.toLocaleString()} impr · {ad.clicks.toLocaleString()} clk</Pill>
              ) : null}
            </View>
          </Pressable>
        ))}
      </CardShell>

      <ReviewSheet
        ad={reviewing}
        onClose={() => setReviewing(null)}
        onActioned={() => { setReviewing(null); qc.invalidateQueries({ queryKey: ["admin-ads"] }); }}
      />
    </PageScroll>
  );
}

const defaultStyle: PosterStyle = {
  accent: "#FF6B2C", ink: "#1C1C1E", paper: "#FFFFFF",
  fontHeading: "Inter", fontWeight: "700", showImage: true,
};

function StatusPill({ status }: { status: Tables<"ads">["status"] }) {
  const tone = ({
    draft: "neutral", pending_review: "amber", approved: "lilac",
    active: "green", paused: "neutral", completed: "neutral", rejected: "red",
  } as const)[status];
  return <Pill tone={tone}>{status.replace("_", " ")}</Pill>;
}

function ReviewSheet({ ad, onClose, onActioned }: { ad: Ad | null; onClose: () => void; onActioned: () => void }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | "pause" | null>(null);

  useEffect(() => { if (ad) setReason(ad.admin_notes ?? ""); }, [ad?.id]);

  if (!ad) return null;

  async function approve() {
    setBusy("approve");
    try {
      await supabase.from("ads").update({ status: "active", admin_notes: null }).eq("id", ad!.id);
      haptic.success();
      toast.success("Approved", "Ad is now live in the customer feed.");
      onActioned();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  async function reject() {
    if (reason.length < 5) return toast.error("Add a brief reason for the owner.");
    setBusy("reject");
    try {
      await supabase.from("ads").update({ status: "rejected", admin_notes: reason }).eq("id", ad!.id);
      haptic.medium();
      toast.success("Rejected");
      onActioned();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  async function pauseToggle() {
    setBusy("pause");
    const next = ad!.status === "active" ? "paused" : "active";
    await supabase.from("ads").update({ status: next }).eq("id", ad!.id);
    onActioned();
    setBusy(null);
  }

  return (
    <Sheet visible={!!ad} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <PosterCard
          templateId={ad.template_id}
          data={{ title: ad.title, subtitle: ad.subtitle, body: ad.body, ctaText: ad.cta_text, imageUrl: ad.image_url }}
          style={(ad.design_json as { style: PosterStyle })?.style ?? defaultStyle}
        />

        <View className="mt-4">
          <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{ad.title}</Text>
          <Text className="text-[12px] text-dime-ink-3">
            {ad.restaurants?.name} · {ad.restaurants?.city} · submitted {timeAgo(ad.created_at)}
          </Text>
        </View>

        <View className="mt-4 rounded-2xl bg-dime-bg-2 p-4">
          <View className="flex-row items-center justify-between"><Text className="text-[12px] text-dime-ink-2">Placement</Text><Text className="text-[13px] font-bold text-dime-ink">{ad.placement.replace("_", " ")}</Text></View>
          <View className="mt-2 flex-row items-center justify-between"><Text className="text-[12px] text-dime-ink-2">Daily budget</Text><Text className="text-[13px] font-bold text-dime-ink">{rupees(ad.daily_budget)}</Text></View>
          <View className="mt-2 flex-row items-center justify-between"><Text className="text-[12px] text-dime-ink-2">Duration</Text><Text className="text-[13px] font-bold text-dime-ink">{ad.duration_days} days</Text></View>
          <View className="mt-2 border-t border-neutral-50 pt-2 flex-row items-center justify-between">
            <Text className="text-[14px] font-bold text-dime-ink">Total revenue</Text>
            <Text className="text-[18px] font-bold text-dime-primary-600" style={{ letterSpacing: -0.5 }}>{rupees(Number(ad.total_cost))}</Text>
          </View>
        </View>

        {(ad.status === "active" || ad.status === "completed") ? (
          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-emerald-50 p-4">
              <Text className="text-[10px] font-bold uppercase text-emerald-700" style={{ letterSpacing: 1.5 }}>Impressions</Text>
              <Text className="text-[20px] font-bold text-emerald-900" style={{ letterSpacing: -0.5 }}>{ad.impressions.toLocaleString()}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-blue-50 p-4">
              <Text className="text-[10px] font-bold uppercase text-blue-700" style={{ letterSpacing: 1.5 }}>Clicks</Text>
              <Text className="text-[20px] font-bold text-blue-900" style={{ letterSpacing: -0.5 }}>{ad.clicks.toLocaleString()}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-amber-50 p-4">
              <Text className="text-[10px] font-bold uppercase text-amber-700" style={{ letterSpacing: 1.5 }}>CTR</Text>
              <Text className="text-[20px] font-bold text-amber-900" style={{ letterSpacing: -0.5 }}>
                {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0"}%
              </Text>
            </View>
          </View>
        ) : null}

        {ad.status === "pending_review" ? (
          <>
            <View className="mt-4">
              <Text className="mb-2 text-[12px] font-bold text-dime-ink-2">Rejection reason (only used if you reject)</Text>
              <TextInput
                value={reason} onChangeText={setReason} multiline placeholder="e.g. Image violates content policy"
                placeholderTextColor="#8A8A8A"
                className="min-h-[80px] rounded-xl border border-neutral-50 bg-white p-3 text-[14px] text-dime-ink"
                textAlignVertical="top"
              />
            </View>
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1"><Button label="Reject" variant="destructive" loading={busy === "reject"} onPress={reject} fullWidth /></View>
              <View className="flex-[2]"><Button label="Approve & go live" loading={busy === "approve"} onPress={approve} fullWidth /></View>
            </View>
          </>
        ) : null}

        {ad.status === "active" ? (
          <View className="mt-4">
            <Button label="Pause ad" variant="secondary" loading={busy === "pause"} onPress={pauseToggle} fullWidth />
          </View>
        ) : null}
        {ad.status === "paused" ? (
          <View className="mt-4">
            <Button label="Resume ad" loading={busy === "pause"} onPress={pauseToggle} fullWidth />
          </View>
        ) : null}
      </Sheet.Body>
    </Sheet>
  );
}
