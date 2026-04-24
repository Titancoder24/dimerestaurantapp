import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-2xl bg-white border border-dime-border",
        className
      )}
      style={[
        { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
        rest.style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

Card.Header = function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between border-b border-dime-border px-4 py-3">
      <View className="flex-1">
        <Text className="text-[17px] font-semibold text-dime-ink">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[13px] text-dime-ink-3">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
};

Card.Body = function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("p-4", className)}>{children}</View>;
};

Card.Footer = function Footer({ children }: { children: React.ReactNode }) {
  return <View className="border-t border-dime-border px-4 py-3">{children}</View>;
};
