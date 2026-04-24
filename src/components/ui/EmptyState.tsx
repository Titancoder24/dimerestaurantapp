import { Text, View } from "react-native";
import { Icon } from "./Icon";
import { Button } from "./Button";

export function EmptyState({
  icon = "tray.fill",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center px-8 py-12">
      <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-dime-orange-50">
        <Icon name={icon} size={30} color="#FC8019" />
      </View>
      <Text className="text-center text-[17px] font-semibold text-dime-ink">{title}</Text>
      {message ? <Text className="mt-1 max-w-[320px] text-center text-[13px] text-dime-ink-3">{message}</Text> : null}
      {actionLabel && onAction ? (
        <View className="mt-5 w-full max-w-[260px]">
          <Button label={actionLabel} onPress={onAction} fullWidth />
        </View>
      ) : null}
    </View>
  );
}
