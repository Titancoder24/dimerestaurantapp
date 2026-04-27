import { Alert, Platform } from "react-native";

export function confirm(
  title: string,
  message: string | undefined,
  onConfirm: () => void,
  destructive = true,
) {
  if (Platform.OS === "web") {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "OK", style: destructive ? "destructive" : "default", onPress: onConfirm },
  ]);
}

export function actionSheet(
  title: string,
  options: { label: string; onPress: () => void; destructive?: boolean }[],
) {
  if (Platform.OS === "web") {
    const choice = window.prompt(
      `${title}\n\n${options.map((o, i) => `${i + 1}. ${o.label}`).join("\n")}\n\nEnter number:`,
    );
    if (choice) {
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < options.length) options[idx]!.onPress();
    }
    return;
  }
  Alert.alert(
    title,
    undefined,
    [
      ...options.map((o) => ({
        text: o.label,
        style: (o.destructive ? "destructive" : "default") as "destructive" | "default",
        onPress: o.onPress,
      })),
      { text: "Cancel", style: "cancel" as const },
    ],
  );
}
