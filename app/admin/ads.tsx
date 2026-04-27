import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Chip, ChipRow, Header, Icon, Screen, Sheet, haptic } from "@/components/ui";
import { PosterCard } from "@/components/poster/PosterCard";
import { supabase, type Tables } from "@/lib/supabase";
import { useToast } from "@/store/toast";
import { rupees, timeAgo } from "@/lib/format";
import type { PosterStyle } from "@/poster-designer/types";

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

  return (
    <Screen scroll={false}>
      <Header title="Ads pipeline" subtitle={`${allAds.length} shown`} />

      <View className="flex-row gap-2 px-5">
        <Tile color="bg-amber-500" label="Pending" value={String(counts.pending)} />
        <Tile color="bg-emerald-500" label="Live" value={String(counts.active)} />
        <Tile color="bg-dime-danger" label="Rejected" value={String(counts.rejected)} />
        <Tile color="bg-dime-primary-500" label="Ad revenue" value={rupees(counts.revenue)} />
      </View>

      <View className="mt-4 px-5">
        <ChipRow>
          <Chip label="Needs review" selected={filter === "pending_review"} onPress={() => setFilter("pending_review")} />
          <Chip label="Live" selected={filter === "active"} onPress={() => setFilter("active")} />
          <Chip label="Rejected" selected={filter === "rejected"} onPress={() => setFilter("rejected")} />
          <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
        </ChipRow>
      </View>

      <FlatList
        data={allAds}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Icon name="checkmark.circle.fill" size={28} color="#22C55E" />
            <Text className="mt-2 text-[14px] font-bold text-dime-ink">Nothing to review</Text>
            <Text className="text-[12px] text-dime-ink-3">All caught up.</Text>
          </View>
        }
        renderItem={({ item: ad }) => (
          <Pressable onPress={() => setReviewing(ad)} className="rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
            <PosterCard
              templateId={ad.template_id}
              data={{ title: ad.title, subtitle: ad.subtitle, body: ad.body, ctaText: ad.cta_text, imageUrl: ad.image_url }}
              style={(ad.design_json as { style: PosterStyle })?.style ?? defaultStyle}
            />
            <View className="mt-4 flex-row items-center gap-2">
              <Text className="flex-1 text-[14px] font-bold text-dime-ink" numberOfLines={1}>{ad.title}</Text>
              <StatusBadge status={ad.status} />
            </View>
            <Text className="text-[11px] text-dime-ink-3">
              {ad.restaurants?.name ?? "Platform"} · {ad.restaurants?.city ?? ""} · {timeAgo(ad.created_at)}
            </Text>
            <View className="mt-1 flex-row flex-wrap gap-1.5">
              <Badge tone="orange" label={ad.placement.replace("_", " ")} />
              <Badge tone="green" label={`${rupees(ad.daily_budget)}/day · ${ad.duration_days}d`} />
              <Badge tone="blue" label={`Total ${rupees(Number(ad.total_cost))}`} />
              {ad.status === "active" || ad.status === "completed" ? (
                <Badge tone="gray" label={`${ad.impressions.toLocaleString()} impr · ${ad.clicks.toLocaleString()} clk`} />
              ) : null}
            </View>
          </Pressable>
        )}
      />

      <ReviewSheet
        ad={reviewing}
        onClose={() => setReviewing(null)}
        onActioned={() => { setReviewing(null); qc.invalidateQueries({ queryKey: ["admin-ads"] }); }}
      />
    </Screen>
  );
}

const defaultStyle: PosterStyle = {
  accent: "#FF6B2C", ink: "#1C1C1E", paper: "#FFFFFF",
  fontHeading: "Inter", fontWeight: "700", showImage: true,
};

function StatusBadge({ status }: { status: Tables<"ads">["status"] }) {
  const tone = ({
    draft: "gray", pending_review: "orange", approved: "blue",
    active: "green", paused: "gray", completed: "gray", rejected: "red",
  } as const)[status];
  return <Badge tone={tone} label={status.replace("_", " ")} />;
}

function Tile({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View className={`flex-1 items-center rounded-2xl ${color} py-3`}>
      <Text className="text-[18px] font-bold text-white" numberOfLines={1}>{value}</Text>
      <Text className="text-[10px] font-bold uppercase text-white/90" style={{ letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
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
