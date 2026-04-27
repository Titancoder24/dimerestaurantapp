import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Chip, ChipRow, Header, Icon, Input, Screen, haptic } from "@/components/ui";
import { POSTER_TEMPLATES, posterTemplateById } from "@/poster-designer/templates";
import { PosterCard } from "@/components/poster/PosterCard";
import type { PosterStyle } from "@/poster-designer/types";
import { useOwnedRestaurant } from "@/hooks/owner";
import { useAuth } from "@/store/auth";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";
import { pickAndUpload } from "@/lib/upload";
import { rupees } from "@/lib/format";

const dailyBudgets = [100, 200, 300, 500, 1000];
const durations = [7, 14, 30];
const placements: { k: "home_banner" | "home_featured" | "discover_inline"; l: string; d: string }[] = [
  { k: "home_banner", l: "Home banner", d: "Top of customer home feed" },
  { k: "home_featured", l: "Featured slot", d: "Inside Featured Restaurants section" },
  { k: "discover_inline", l: "Discover inline", d: "Between results in Discover" },
];

export default function NewAd() {
  const router = useRouter();
  const profile = useAuth((s) => s.profile);
  const { data: restaurant } = useOwnedRestaurant();
  const toast = useToast();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [templateId, setTemplateId] = useState(POSTER_TEMPLATES[0]!.id);
  const [style, setStyle] = useState<PosterStyle>(POSTER_TEMPLATES[0]!.defaultStyle);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("Order now");
  const [ctaLink, setCtaLink] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [placement, setPlacement] = useState<typeof placements[number]["k"]>("home_banner");
  const [dailyBudget, setDailyBudget] = useState(100);
  const [duration, setDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const template = posterTemplateById(templateId)!;

  // Pre-fill from restaurant if available
  useEffect(() => {
    if (!restaurant) return;
    if (!title) setTitle(restaurant.name);
    if (!subtitle) setSubtitle(restaurant.cuisines.slice(0, 2).join(" · "));
    if (!imageUrl) setImageUrl(restaurant.cover_image_url);
    if (!ctaLink) setCtaLink(`/restaurant/${restaurant.id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // When template changes, adopt its default style.
  useEffect(() => {
    setStyle(template.defaultStyle);
  }, [templateId]);

  async function uploadImage() {
    if (!restaurant) return;
    setUploading(true);
    try {
      const url = await pickAndUpload({ bucket: "restaurant-media", prefix: `${restaurant.id}/ads`, aspect: [16, 9] });
      if (url) setImageUrl(url);
    } catch (e) { toast.error("Upload failed", (e as Error).message); }
    finally { setUploading(false); }
  }

  function patchStyle(s: Partial<PosterStyle>) { setStyle((p) => ({ ...p, ...s })); }

  async function submit() {
    if (!restaurant || !profile) return;
    if (title.length < 3) return toast.error("Add a headline");
    setSubmitting(true);
    try {
      const { error } = await supabase.from("ads").insert({
        restaurant_id: restaurant.id,
        created_by: profile.id,
        template_id: templateId,
        title,
        subtitle: subtitle || null,
        body: body || null,
        cta_text: ctaText || null,
        cta_link: ctaLink || `/restaurant/${restaurant.id}`,
        image_url: imageUrl,
        design_json: { style },
        placement,
        daily_budget: dailyBudget,
        duration_days: duration,
        status: "pending_review",
      });
      if (error) throw error;
      haptic.success();
      toast.success("Submitted for review", "We'll let you know within 24 hours.");
      router.replace("/owner/ads");
    } catch (e) {
      haptic.error();
      toast.error("Could not submit", (e as Error).message);
    } finally { setSubmitting(false); }
  }

  const totalCost = dailyBudget * duration;

  return (
    <Screen scroll={false}>
      <Header title="New ad" subtitle={`Step ${step + 1} of 3`} back />

      <View className="px-5">
        <View className="h-1.5 overflow-hidden rounded-full bg-dime-bg-2">
          <View className="h-full rounded-full bg-dime-primary-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} keyboardShouldPersistTaps="handled">
        {/* Live preview always shown at top */}
        <PosterCard
          templateId={templateId}
          data={{ title: title || "Your headline", subtitle, body, ctaText, imageUrl }}
          style={style}
        />

        {step === 0 ? (
          <View>
            <SectionTitle icon="photo.fill" title="Pick a template" />
            <View className="flex-row flex-wrap gap-2">
              {POSTER_TEMPLATES.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => { haptic.select(); setTemplateId(t.id); }}
                  className={`w-[31%] rounded-xl border-2 p-1 ${templateId === t.id ? "border-dime-primary-500" : "border-transparent"}`}
                >
                  <View pointerEvents="none">
                    <PosterCard
                      templateId={t.id}
                      data={{ title: t.name, subtitle: "Preview", ctaText: "Go", imageUrl }}
                      style={t.defaultStyle}
                      width={96}
                    />
                  </View>
                  <Text className="mt-1 text-center text-[10px] font-bold text-dime-ink">{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View className="gap-4">
            <SectionTitle icon="pencil" title="Content" />
            <Pressable
              onPress={uploadImage}
              disabled={uploading}
              className="aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-dime-primary-300 bg-dime-primary-50"
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} className="h-full w-full" />
              ) : (
                <View className="items-center">
                  <Icon name="photo.fill" size={26} color="#FF6B2C" />
                  <Text className="mt-1 text-[12px] font-bold text-dime-primary-700">Tap to upload (16:9)</Text>
                </View>
              )}
            </Pressable>
            <Input label="Headline" value={title} onChangeText={setTitle} placeholder="Buy 1 Get 1 Free Pizzas" />
            <Input label="Tagline" value={subtitle} onChangeText={setSubtitle} placeholder="This weekend only" />
            <Input label="Body (optional)" value={body} onChangeText={setBody} multiline numberOfLines={2} />
            <View className="flex-row gap-4">
              <View className="flex-1"><Input label="Button text" value={ctaText} onChangeText={setCtaText} placeholder="Order now" /></View>
              <View className="flex-[1.5]"><Input label="Deep link" value={ctaLink} onChangeText={setCtaLink} placeholder="/restaurant/..." /></View>
            </View>

            <SectionTitle icon="sparkles" title="Accent color" />
            <View className="flex-row gap-2">
              {template.swatches.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { haptic.select(); patchStyle({ accent: c }); }}
                  className="h-9 w-9 items-center justify-center rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: style.accent === c ? "#1C1C1E" : "transparent" }}
                >
                  {style.accent === c ? <Icon name="checkmark" size={12} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>

            <ChipRow>
              <Chip label={style.showImage ? "Photo on" : "Photo off"} selected={style.showImage} onPress={() => patchStyle({ showImage: !style.showImage })} />
              <Chip label="Light" selected={style.paper === "#FFFFFF"} onPress={() => patchStyle({ paper: "#FFFFFF", ink: "#1C1C1E" })} />
              <Chip label="Dark" selected={style.paper === "#0F0F12"} onPress={() => patchStyle({ paper: "#0F0F12", ink: "#FFFFFF" })} />
            </ChipRow>
          </View>
        ) : null}

        {step === 2 ? (
          <View className="gap-4">
            <SectionTitle icon="chart.bar.fill" title="Placement & budget" />

            <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Where should it show?</Text>
            <View className="gap-2">
              {placements.map((p) => (
                <Pressable
                  key={p.k}
                  onPress={() => { haptic.select(); setPlacement(p.k); }}
                  className={`flex-row items-center gap-4 rounded-xl p-4 ${placement === p.k ? "border-2 border-dime-primary-500 bg-dime-primary-50" : "bg-white"}`}
                  style={placement !== p.k ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 } : undefined}
                >
                  <View className={`h-4 w-4 rounded-full border-2 ${placement === p.k ? "border-dime-primary-500 bg-dime-primary-500" : "border-dime-ink-3"}`} />
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-dime-ink">{p.l}</Text>
                    <Text className="text-[12px] text-dime-ink-3">{p.d}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text className="mt-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Daily budget</Text>
            <ChipRow>
              {dailyBudgets.map((b) => (
                <Chip key={b} label={`${rupees(b)}/day`} selected={dailyBudget === b} onPress={() => setDailyBudget(b)} />
              ))}
            </ChipRow>

            <Text className="mt-2 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Duration</Text>
            <ChipRow>
              {durations.map((d) => (
                <Chip key={d} label={`${d} days`} selected={duration === d} onPress={() => setDuration(d)} />
              ))}
            </ChipRow>

            <View className="rounded-2xl bg-dime-primary-50 p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-bold text-dime-primary-700">Total cost</Text>
                <Text className="text-[24px] font-bold text-dime-primary-700" style={{ letterSpacing: -1 }}>{rupees(totalCost)}</Text>
              </View>
              <Text className="text-[11px] text-dime-primary-700">
                {rupees(dailyBudget)} × {duration} days · live for ~{Math.round(duration * 24)} hrs after approval
              </Text>
              <Text className="mt-2 text-[11px] text-dime-primary-700 opacity-80">
                Payment captured after super admin approves your ad. Reviews typically complete within 24 hours.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row items-center gap-4 border-t border-neutral-50 bg-white px-5 py-3">
        {step > 0 ? <Button label="Back" variant="secondary" onPress={() => setStep((s) => (s - 1) as 0 | 1)} /> : <View />}
        <View className="flex-1">
          {step < 2 ? (
            <Button label="Continue" onPress={() => setStep((s) => (s + 1) as 1 | 2)} fullWidth />
          ) : (
            <Button label={`Submit · ${rupees(totalCost)}`} loading={submitting} onPress={submit} fullWidth />
          )}
        </View>
      </View>
    </Screen>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      <Icon name={icon} size={14} color="#FF6B2C" />
      <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>{title}</Text>
    </View>
  );
}
