import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { UI } from "@/constants/design";

type Segment<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
};

/** Pill segmented control ("All · 6 | Upcoming · 3 | Done · 4"). */
export default function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => null);
              onChange(segment.key);
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.segment,
    borderRadius: 14,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 9,
  },
  segmentActive: {
    backgroundColor: UI.card,
    shadowColor: "#1C1C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    color: UI.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  labelActive: {
    color: UI.primary,
    fontWeight: "700",
  },
});
