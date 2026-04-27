import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-2xl bg-white", className)}
      style={[
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        },
        rest.style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

Card.Header = function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <View className="flex-1">
        <Text className="text-[16px] font-bold text-dime-ink" style={{ letterSpacing: -0.3 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[13px] text-dime-ink-3">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
};

Card.Body = function Body({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("px-5 py-4", className)}>{children}</View>;
};

Card.Footer = function Footer({ children }: { children: React.ReactNode }) {
  return (
    <View className="border-t border-dime-border px-5 py-3.5">{children}</View>
  );
};
