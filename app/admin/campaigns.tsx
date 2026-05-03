import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Chip, ChipRow, Input, Sheet, haptic } from "@/components/ui";
import { supabase, type Tables } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { timeAgo } from "@/lib/format";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  StatRow, StatTile,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE,
  ADMIN_HOVER, ADMIN_ACCENT, ADMIN_GREEN, ADMIN_AMBER, ADMIN_MONO,
} from "@/components/admin/shell";

type Campaign = Tables<"campaigns">;

const tiers = ["silver", "gold", "platinum", "diamond"] as const;

type Segment = {
  all?: boolean;
  tiers?: string[];
  inactive_days?: number;
  new_users?: boolean;
};

export default function Campaigns() {
  const qc = useQueryClient();
  const [composing, setComposing] = useState<Partial<Campaign> | null>(null);

  const { data } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const counts = {
    sent: (data ?? []).filter((c) => c.status === "sent").length,
    draft: (data ?? []).filter((c) => c.status === "draft").length,
    scheduled: (data ?? []).filter((c) => c.status === "scheduled").length,
  };
  const totalDelivered = (data ?? []).reduce((s, c) => s + c.recipients_count, 0);

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · MARKETING · ACQUISITION"
        title="Marketing campaigns"
        subtitle={`${totalDelivered.toLocaleString("en-IN")} notifications delivered to date`}
        rightAction="New campaign"
        actionIcon="plus"
        onAction={() => setComposing({})}
      />

      <StatRow>
        <StatTile icon="paperplane.fill" iconBg="#0E2F1F" iconColor={ADMIN_GREEN} label="Sent" value={String(counts.sent)} hint="Delivered to recipients" />
        <StatTile icon="clock.fill" iconBg="#2A2210" iconColor={ADMIN_AMBER} label="Scheduled" value={String(counts.scheduled)} hint="Queued for later" />
        <StatTile icon="doc.text.fill" iconBg="#1F1F1F" iconColor={ADMIN_INK} label="Drafts" value={String(counts.draft)} hint="In progress" />
        <StatTile icon="bell.fill" iconBg="#2B1810" iconColor={ADMIN_ACCENT} label="Total reach" value={totalDelivered.toLocaleString("en-IN")} hint="Lifetime delivery" />
      </StatRow>

      <CardShell>
        <CardHeader title="Campaign history" subtitle={`${(data ?? []).length} campaigns · click to edit drafts`} />
        {(data ?? []).length === 0 ? (
          <EmptyState
            icon="gift.fill"
            title="No campaigns yet"
            body="Reach diners with targeted in-app messages. Segment by loyalty tier, signup date, or inactivity."
            actionLabel="Compose first campaign"
            onAction={() => setComposing({})}
            compact
          />
        ) : null}
        {(data ?? []).map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => setComposing(c)}
            style={({ hovered }: any) => ({
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
              backgroundColor: hovered ? ADMIN_HOVER : "transparent",
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "700", color: ADMIN_INK }}>{c.title}</Text>
              <Pill tone={c.status === "sent" ? "green" : c.status === "scheduled" ? "amber" : "neutral"}>{c.status}</Pill>
            </View>
            <Text numberOfLines={2} style={{ marginTop: 4, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 18 }}>{c.body}</Text>
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Pill tone="saffron">{segmentLabel(c.segment as Segment)}</Pill>
              {c.recipients_count > 0 ? <Pill tone="green">{c.recipients_count.toLocaleString("en-IN")} delivered</Pill> : null}
              <View style={{ flex: 1 }} />
              <MonoText size={10.5} color={ADMIN_INK3}>{timeAgo(c.created_at).toUpperCase()}</MonoText>
            </View>
          </Pressable>
        ))}
      </CardShell>

      <ComposeSheet
        campaign={composing}
        onClose={() => setComposing(null)}
        onSaved={() => { setComposing(null); qc.invalidateQueries({ queryKey: ["campaigns"] }); }}
      />
    </PageScroll>
  );
}

function segmentLabel(seg: Segment): string {
  if (seg.all) return "All customers";
  if (seg.tiers?.length) return `Tier: ${seg.tiers.join(", ")}`;
  if (seg.new_users) return "New signups (7d)";
  if (seg.inactive_days) return `Inactive ${seg.inactive_days}d+`;
  return "Custom";
}

