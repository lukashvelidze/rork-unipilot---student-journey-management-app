import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

interface OnboardingChoiceCardProps {
  description?: string | null;
  disabled?: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  selected: boolean;
  testID?: string;
  title: string;
}

function OnboardingChoiceCard({
  description,
  disabled = false,
  icon,
  onPress,
  selected,
  testID,
  title,
}: OnboardingChoiceCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${title}${description ? `. ${description}` : ""}`}
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        pressed && !disabled && styles.pressedCard,
        disabled && styles.disabledCard,
      ]}
      testID={testID}
    >
      <View style={[styles.iconShell, selected && styles.selectedIconShell]}>
        {icon}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, selected && styles.selectedTitle]}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      <View style={[styles.selector, selected && styles.selectedSelector]}>
        {selected ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

export default memo(OnboardingChoiceCard);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
  },
  selectedCard: {
    backgroundColor: "#FFF7F7",
    borderColor: "#FF6B6B",
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.12,
  },
  pressedCard: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  disabledCard: {
    opacity: 0.55,
  },
  iconShell: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  selectedIconShell: {
    backgroundColor: "#FFE8E8",
  },
  copy: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  title: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  selectedTitle: {
    color: "#E85454",
  },
  description: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  selector: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  selectedSelector: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
});
