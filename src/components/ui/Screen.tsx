import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { cn } from "@/lib/cn";

export function Screen({
  children,
  className,
  scroll = true,
  contentClassName,
  refreshControl,
  statusBarStyle = "dark",
  ...rest
}: ViewProps &
  Pick<ScrollViewProps, "refreshControl"> & {
    scroll?: boolean;
    contentClassName?: string;
    statusBarStyle?: "dark" | "light";
  }) {
  const Content = (
    <View className={cn("flex-1 bg-white", className)} {...rest}>
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <StatusBar style={statusBarStyle} />
      {scroll ? (
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName={cn("pb-12", contentClassName)}
          refreshControl={refreshControl}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Content}
        </ScrollView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
}
