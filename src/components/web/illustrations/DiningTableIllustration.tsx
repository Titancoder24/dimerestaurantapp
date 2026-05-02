import Svg, { Defs, Ellipse, LinearGradient, Path, Stop, Circle, Rect } from "react-native-svg";

type Props = { width?: number; height?: number };

export function DiningTableIllustration({ width = 220, height = 160 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 160" fill="none">
      <Defs>
        <LinearGradient id="cloth" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFB56B" />
          <Stop offset="1" stopColor="#FC8019" />
        </LinearGradient>
        <LinearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F0EAE2" />
        </LinearGradient>
      </Defs>

      {/* Tablecloth */}
      <Ellipse cx="110" cy="118" rx="100" ry="22" fill="url(#cloth)" />
      <Ellipse cx="110" cy="112" rx="98" ry="20" fill="#FFD9B0" opacity={0.9} />
      <Ellipse cx="110" cy="108" rx="95" ry="18" fill="#fff" />

      {/* Plates */}
      <Ellipse cx="80" cy="103" rx="22" ry="6" fill="url(#plate)" />
      <Ellipse cx="80" cy="100" rx="22" ry="6" fill="#fff" stroke="#E5DACB" strokeWidth="0.7" />
      <Circle cx="80" cy="100" r="14" fill="#FBE6CB" />
      <Circle cx="80" cy="100" r="9" fill="#F2C58D" />

      <Ellipse cx="140" cy="103" rx="22" ry="6" fill="url(#plate)" />
      <Ellipse cx="140" cy="100" rx="22" ry="6" fill="#fff" stroke="#E5DACB" strokeWidth="0.7" />
      <Circle cx="140" cy="100" r="14" fill="#E2EAD3" />
      <Circle cx="140" cy="100" r="8" fill="#9BBE6F" />

      {/* Wine glasses */}
      <Path d="M48 96 Q48 78 56 78 Q64 78 64 96 Z" fill="#FFF8F1" stroke="#FC8019" strokeWidth="1" />
      <Rect x="55" y="96" width="2" height="14" fill="#FC8019" opacity={0.5} />
      <Ellipse cx="56" cy="111" rx="6" ry="1.5" fill="#FC8019" opacity={0.6} />

      <Path d="M156 96 Q156 78 164 78 Q172 78 172 96 Z" fill="#FFF8F1" stroke="#FC8019" strokeWidth="1" />
      <Rect x="163" y="96" width="2" height="14" fill="#FC8019" opacity={0.5} />
      <Ellipse cx="164" cy="111" rx="6" ry="1.5" fill="#FC8019" opacity={0.6} />

      {/* Decorative sparkles */}
      <Circle cx="190" cy="40" r="2.5" fill="#FFB56B" opacity={0.85} />
      <Circle cx="200" cy="60" r="1.8" fill="#FC8019" opacity={0.75} />
      <Circle cx="30" cy="48" r="2" fill="#FFB56B" opacity={0.8} />
    </Svg>
  );
}
