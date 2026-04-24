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
  ...rest
}: ViewProps &
  Pick<ScrollViewProps, "refreshControl"> & {
    scroll?: boolean;
    contentClassName?: string;
  }) {
  const Content = (
    <View className={cn("flex-1 bg-dime-bg", className)} {...rest}>
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-dime-bg">
      <StatusBar style="dark" />
      {scroll ? (
        <ScrollView
          className="flex-1 bg-dime-bg"
          contentContainerClassName={cn("pb-10", contentClassName)}
          refreshControl={refreshControl}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {Content}
        </ScrollView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
}
