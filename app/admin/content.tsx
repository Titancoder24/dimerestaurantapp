import { Image, Switch, Text, View } from "react-native";
import { Icon } from "@/components/ui";
import { useBanners, useCollections } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/store/toast";
import {
  PageScroll, PageHeader, CardShell, CardHeader, MonoText, EmptyState, Pill,
  ADMIN_INK, ADMIN_INK2, ADMIN_INK3, ADMIN_HAIRLINE, ADMIN_HAIRLINE2,
  ADMIN_PANEL2, ADMIN_ACCENT,
} from "@/components/admin/shell";

export default function AdminContent() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: banners } = useBanners();
  const { data: collections } = useCollections();

  async function toggleBanner(id: string, current: boolean) {
    try {
      await supabase.from("banners").update({ is_active: !current }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success(!current ? "Banner enabled" : "Banner hidden");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }
  async function toggleCollection(id: string, current: boolean) {
    try {
      await supabase.from("collections").update({ is_active: !current }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["collections"] });
      toast.success(!current ? "Collection live" : "Collection hidden");
    } catch (e) {
      toast.error("Could not update", (e as Error).message);
    }
  }

  return (
    <PageScroll>
      <PageHeader
        eyebrow="DIME ADMIN · MARKETING · EDITORIAL"
        title="Editorial content"
        subtitle="Hero banners and curated collections that surface on the customer home."
      />

      <CardShell>
        <CardHeader
          title="Hero banners"
          subtitle={`${(banners ?? []).length} configured`}
          right={<Pill tone="saffron" icon="photo.fill">Carousel</Pill>}
        />
        {(banners ?? []).length === 0 ? (
          <EmptyState icon="photo.fill" title="No banners yet" body="Add a banner to take over the diner home carousel." compact />
        ) : null}
        {(banners ?? []).map((b, i) => (
          <View
            key={b.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            <Image source={{ uri: b.image_url }} style={{ width: 88, height: 56, borderRadius: 8, backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2 }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <MonoText size={11} color={ADMIN_INK3}>POSITION {String(b.position).padStart(2, "0")}</MonoText>
              <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 13, fontWeight: "700", color: ADMIN_INK }}>
                {b.link_target || "No deep link"}
              </Text>
              <View style={{ marginTop: 4, flexDirection: "row", gap: 6 }}>
                <Pill tone={b.is_active ? "green" : "neutral"}>{b.is_active ? "Active" : "Hidden"}</Pill>
              </View>
            </View>
            <Switch value={b.is_active} onValueChange={() => toggleBanner(b.id, b.is_active)} trackColor={{ true: ADMIN_ACCENT, false: "#262626" }} thumbColor="#FFFFFF" />
          </View>
        ))}
      </CardShell>

      <CardShell>
        <CardHeader
          title="Curated collections"
          subtitle={`${(collections ?? []).length} collections · ${(collections ?? []).reduce((s, c) => s + c.restaurant_ids.length, 0)} placements`}
        />
        {(collections ?? []).length === 0 ? (
          <EmptyState icon="rectangle.stack.fill" title="No collections yet" body='Group restaurants under a story like "Best for date night" to feature them.' compact />
        ) : null}
        {(collections ?? []).map((c, i) => (
          <View
            key={c.id}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              paddingHorizontal: 18, paddingVertical: 14,
              borderTopWidth: i ? 1 : 0, borderTopColor: ADMIN_HAIRLINE,
            }}
          >
            {c.cover_image_url ? (
              <Image source={{ uri: c.cover_image_url }} style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: ADMIN_PANEL2 }} />
            ) : (
              <View style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: ADMIN_PANEL2, borderWidth: 1, borderColor: ADMIN_HAIRLINE2, alignItems: "center", justifyContent: "center" }}>
                <Icon name="rectangle.stack.fill" size={20} color={ADMIN_INK3} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: ADMIN_INK }}>{c.name}</Text>
              {c.description ? (
                <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 12, color: ADMIN_INK2 }}>{c.description}</Text>
              ) : null}
              <View style={{ marginTop: 5, flexDirection: "row", gap: 6 }}>
                <Pill tone="lilac">{c.restaurant_ids.length} placements</Pill>
                <Pill tone={c.is_active ? "green" : "neutral"}>{c.is_active ? "Live" : "Hidden"}</Pill>
              </View>
            </View>
            <Switch value={c.is_active} onValueChange={() => toggleCollection(c.id, c.is_active)} trackColor={{ true: ADMIN_ACCENT, false: "#262626" }} thumbColor="#FFFFFF" />
          </View>
        ))}
      </CardShell>

      <CardShell padded>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#2B1810", borderWidth: 1, borderColor: "#5C2E18", alignItems: "center", justifyContent: "center" }}>
            <Icon name="gear" size={14} color={ADMIN_ACCENT} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: ADMIN_INK, letterSpacing: -0.2 }}>Loyalty configuration</Text>
        </View>
        <Text style={{ marginTop: 10, fontSize: 12.5, color: ADMIN_INK2, lineHeight: 19 }}>
          Diners earn 1 point per ₹10 spent. 100 points redeem as ₹50 off the next bill. Tiers cascade across silver / gold / platinum / diamond as lifetime spend grows.
        </Text>
      </CardShell>
    </PageScroll>
  );
}
