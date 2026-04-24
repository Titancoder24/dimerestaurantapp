import { useMemo } from "react";
import { FlatList, Image, Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Header, Icon, Screen, Avatar, haptic } from "@/components/ui";
import { useRestaurant, useMenu, useActiveOffers, useReviews } from "@/hooks/queries";
import { fullDate, rupees, timeAgo } from "@/lib/format";

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: r, isLoading } = useRestaurant(id);
  const { data: menu } = useMenu(id);
  const { data: offers } = useActiveOffers(id);
  const { data: reviews } = useReviews(id);

  const bestsellers = useMemo(() => menu?.items.filter((i) => i.is_bestseller).slice(0, 6) ?? [], [menu]);

  if (!r && !isLoading) return null;

  const open = (() => {
    const day = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]!;
    const h = (r?.hours as Record<string, { open: string; close: string } | undefined>)?.[day];
    if (!h) return false;
    const [nh, nm] = [new Date().getHours(), new Date().getMinutes()];
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    const now = nh * 60 + nm;
    return now >= (oh! * 60 + om!) && now <= (ch! * 60 + cm!);
  })();

  return (
    <Screen>
      <View className="relative">
        <Image source={{ uri: r?.cover_image_url ?? "" }} className="h-64 w-full" />
        <View className="absolute inset-x-0 top-0 px-4 pt-12 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Icon name="chevron.left" size={20} color="#1C1C1E" />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <Icon name="heart" size={18} color="#1C1C1E" />
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
              <Icon name="square.and.arrow.up" size={18} color="#1C1C1E" />
            </Pressable>
          </View>
        </View>
      </View>

      <View className="-mt-6 rounded-t-3xl bg-white px-5 pt-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[24px] font-semibold text-dime-ink">{r?.name}</Text>
            <Text className="mt-1 text-[13px] text-dime-ink-3">{r?.cuisines.join(" • ")}</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-lg bg-green-50 px-2 py-1.5">
            <Icon name="star.fill" size={13} color="#22C55E" />
            <Text className="text-[13px] font-semibold text-green-700">{Number(r?.rating ?? 0).toFixed(1)}</Text>
            <Text className="text-[10px] text-green-700">({r?.review_count})</Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <Badge tone={open ? "green" : "red"} label={open ? "Open now" : "Closed"} />
          <Text className="text-[13px] text-dime-ink-3">{"₹".repeat(r?.price_range ?? 2)}</Text>
          <Text className="text-[13px] text-dime-ink-3">•</Text>
          <Text numberOfLines={1} className="flex-1 text-[13px] text-dime-ink-3">{r?.address}</Text>
        </View>

        <Text className="mt-3 text-[14px] leading-[20px] text-dime-ink-2">{r?.description}</Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1">
            <Button
              label="Book Table"
              leading={<Icon name="calendar" size={16} color="#fff" />}
              onPress={() => router.push({ pathname: "/booking/new", params: { restaurantId: r!.id } })}
              fullWidth
            />
          </View>
          <Button
            label="Scan QR"
            variant="secondary"
            leading={<Icon name="qrcode.viewfinder" size={16} color="#E06E10" />}
            onPress={() => router.push("/scan")}
          />
        </View>

        <View className="mt-4 flex-row gap-4">
          <Pressable
            onPress={() => r?.phone && Linking.openURL(`tel:${r.phone}`)}
            className="flex-1 flex-row items-center gap-2 rounded-xl border border-dime-border bg-white px-3 py-2.5"
          >
            <Icon name="phone.fill" size={16} color="#FC8019" />
            <Text className="text-[13px] font-medium text-dime-ink">Call</Text>
          </Pressable>
          <Pressable
            onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)}
            className="flex-1 flex-row items-center gap-2 rounded-xl border border-dime-border bg-white px-3 py-2.5"
          >
            <Icon name="map.fill" size={16} color="#FC8019" />
            <Text className="text-[13px] font-medium text-dime-ink">Directions</Text>
          </Pressable>
        </View>
      </View>

      {/* Amenities */}
      {r && r.amenities.length > 0 ? (
        <View className="mt-5 px-5">
          <Text className="text-[15px] font-semibold text-dime-ink">Amenities</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {r.amenities.map((a) => (
              <View key={a} className="rounded-full border border-dime-border bg-white px-3 py-1.5">
                <Text className="text-[12px] text-dime-ink-2">{a}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Offers */}
      {offers && offers.length > 0 ? (
        <View className="mt-5">
          <Text className="mb-2 px-5 text-[15px] font-semibold text-dime-ink">Offers</Text>
          <FlatList
            horizontal
            data={offers}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            renderItem={({ item }) => (
              <View className="w-64 rounded-2xl border border-dashed border-dime-orange-500 bg-dime-orange-50 p-3">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-dime-orange-700">{item.promo_code}</Text>
                <Text className="mt-1 text-[14px] font-semibold text-dime-ink">{item.title}</Text>
                <Text className="text-[12px] text-dime-ink-2">Min {rupees(item.min_order_amount)}</Text>
              </View>
            )}
          />
        </View>
      ) : null}

      {/* Menu Highlights */}
      {bestsellers.length > 0 ? (
        <View className="mt-5 px-5">
          <Text className="text-[15px] font-semibold text-dime-ink">Menu Highlights</Text>
          <FlatList
            horizontal
            data={bestsellers}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingTop: 10 }}
            renderItem={({ item }) => (
              <View className="w-44 overflow-hidden rounded-2xl bg-white border border-dime-border">
                <Image source={{ uri: item.images[0] ?? "" }} className="h-28 w-44" />
                <View className="p-2">
                  <Text numberOfLines={1} className="text-[13px] font-semibold text-dime-ink">{item.name}</Text>
                  <Text className="text-[12px] text-dime-ink-2">{rupees(item.price)}</Text>
                </View>
              </View>
            )}
          />
        </View>
      ) : null}

      <View className="mt-5 px-5">
        <Button
          label="View full menu"
          variant="secondary"
          trailing={<Icon name="chevron.right" size={14} color="#E06E10" />}
          onPress={() => {
            haptic.light();
            router.push({ pathname: "/menu/[id]", params: { id: r!.id } });
          }}
          fullWidth
        />
      </View>

      {/* Reviews */}
      <View className="mt-6 px-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-dime-ink">Reviews</Text>
          <Text className="text-[13px] text-dime-orange-600">{r?.review_count ?? 0} total</Text>
        </View>
        <View className="mt-2 gap-3">
          {(reviews ?? []).slice(0, 3).map((rev) => (
            <View key={rev.id} className="rounded-2xl border border-dime-border bg-white p-3">
              <View className="flex-row items-center gap-2">
                <Avatar name={rev.users?.name} size={32} />
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-dime-ink">{rev.users?.name ?? "Diner"}</Text>
                  <Text className="text-[11px] text-dime-ink-3">{timeAgo(rev.created_at)}</Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5">
                  <Icon name="star.fill" size={11} color="#22C55E" />
                  <Text className="text-[12px] font-semibold text-green-700">{rev.overall_rating}.0</Text>
                </View>
              </View>
              {rev.text ? <Text className="mt-2 text-[13px] text-dime-ink-2">{rev.text}</Text> : null}
              {rev.reply_text ? (
                <View className="mt-2 rounded-xl bg-dime-bg-2 p-2">
                  <Text className="text-[11px] font-semibold uppercase tracking-widest text-dime-orange-700">Owner reply</Text>
                  <Text className="text-[13px] text-dime-ink-2">{rev.reply_text}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View className="mt-6 px-5">
        <Text className="text-[11px] uppercase tracking-widest text-dime-ink-3">Legal</Text>
        <Text className="mt-1 text-[12px] text-dime-ink-2">FSSAI: {r?.fssai_number}</Text>
        <Text className="text-[12px] text-dime-ink-2">GST: {r?.gst_number}</Text>
      </View>
    </Screen>
  );
}
