import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "flat";
  padding?: "none" | "small" | "medium" | "large";
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  padding = "medium",
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "elevated":
        return styles.elevated;
      case "outlined":
        return styles.outlined;
      case "flat":
        return styles.flat;
      default:
        return styles.default;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case "none":
        return styles.paddingNone;
      case "small":
        return styles.paddingSmall;
      case "large":
        return styles.paddingLarge;
      default:
        return styles.paddingMedium;
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), getPaddingStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "transparent",
    elevation: 0,
  },
  flat: {
    shadowColor: "transparent",
    elevation: 0,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
});

export default Card;