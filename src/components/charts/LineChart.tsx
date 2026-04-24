import { View } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText, LinearGradient, Stop, Defs } from "react-native-svg";

type Props = {
  data: number[];
  width: number;
  height?: number;
  padding?: number;
  color?: string;
};

export function LineChart({ data, width, height = 160, padding = 16, color = "#FC8019" }: Props) {
  if (data.length === 0) return <View style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const toX = (i: number) => padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1);
  const toY = (v: number) => padding + (height - padding * 2) * (1 - (v - min) / range);

  const linePath = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
  const areaPath = `${linePath} L ${toX(data.length - 1)} ${height - padding} L ${toX(0)} ${height - padding} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <Line
          key={p}
          x1={padding}
          x2={width - padding}
          y1={padding + (height - padding * 2) * p}
          y2={padding + (height - padding * 2) * p}
          stroke="#F0F0F0"
          strokeWidth={1}
        />
      ))}
      <Path d={areaPath} fill="url(#g)" />
      <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={color} />
      ))}
    </Svg>
  );
}
