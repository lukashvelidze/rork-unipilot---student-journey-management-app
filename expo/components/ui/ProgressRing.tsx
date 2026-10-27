import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { UI } from "@/constants/design";

type Props = {
  /** 0-100 */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  fillColor?: string;
  labelSize?: number;
};

/** Circular percentage indicator (Task Overview, profile completeness). */
export default function ProgressRing({
  progress,
  size = 64,
  stroke = 4,
  color = UI.primary,
  trackColor = "#FFD9D9",
  fillColor = UI.primaryRing,
  labelSize = 17,
}: Props) {
  const clamped = Math.min(Math.max(Math.round(progress), 0), 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      accessibilityLabel={`${clamped} percent`}
      accessibilityRole="progressbar"
      style={{ height: size, width: size }}
    >
      <Svg height={size} width={size}>
        <Circle cx={size / 2} cy={size / 2} fill={fillColor} r={radius} stroke={trackColor} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          origin={`${size / 2}, ${size / 2}`}
          r={radius}
          rotation={-90}
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          strokeLinecap="round"
          strokeWidth={stroke}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.label, { color, fontSize: labelSize }]}>{clamped}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
