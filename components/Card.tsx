import React from "react";
import { StyleSheet, View, ViewStyle, Platform } from "react-native";
import Colors from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "flat" | "glass";
  padding?: "none" | "small" | "medium" | "large";
  borderRadius?: "small" | "medium" | "large" | "extraLarge";
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  padding = "medium",
  borderRadius = "medium",
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "elevated":
        return styles.elevated;
      case "outlined":
        return styles.outlined;
      case "flat":
        return styles.flat;
      case "glass":
        return styles.glass;
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
  
  const getBorderRadiusStyle = () => {
    switch (borderRadius) {
      case "small":
        return styles.borderRadiusSmall;
      case "large":
        return styles.borderRadiusLarge;
      case "extraLarge":
        return styles.borderRadiusExtraLarge;
      default:
        return styles.borderRadiusMedium;
    }
  };

  return (
    <View style={[
      styles.card, 
      getVariantStyle(), 
      getPaddingStyle(), 
      getBorderRadiusStyle(),
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    overflow: "hidden",
  },
  default: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
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
  glass: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  borderRadiusSmall: {
    borderRadius: 8,
  },
  borderRadiusMedium: {
    borderRadius: 12,
  },
  borderRadiusLarge: {
    borderRadius: 16,
  },
  borderRadiusExtraLarge: {
    borderRadius: 24,
  },
});

export default Card;