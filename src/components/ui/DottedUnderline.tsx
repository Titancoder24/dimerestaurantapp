import { Text, View, useColorScheme, type TextProps } from "react-native";
import { surface } from "@/lib/visual";
import { cn } from "@/lib/cn";

type Props = TextProps & {
  className?: string;
  color?: string;
};

export function DottedUnderline({ children, className, color, style, ...rest }: Props) {
  const scheme = useColorScheme();
  const stroke = color ?? (scheme === "light" ? surface.hairlineLight : surface.inkMutedDark);
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: stroke,
        borderStyle: "dashed",
      }}
    >
      <Text className={cn(className)} style={style} {...rest}>
        {children}
      </Text>
    </View>
  );
}
