import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServerLayout() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg">
      <Slot />
    </SafeAreaView>
  );
}
