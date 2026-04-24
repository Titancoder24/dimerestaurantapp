import { Platform, type StyleProp, type TextStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";

// SF Symbol name -> Material Icons fallback
const fallback: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  "house.fill": "home",
  "magnifyingglass": "search",
  "calendar": "event",
  "person.fill": "person",
  "cart.fill": "shopping-cart",
  "bell.fill": "notifications",
  "star.fill": "star",
  "location.fill": "location-on",
  "clock.fill": "access-time",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "xmark": "close",
  "plus": "add",
  "minus": "remove",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "qrcode.viewfinder": "qr-code-scanner",
  "qrcode": "qr-code",
  "flame.fill": "local-fire-department",
  "leaf.fill": "eco",
  "crown.fill": "workspace-premium",
  "fork.knife": "restaurant",
  "photo.fill": "photo",
  "creditcard.fill": "credit-card",
  "gear": "settings",
  "ellipsis": "more-horiz",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "arrow.up.right": "north-east",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "map.fill": "map",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "square.and.arrow.up": "ios-share",
  "tray.fill": "inbox",
  "cup.and.saucer.fill": "coffee",
  "birthday.cake.fill": "cake",
  "fish.fill": "set-meal",
  "sunrise.fill": "wb-sunny",
  "circle.grid.cross.fill": "apps",
  "gift.fill": "redeem",
  "tag.fill": "local-offer",
  "sparkles": "auto-awesome",
  "lock.fill": "lock",
  "trash": "delete",
  "pencil": "edit",
  "info.circle": "info",
  "exclamationmark.triangle.fill": "warning",
  "hand.raised.fill": "pan-tool",
  "flag.fill": "flag",
  "bag.fill": "shopping-bag",
  "shippingbox.fill": "inventory",
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "tablecells": "table-chart",
  "doc.text.fill": "description",
  "building.2.fill": "apartment",
  "globe": "language",
  "wifi": "wifi",
  "car.fill": "directions-car",
  "snowflake": "ac-unit",
  "music.note": "music-note",
  "dog.fill": "pets",
};

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 20, color = "#1C1C1E", style }: Props) {
  if (Platform.OS === "ios") {
    return <SymbolView name={name as never} size={size} tintColor={color} style={style as never} />;
  }
  const mi = fallback[name] ?? "circle";
  return <MaterialIcons name={mi} size={size} color={color} style={style} />;
}
