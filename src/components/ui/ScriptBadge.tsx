import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { brand } from "@/lib/visual";

type Props = {
  label?: string;
};

// Hand-tuned cursive "New" path (28x16 viewBox).
// Other labels render as italic in v1 — TODO swap in tuned paths.
export function ScriptBadge({ label = "New" }: Props) {
  if (label.toLowerCase() === "new") {
    return (
      <View style={{ width: 30, height: 16 }}>
        <Svg width={30} height={16} viewBox="0 0 30 16">
          <Defs>
            <LinearGradient id="scriptGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={brand.orange500} />
              <Stop offset="1" stopColor={brand.orange300} />
            </LinearGradient>
          </Defs>
          {/* "N" */}
          <Path
            d="M2 11 C2.5 8 3.5 4.5 4 4 C4.5 5.5 5 9 5.5 10.5 C6 8 7 5 7.5 4"
            stroke="url(#scriptGrad)"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* "e" */}
          <Path
            d="M9 9 C11 7.5 12.5 8 12.5 9.5 C12.5 11 11 11.5 9.5 11 C9.2 10.8 9.2 10.4 9 10"
            stroke="url(#scriptGrad)"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* "w" */}
          <Path
            d="M14 7 C14.5 9 15 10.8 15.5 11 C16 9 16.5 8.5 17 8.5 C17.5 8.5 18 9.5 18.5 11 C19 10.8 19.5 9 20 7.5"
            stroke="url(#scriptGrad)"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* curved underline scribble */}
          <Path
            d="M2 14 Q 8 12.5, 14 14 T 26 13.5"
            stroke="url(#scriptGrad)"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  }
  return (
    <Text style={{ fontStyle: "italic", fontSize: 12, color: brand.orange500, fontWeight: "600" }}>
      {label}
    </Text>
  );
}
