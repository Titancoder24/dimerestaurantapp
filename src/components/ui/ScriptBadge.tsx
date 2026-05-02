import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

type Props = {
  label?: string;
  height?: number;
};

// Hand-tuned cursive "New" with a swooshy underline. Painted with the
// premium orange gradient. Other labels fall back to a system italic
// for now (see TODO).
export function ScriptBadge({ label = "New", height = 16 }: Props) {
  if (label.toLowerCase() !== "new") {
    // TODO: hand-tune additional cursive glyphs as we add them.
    return (
      <Text
        style={{
          color: "#FC8019",
          fontStyle: "italic",
          fontWeight: "700",
          fontSize: height,
        }}
      >
        {label}
      </Text>
    );
  }

  const width = (height / 16) * 32;
  return (
    <View style={{ width, height }}>
      <Svg viewBox="0 0 32 18" width={width} height={height}>
        <Defs>
          <LinearGradient id="scriptGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FC8019" />
            <Stop offset="100%" stopColor="#FFB56B" />
          </LinearGradient>
        </Defs>
        {/* "N" upstroke + downstroke + diagonal */}
        <Path
          d="M2.2 11.5 C 2.2 8 3.4 4 4.6 4 C 5.8 4 6.2 8.5 6.2 11.5 C 6.2 9 7.6 5.5 9.4 5.5 C 10.6 5.5 10.7 8 10.7 11.5"
          stroke="url(#scriptGrad)"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* "e" loop */}
        <Path
          d="M12.6 9.5 C 14 9.5 15 9 15 8 C 15 7 14 6.5 13.2 7.2 C 12.4 7.9 12 9 12.4 10.2 C 12.8 11.4 14.4 11.6 15.6 10.6"
          stroke="url(#scriptGrad)"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* "w" with flourish */}
        <Path
          d="M17.4 6.5 C 17.4 8.5 18 11 19 11 C 20 11 20.4 8.5 20.4 7 C 20.4 8.5 21 11 22 11 C 23 11 23.6 8.5 23.6 7 C 24 8 25 9 27 8.4 C 29 7.8 29.4 5.4 27.6 5.4"
          stroke="url(#scriptGrad)"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* underline scribble */}
        <Path
          d="M3 15 C 8 13.4 16 13.4 22 14.4 C 26 15 28 15.4 29.6 14.6"
          stroke="url(#scriptGrad)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