function ComposeSheet({
  campaign, onClose, onSaved,
}: { campaign: Partial<Campaign> | null; onClose: () => void; onSaved: () => void }) {
  const profile = useAuth((s) => s.profile);
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [segType, setSegType] = useState<"all" | "tiers" | "new" | "inactive">("all");
  const [tierSel, setTierSel] = useState<string[]>(["gold", "platinum", "diamond"]);
  const [inactiveDays, setInactiveDays] = useState("30");
  const [estimating, setEstimating] = useState(false);
  const [estCount, setEstCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const isNew = !campaign?.id;
  const canEdit = isNew || campaign?.status === "draft";

  useEffect(() => {
    if (!campaign) return;
    setTitle(campaign.title ?? "");
    setBody(campaign.body ?? "");
    setCta(campaign.cta_url ?? "");
    const seg = (campaign.segment as Segment) ?? { all: true };
    if (seg.all) setSegType("all");
    else if (seg.tiers?.length) { setSegType("tiers"); setTierSel(seg.tiers); }
    else if (seg.new_users) setSegType("new");
    else if (seg.inactive_days) { setSegType("inactive"); setInactiveDays(String(seg.inactive_days)); }
    setEstCount(null);
  }, [campaign]);

  function buildSegment(): Segment {
    if (segType === "all") return { all: true };
    if (segType === "tiers") return { tiers: tierSel };
    if (segType === "new") return { new_users: true };
    if (segType === "inactive") return { inactive_days: Number(inactiveDays) };
    return { all: true };
  }

  async function estimate() {
    setEstimating(true);
    try {
      const seg = buildSegment();
      // Easiest path: count via our SQL function
      const { data, error } = await supabase.rpc("campaign_recipients", { seg });
      if (error) throw error;
      setEstCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      toast.error("Estimate failed", (e as Error).message);
    } finally { setEstimating(false); }
  }

  async function persistDraft(): Promise<string | null> {
    const payload = {
      title, body, cta_url: cta || null, segment: buildSegment(),
      status: "draft" as const, created_by: profile?.id ?? null,
    };
    if (campaign?.id) {
      await supabase.from("campaigns").update(payload).eq("id", campaign.id);
      return campaign.id;
    } else {
      const { data, error } = await supabase.from("campaigns").insert(payload).select().single();
      if (error) throw error;
      return data.id;
    }
  }

  async function saveDraft() {
    if (title.length < 3 || body.length < 10) return toast.error("Add a title and body");
    setSending(true);
    try {
      await persistDraft();
      haptic.success();
      toast.success("Saved as draft");
      onSaved();
    } catch (e) { toast.error("Save failed", (e as Error).message); }
    finally { setSending(false); }
  }

  async function sendNow() {
    if (title.length < 3 || body.length < 10) return toast.error("Add a title and body");
    setSending(true);
    try {
      const id = await persistDraft();
      if (!id) throw new Error("No campaign id");
      const { data, error } = await supabase.rpc("send_campaign", { p_campaign_id: id });
      if (error) throw error;
      haptic.success();
      toast.success("Campaign sent", `${data ?? 0} notifications delivered`);
      onSaved();
    } catch (e) { toast.error("Send failed", (e as Error).message); }
    finally { setSending(false); }
  }

  if (!campaign) return null;

  return (
    <Sheet visible={!!campaign} onClose={onClose} maxHeight="92%">
      <Sheet.Body>
        <Text className="text-[18px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>{isNew ? "New campaign" : "Campaign"}</Text>
        {!canEdit ? (
          <Badge tone="green" label={campaign.status ?? "sent"} />
        ) : null}

        <View className="mt-4 gap-4">
          <Input label="Title" value={title} onChangeText={setTitle} editable={canEdit} placeholder="Weekend treat 🍕" />
          <View>
            <Text className="mb-1.5 text-[13px] font-bold text-dime-ink-2">Message</Text>
            <TextInput
              value={body} onChangeText={setBody} multiline numberOfLines={4} editable={canEdit}
              placeholder="What do you want to tell them?"
              placeholderTextColor="#8A8A8A"
              className="min-h-[90px] rounded-xl border border-neutral-50 bg-white p-3 text-[14px] text-dime-ink"
              textAlignVertical="top"
            />
          </View>
          <Input label="Deep link (optional)" value={cta} onChangeText={setCta} editable={canEdit} placeholder="/restaurant/abc..." />

          <View>
            <Text className="mb-2 text-[13px] font-bold text-dime-ink-2">Audience</Text>
            <ChipRow>
              <Chip label="All customers" selected={segType === "all"} onPress={() => canEdit && setSegType("all")} />
              <Chip label="By tier" selected={segType === "tiers"} onPress={() => canEdit && setSegType("tiers")} />
              <Chip label="New (7d)" selected={segType === "new"} onPress={() => canEdit && setSegType("new")} />
              <Chip label="Inactive" selected={segType === "inactive"} onPress={() => canEdit && setSegType("inactive")} />
            </ChipRow>
            {segType === "tiers" ? (
              <View className="mt-2">
                <ChipRow>
                  {tiers.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      selected={tierSel.includes(t)}
                      onPress={() => canEdit && setTierSel(tierSel.includes(t) ? tierSel.filter((x) => x !== t) : [...tierSel, t])}
                    />
                  ))}
                </ChipRow>
              </View>
            ) : null}
            {segType === "inactive" ? (
              <View className="mt-2">
                <Input label="No order in last (days)" value={inactiveDays} onChangeText={setInactiveDays} keyboardType="number-pad" editable={canEdit} />
              </View>
            ) : null}
          </View>

          {canEdit ? (
            <View className="flex-row items-center justify-between rounded-xl bg-dime-bg-2 px-4 py-2">
              <Text className="text-[12px] text-dime-ink-2">
                Estimated reach: {estCount === null ? "—" : `${estCount.toLocaleString()} customers`}
              </Text>
              <Pressable onPress={estimate} disabled={estimating} className="rounded-full bg-white px-3 py-1" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
                <Text className="text-[11px] font-bold text-dime-primary-600">{estimating ? "..." : "Estimate"}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {canEdit ? (
          <View className="mt-5 flex-row gap-2">
            <View className="flex-1"><Button label="Save draft" variant="secondary" loading={sending} onPress={saveDraft} fullWidth /></View>
            <View className="flex-[2]"><Button label="Send now" loading={sending} onPress={sendNow} fullWidth /></View>
          </View>
        ) : (
          <View className="mt-5">
            <Button label="Close" variant="secondary" onPress={onClose} fullWidth />
          </View>
        )}
      </Sheet.Body>
    </Sheet>
  );
}
