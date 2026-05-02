import { Text, View, type TextStyle, type StyleProp } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
  textStyle?: StyleProp<TextStyle>;
};

export function DottedUnderline({ children, className, textStyle }: Props) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "rgba(28,28,30,0.45)",
        borderStyle: "dashed",
        alignSelf: "flex-start",
      }}
    >
      <Text className={className} style={textStyle}>
        {children}
      </Text>
    </View>
  );
}
