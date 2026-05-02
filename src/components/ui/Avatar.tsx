import { Image, Text, View } from "react-native";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Avatar({
  name,
  uri,
  size = 44,
  ring,
  className,
}: {
  name?: string | null;
  uri?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      className={cn(
        "items-center justify-center overflow-hidden bg-neutral-100",
        ring && "border-2 border-dime-primary-500",
        className
      )}
      style={dim}
    >
      {uri ? (
        <Image source={{ uri }} style={dim} />
      ) : (
        <Text style={{ fontSize: Math.floor(size * 0.38) }} className="font-semibold text-neutral-500">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
