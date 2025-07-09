import React from "react";
import { StyleSheet, View, ViewStyle, Platform } from "react-native";
import Colors from "@/constants/colors";
import Theme from "@/constants/theme";

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
        return Platform.OS === 'web' 
          ? { ...styles.flat, backgroundColor: 'rgba(255, 255, 255, 0.9)' }
          : styles.glass;
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
    ] as ViewStyle[]}>
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
        shadowColor: Colors.shadowMedium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
      }
    }),
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      }
    }),
  },
  flat: {
    ...Platform.select({
      ios: {
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
      web: {
        boxShadow: 'none',
      }
    }),
  },
  glass: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowMedium,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
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
    padding: Theme.spacing.s,
  },
  paddingMedium: {
    padding: Theme.spacing.m,
  },
  paddingLarge: {
    padding: Theme.spacing.l,
  },
  borderRadiusSmall: {
    borderRadius: Theme.borderRadius.s,
  },
  borderRadiusMedium: {
    borderRadius: Theme.borderRadius.m,
  },
  borderRadiusLarge: {
    borderRadius: Theme.borderRadius.l,
  },
  borderRadiusExtraLarge: {
    borderRadius: Theme.borderRadius.xl,
  },
});

export default Card;