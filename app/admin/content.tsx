import { Image, Pressable, Switch, Text, View } from "react-native";
import { Header, Icon, Screen } from "@/components/ui";
import { useBanners, useCollections } from "@/hooks/queries";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminContent() {
  const qc = useQueryClient();
  const { data: banners } = useBanners();
  const { data: collections } = useCollections();

  async function toggleBanner(id: string, current: boolean) {
    await supabase.from("banners").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["banners"] });
  }
  async function toggleCollection(id: string, current: boolean) {
    await supabase.from("collections").update({ is_active: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["collections"] });
  }

  return (
    <Screen>
      <Header title="Content & Configuration" />

      <View className="mx-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Banners</Text>
          <Pressable className="rounded-full bg-dime-primary-500 px-3 py-1">
            <Text className="text-[11px] font-bold text-white">+ New</Text>
          </Pressable>
        </View>
        <View className="mt-2 gap-4">
          {(banners ?? []).map((b) => (
            <View key={b.id} className="overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <Image source={{ uri: b.image_url }} className="h-32 w-full" />
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-1">
                  <Text className="text-[12px] text-dime-ink-3">Position {b.position}</Text>
                  <Text className="text-[13px] text-dime-ink-2" numberOfLines={1}>{b.link_target}</Text>
                </View>
                <Switch value={b.is_active} onValueChange={() => toggleBanner(b.id, b.is_active)} trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>Collections</Text>
          <Pressable className="rounded-full bg-dime-primary-500 px-3 py-1">
            <Text className="text-[11px] font-bold text-white">+ New</Text>
          </Pressable>
        </View>
        <View className="mt-2 gap-4">
          {(collections ?? []).map((c) => (
            <View key={c.id} className="flex-row gap-4 rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
              <Image source={{ uri: c.cover_image_url ?? "" }} className="h-16 w-16 rounded-lg" />
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-dime-ink">{c.name}</Text>
                <Text numberOfLines={1} className="text-[12px] text-dime-ink-3">{c.description}</Text>
                <Text className="mt-1 text-[11px] text-dime-ink-3">{c.restaurant_ids.length} restaurants</Text>
              </View>
              <Switch value={c.is_active} onValueChange={() => toggleCollection(c.id, c.is_active)} trackColor={{ true: "#FF6B2C", false: "#D1D1D6" }} />
            </View>
          ))}
        </View>
      </View>

      <View className="mx-5 mt-6 rounded-2xl bg-white p-5" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}>
        <View className="flex-row items-center gap-2">
          <View className="rounded-xl bg-dime-primary-50 p-1.5">
            <Icon name="gear" size={16} color="#FF6B2C" />
          </View>
          <Text className="text-[14px] font-bold text-dime-ink">Loyalty configuration</Text>
        </View>
        <Text className="mt-1 text-[12px] text-dime-ink-3">
          Earn 1 point per ₹10 spent. 100 points = ₹50. Tiers: silver / gold / platinum / diamond.
        </Text>
      </View>
    </Screen>
  );
}
