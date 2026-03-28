import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View, StyleProp } from "react-native";
import Colors from "@/constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "outline";
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "default",
  fullWidth = false,
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;
  const containerStyles: StyleProp<ViewStyle> = [
    styles.button,
    variant === "outline" ? styles.buttonOutline : styles.buttonDefault,
    fullWidth ? styles.fullWidth : undefined,
    isDisabled ? styles.disabled : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles: StyleProp<TextStyle> = [
    styles.label,
    variant === "outline" ? { color: Colors.primary } : undefined,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={containerStyles}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? Colors.primary : "#FFFFFF"} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={labelStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonDefault: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderColor: Colors.border,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;


