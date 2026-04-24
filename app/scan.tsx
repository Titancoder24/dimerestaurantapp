import { useEffect, useRef, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Header, Icon, Input, Screen, haptic } from "@/components/ui";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { supabase } from "@/lib/supabase";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, request] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [restaurantCode, setRestaurantCode] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const startSession = useCart((s) => s.startSession);
  const toast = useToast();
  const lock = useRef(false);

  useEffect(() => {
    if (!permission?.granted) request();
  }, [permission?.granted]);

  async function joinTable(restaurantId: string, tNum: number) {
    const [rRes, tRes] = await Promise.all([
      supabase.from("restaurants").select("id,name").eq("id", restaurantId).maybeSingle(),
      supabase.from("tables").select("id,number").eq("restaurant_id", restaurantId).eq("number", tNum).maybeSingle(),
    ]);
    if (!rRes.data) {
      toast.error("Restaurant not found");
      return;
    }
    startSession({
      restaurantId: rRes.data.id,
      restaurantName: rRes.data.name,
      tableId: tRes.data?.id,
      tableNumber: tNum,
    });
    haptic.success();
    toast.success(`Seated at Table ${tNum}`, rRes.data.name);
    router.replace({ pathname: "/menu/[id]", params: { id: rRes.data.id } });
  }

  return (
    <Screen scroll={false}>
      <Header title="Scan table QR" back />

      <View className="mx-4 aspect-square overflow-hidden rounded-3xl bg-black">
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              if (scanned || lock.current) return;
              lock.current = true;
              setScanned(true);
              try {
                const parsed = JSON.parse(data);
                if (parsed.r && parsed.t) {
                  joinTable(String(parsed.r), Number(parsed.t)).finally(() => {
                    setTimeout(() => { lock.current = false; setScanned(false); }, 1500);
                  });
                  return;
                }
                throw new Error("Invalid payload");
              } catch {
                toast.error("Unrecognised QR code");
                setTimeout(() => { lock.current = false; setScanned(false); }, 1500);
              }
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center p-6">
            <Icon name="qrcode.viewfinder" size={40} color="#FC8019" />
            <Text className="mt-3 text-center text-[14px] text-white">Camera permission is required to scan.</Text>
            <View className="mt-4">
              <Button label="Grant camera" onPress={request} />
            </View>
          </View>
        )}
        <View pointerEvents="none" className="absolute inset-8 border-2 border-white/60 rounded-2xl" />
      </View>

      <View className="mx-4 mt-6 rounded-2xl border border-dime-border bg-white p-4">
        <Text className="text-[13px] font-semibold text-dime-ink">Enter manually</Text>
        <View className="mt-3 gap-3">
          <Input label="Restaurant code (paste id)" placeholder="uuid" value={restaurantCode} onChangeText={setRestaurantCode} autoCapitalize="none" />
          <Input label="Table number" keyboardType="number-pad" placeholder="5" value={tableNumber} onChangeText={setTableNumber} />
          <Button
            label="Join table"
            onPress={() => {
              if (!restaurantCode || !tableNumber) return toast.error("Fill both fields");
              joinTable(restaurantCode.trim(), parseInt(tableNumber, 10));
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
