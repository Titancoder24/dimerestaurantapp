import { useEffect } from "react";
import { Modal, Pressable, View, type ViewProps } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { cn } from "@/lib/cn";

export function Sheet({
  visible,
  onClose,
  children,
  maxHeight = "85%",
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: `${number}%` | number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(400, { duration: 180 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View style={backdropStyle} className="absolute inset-0 bg-black/50">
          <Pressable onPress={onClose} className="absolute inset-0" />
        </Animated.View>
        <Animated.View
          style={[{ maxHeight }, sheetStyle]}
          className="rounded-t-3xl bg-white pb-8"
        >
          <View className="items-center pt-3 pb-2">
            <View className="h-1 w-10 rounded-full bg-dime-ink-4" />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

Sheet.Body = function Body({ children, className, ...rest }: ViewProps & { className?: string }) {
  return (
    <View className={cn("px-5 pt-2", className)} {...rest}>
      {children}
    </View>
  );
};
