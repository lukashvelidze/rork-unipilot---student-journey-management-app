import React, { memo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Check } from "lucide-react-native";

interface OnboardingChoiceCardProps {
  description?: string | null;
  disabled?: boolean;
  icon: React.ReactNode;
  layout?: "list" | "tile";
  onPress: () => void;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
}

function OnboardingChoiceCard({
  description,
  disabled = false,
  icon,
  layout = "list",
  onPress,
  selected,
  style,
  testID,
  title,
}: OnboardingChoiceCardProps) {
  const isTile = layout === "tile";

  return (
    <Pressable
      accessibilityLabel={`${title}${description ? `. ${description}` : ""}`}
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isTile && styles.tileCard,
        selected && styles.selectedCard,
        pressed && !disabled && styles.pressedCard,
        disabled && styles.disabledCard,
        style,
      ]}
      testID={testID}
    >
      <View style={isTile ? styles.tileTopRow : undefined}>
        <View
          style={[
            styles.iconShell,
            isTile && styles.tileIconShell,
            selected && styles.selectedIconShell,
          ]}
        >
          {icon}
        </View>

        {isTile && selected ? (
          <View
            style={[
              styles.selector,
              styles.tileSelector,
              styles.selectedSelector,
            ]}
          >
            <Check color="#FFFFFF" size={10} strokeWidth={3} />
          </View>
        ) : null}
      </View>

      <View style={[styles.copy, isTile && styles.tileCopy]}>
        <Text
          numberOfLines={isTile ? 2 : undefined}
          selectable={false}
          style={[styles.title, isTile && styles.tileTitle]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            numberOfLines={isTile ? 2 : undefined}
            selectable={false}
            style={[styles.description, isTile && styles.tileDescription]}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {!isTile ? (
        <View style={[styles.selector, selected && styles.selectedSelector]}>
          {selected ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
        </View>
      ) : null}
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
    borderWidth: 2,
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
    backgroundColor: "#FFF0F0",
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
  tileCard: {
    alignItems: "stretch",
    borderRadius: 16,
    flexDirection: "column",
    justifyContent: "flex-start",
    minHeight: 136,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    width: "48.3%",
  },
  tileTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tileIconShell: {
    borderRadius: 12,
    height: 40,
    width: 40,
  },
  tileSelector: {
    borderRadius: 9,
    borderWidth: 0,
    height: 18,
    width: 18,
  },
  tileCopy: {
    alignSelf: "stretch",
    marginLeft: 0,
    marginRight: 0,
    marginTop: 12,
    minHeight: 39,
    width: "100%",
  },
  tileTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    opacity: 1,
  },
  tileDescription: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
    opacity: 1,
  },
});
