import { Pressable, View } from "react-native";
import { Icon } from "./Icon";
import { haptic } from "./haptics";

export function StarRating({
  value,
  onChange,
  size = 28,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const color = filled ? "#FC8019" : "#D1D1D6";
        const tapped = () => {
          if (readOnly) return;
          haptic.light();
          onChange?.(n);
        };
        return (
          <Pressable key={n} onPress={tapped} disabled={readOnly} hitSlop={6}>
            <Icon name="star.fill" size={size} color={color} />
          </Pressable>
        );
      })}
    </View>
  );
}
