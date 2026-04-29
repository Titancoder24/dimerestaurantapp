import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Image, Linking, Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Icon, Screen, Avatar, haptic } from "@/components/ui";
import { useRestaurant, useMenu, useActiveOffers, useReviews } from "@/hooks/queries";
import { fullDate, rupees, timeAgo } from "@/lib/format";

type TaggedPhoto = { url: string; label: string; sublabel?: string; category: "restaurant" | "menu" };

export default function RestaurantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: r, isLoading } = useRestaurant(id);
  const { data: menu } = useMenu(id);
  const { data: offers } = useActiveOffers(id);
  const { data: reviews } = useReviews(id);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const lightboxRef = useRef<FlatList>(null);

  const allPhotos = useMemo(() => {
    if (!r) return [];
    const photos: string[] = [];
    if (r.cover_image_url) photos.push(r.cover_image_url);
    if (r.gallery_images?.length) {
      for (const url of r.gallery_images) {
        if (url && !photos.includes(url)) photos.push(url);
      }
    }
    return photos;
  }, [r]);

  const taggedPhotos = useMemo((): TaggedPhoto[] => {
    const tagged: TaggedPhoto[] = [];
    for (const url of allPhotos) {
      tagged.push({ url, label: r?.name ?? "Restaurant", sublabel: "Restaurant photo", category: "restaurant" });
    }
    for (const item of menu?.items ?? []) {
      for (const url of item.images) {
        if (url) tagged.push({ url, label: item.name, sublabel: rupees(item.price), category: "menu" });
      }
    }
    return tagged;
  }, [allPhotos, menu, r]);

  const openLightbox = useCallback((url: string) => {
    const idx = taggedPhotos.findIndex((p) => p.url === url);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }, [taggedPhotos]);

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
        {allPhotos.length > 0 ? (
          <FlatList
            horizontal
            pagingEnabled
            data={allPhotos}
            keyExtractor={(url, i) => `photo-${i}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActivePhoto(idx);
            }}
            renderItem={({ item: url }) => (
              <Pressable onPress={() => openLightbox(url)}>
                <Image source={{ uri: url }} style={{ width: screenWidth, height: 288 }} resizeMode="cover" />
              </Pressable>
            )}
          />
        ) : (
          <View style={{ width: screenWidth, height: 288 }} className="items-center justify-center bg-dime-bg-2">
            <Icon name="photo.fill" size={40} color="#BFBFBF" />
          </View>
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "transparent", "rgba(0,0,0,0.6)"]}
          className="absolute inset-0"
          pointerEvents="none"
        />
        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pt-14">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-black/30"
            style={{ backdropFilter: "blur(10px)" } as any}
          >
            <Icon name="chevron.left" size={20} color="#fff" />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-black/30">
              <Icon name="heart" size={18} color="#fff" />
            </Pressable>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-black/30">
              <Icon name="square.and.arrow.up" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
        {allPhotos.length > 1 ? (
          <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-1.5">
            {allPhotos.map((_, i) => (
              <View key={i} className={`h-2 rounded-full ${activePhoto === i ? "w-5 bg-white" : "w-2 bg-white/50"}`} />
            ))}
            <View className="absolute right-5 rounded-full bg-black/40 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-white">{activePhoto + 1} / {allPhotos.length}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="-mt-8 rounded-t-[28px] bg-white px-5 pt-6">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-dime-ink" style={{ letterSpacing: -0.5 }}>
              {r?.name}
            </Text>
            <Text className="mt-1 text-[14px] text-dime-ink-3">{r?.cuisines.join(" · ")}</Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2">
            <Icon name="star.fill" size={14} color="#16A34A" />
            <Text className="text-[15px] font-bold text-emerald-700">{Number(r?.rating ?? 0).toFixed(1)}</Text>
            <Text className="text-[11px] text-emerald-600">({r?.review_count})</Text>
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <Badge tone={open ? "green" : "red"} label={open ? "Open now" : "Closed"} />
          <Text className="text-[14px] font-medium text-dime-ink-3">{"₹".repeat(r?.price_range ?? 2)}</Text>
          <View className="h-1 w-1 rounded-full bg-dime-ink-4" />
          <Text numberOfLines={1} className="flex-1 text-[14px] text-dime-ink-3">{r?.address}</Text>
        </View>

        <Text className="mt-4 text-[15px] leading-[22px] text-dime-ink-2">{r?.description}</Text>

        <View className="mt-5 flex-row gap-3">
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
            leading={<Icon name="qrcode.viewfinder" size={16} color="#FF6B2C" />}
            onPress={() => router.push("/scan")}
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => r?.phone && Linking.openURL(`tel:${r.phone}`)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-dime-bg-2 px-4 py-3.5"
          >
            <Icon name="phone.fill" size={16} color="#FF6B2C" />
            <Text className="text-[14px] font-semibold text-dime-ink">Call</Text>
          </Pressable>
          <Pressable
            onPress={() => r?.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(r.address)}`)}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-dime-bg-2 px-4 py-3.5"
          >
            <Icon name="map.fill" size={16} color="#FF6B2C" />
            <Text className="text-[14px] font-semibold text-dime-ink">Directions</Text>
          </Pressable>
        </View>
      </View>

      {r && r.amenities.length > 0 ? (
        <View className="mt-6 px-5">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Amenities
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {r.amenities.map((a) => (
              <View key={a} className="rounded-full bg-dime-bg-2 px-4 py-2">
                <Text className="text-[13px] font-medium text-dime-ink-2">{a}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {allPhotos.length > 1 ? (
        <View className="mt-6 px-5">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Photos ({allPhotos.length})
          </Text>
          <FlatList
            horizontal
            data={allPhotos}
            keyExtractor={(url, i) => `gallery-${i}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 12 }}
            renderItem={({ item: url }) => (
              <Pressable onPress={() => openLightbox(url)}>
                <Image source={{ uri: url }} className="h-32 w-44 rounded-2xl" resizeMode="cover" />
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {offers && offers.length > 0 ? (
        <View className="mt-6">
          <Text className="mb-3 px-5 text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Offers
          </Text>
          <FlatList
            horizontal
            data={offers}
            keyExtractor={(o) => o.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
              <View className="w-64 rounded-2xl bg-dime-primary-50 p-4" style={{ borderWidth: 1, borderColor: "rgba(255,107,44,0.15)", borderStyle: "dashed" }}>
                <Text className="text-[10px] font-bold uppercase text-dime-primary-600" style={{ letterSpacing: 1.5 }}>
                  {item.promo_code}
                </Text>
                <Text className="mt-1.5 text-[15px] font-bold text-dime-ink" style={{ letterSpacing: -0.2 }}>
                  {item.title}
                </Text>
                <Text className="mt-0.5 text-[12px] text-dime-ink-3">Min {rupees(item.min_order_amount)}</Text>
              </View>
            )}
          />
        </View>
      ) : null}

      {bestsellers.length > 0 ? (
        <View className="mt-6 px-5">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Menu Highlights
          </Text>
          <FlatList
            horizontal
            data={bestsellers}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingTop: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => item.images[0] && openLightbox(item.images[0])}>
                <View className="w-44 overflow-hidden rounded-2xl bg-white" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
                  <Image source={{ uri: item.images[0] ?? "" }} className="h-28 w-44" resizeMode="cover" />
                  <View className="p-3">
                    <Text numberOfLines={1} className="text-[14px] font-bold text-dime-ink">{item.name}</Text>
                    <Text className="mt-0.5 text-[13px] font-semibold text-dime-ink-2">{rupees(item.price)}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      <View className="mt-5 px-5">
        <Button
          label="View full menu"
          variant="secondary"
          trailing={<Icon name="chevron.right" size={14} color="#FF6B2C" />}
          onPress={() => {
            haptic.light();
            router.push({ pathname: "/menu/[id]", params: { id: r!.id } });
          }}
          fullWidth
        />
      </View>

      <View className="mt-8 px-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>
            Reviews
          </Text>
          <Text className="text-[13px] font-semibold text-dime-primary-500">{r?.review_count ?? 0} total</Text>
        </View>
        <View className="mt-3 gap-3">
          {(reviews ?? []).slice(0, 3).map((rev) => (
            <View key={rev.id} className="rounded-2xl bg-white p-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
              <View className="flex-row items-center gap-3">
                <Avatar name={rev.users?.name} size={36} />
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-dime-ink">{rev.users?.name ?? "Diner"}</Text>
                  <Text className="text-[12px] text-dime-ink-4">{timeAgo(rev.created_at)}</Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1">
                  <Icon name="star.fill" size={11} color="#16A34A" />
                  <Text className="text-[13px] font-bold text-emerald-700">{rev.overall_rating}.0</Text>
                </View>
              </View>
              {rev.text ? <Text className="mt-3 text-[14px] leading-[20px] text-dime-ink-2">{rev.text}</Text> : null}
              {rev.reply_text ? (
                <View className="mt-3 rounded-xl bg-dime-bg-2 p-3">
                  <Text className="text-[10px] font-bold uppercase text-dime-primary-600" style={{ letterSpacing: 1 }}>Owner reply</Text>
                  <Text className="mt-1 text-[13px] text-dime-ink-2">{rev.reply_text}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <View className="mt-8 px-5 pb-8">
        <Text className="text-[10px] font-bold uppercase text-dime-ink-4" style={{ letterSpacing: 1.5 }}>Legal</Text>
        <Text className="mt-2 text-[12px] text-dime-ink-3">FSSAI: {r?.fssai_number}</Text>
        <Text className="text-[12px] text-dime-ink-3">GST: {r?.gst_number}</Text>
      </View>

      <Modal visible={lightboxIndex >= 0} transparent animationType="fade" onRequestClose={() => setLightboxIndex(-1)}>
        <View className="flex-1 bg-black">
          <FlatList
            ref={lightboxRef}
            horizontal
            pagingEnabled
            data={taggedPhotos}
            keyExtractor={(p, i) => `lb-${i}`}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
            getItemLayout={(_, i) => ({ length: screenWidth, offset: screenWidth * i, index: i })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setLightboxIndex(idx);
            }}
            renderItem={({ item: photo }) => (
              <View style={{ width: screenWidth, height: screenHeight }} className="items-center justify-center">
                <Image source={{ uri: photo.url }} style={{ width: screenWidth, height: screenHeight * 0.7 }} resizeMode="contain" />
              </View>
            )}
          />

          <View className="absolute inset-x-0 top-0 pt-14 px-5">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setLightboxIndex(-1)}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="xmark" size={18} color="#fff" />
              </Pressable>
              <View className="rounded-full bg-white/15 px-3 py-1.5">
                <Text className="text-[13px] font-bold text-white">
                  {lightboxIndex >= 0 ? lightboxIndex + 1 : 1} / {taggedPhotos.length}
                </Text>
              </View>
            </View>
          </View>

          {lightboxIndex >= 0 && taggedPhotos[lightboxIndex] ? (
            <View className="absolute inset-x-0 bottom-0 pb-12 px-5">
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                className="absolute inset-0"
                pointerEvents="none"
              />
              <View className="flex-row items-center gap-2 mb-2">
                <View className={`rounded-full px-2.5 py-1 ${taggedPhotos[lightboxIndex].category === "menu" ? "bg-dime-primary-500" : "bg-white/20"}`}>
                  <Text className="text-[10px] font-bold uppercase text-white" style={{ letterSpacing: 1 }}>
                    {taggedPhotos[lightboxIndex].category === "menu" ? "Menu item" : "Restaurant"}
                  </Text>
                </View>
              </View>
              <Text className="text-[20px] font-bold text-white" style={{ letterSpacing: -0.5 }}>
                {taggedPhotos[lightboxIndex].label}
              </Text>
              {taggedPhotos[lightboxIndex].sublabel ? (
                <Text className="mt-1 text-[14px] text-white/70">{taggedPhotos[lightboxIndex].sublabel}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
