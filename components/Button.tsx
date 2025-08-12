import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from "react-native";
import Colors from "@/constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text" | "destructive";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = {};

    switch (variant) {
      case "primary":
        buttonStyle = {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
        };
        break;
      case "secondary":
        buttonStyle = {
          backgroundColor: Colors.secondary,
          borderColor: Colors.secondary,
        };
        break;
      case "outline":
        buttonStyle = {
          backgroundColor: "transparent",
          borderColor: Colors.primary,
          borderWidth: 1,
        };
        break;
      case "text":
        buttonStyle = {
          backgroundColor: "transparent",
          borderColor: "transparent",
        };
        break;
      case "destructive":
        buttonStyle = {
          backgroundColor: "#FF3B30",
          borderColor: "#FF3B30",
        };
        break;
    }

    if (disabled) {
      buttonStyle.opacity = 0.5;
    }

    return buttonStyle;
  };

  const getTextStyle = () => {
    let style: TextStyle = {};

    switch (variant) {
      case "primary":
      case "secondary":
      case "destructive":
        style = {
          color: Colors.white,
        };
        break;
      case "outline":
      case "text":
        style = {
          color: Colors.primary,
        };
        break;
    }

    switch (size) {
      case "small":
        style.fontSize = 14;
        break;
      case "medium":
        style.fontSize = 16;
        break;
      case "large":
        style.fontSize = 18;
        break;
    }

    return style;
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 4,
          minHeight: 36,
        };
      case "medium":
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 6,
          minHeight: 48,
        };
      case "large":
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 8,
          minHeight: 56,
        };
    }
  };

  // Enhanced button press handler with better touch handling
  const handlePress = () => {
    console.log("Button pressed:", title, "disabled:", disabled, "loading:", loading);
    if (disabled || loading) {
      console.log("Button press ignored - disabled or loading");
      return;
    }
    
    try {
      onPress();
    } catch (error) {
      console.error("Error in button onPress:", error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.7}
      // Ensure button is touchable and above other elements
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "text" ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === "left" ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === "right" ? <View style={styles.iconRight}>{icon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    // Ensure button is above other elements
    zIndex: 100,
    elevation: 100,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;