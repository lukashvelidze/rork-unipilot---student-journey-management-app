import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColors } from "@/hooks/useColors";
import { useAppBack } from "@/hooks/useAppBack";

type BackButtonProps = {
  label?: string;
  color?: string;
  onPress?: () => void;
};

export default function BackButton({ label = "Back", color, onPress }: BackButtonProps) {
  const Colors = useColors();
  const handleBack = useAppBack();
  const tint = color || Colors.text;

  return (
    <TouchableOpacity
      onPress={onPress || handleBack}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.content}>
        <FontAwesome name="chevron-left" size={18} color={tint} />
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
});
