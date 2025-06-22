import React from "react";
import { StyleSheet, View, Text, Image, ViewStyle } from "react-native";
import Colors from "@/constants/colors";
import { getInitials } from "@/utils/helpers";

interface AvatarProps {
  source?: string;
  name?: string;
  size?: "small" | "medium" | "large" | number;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = "medium",
  style,
  showBorder = false,
  borderColor = Colors.primary,
}) => {
  const getSize = () => {
    if (typeof size === "number") return size;
    
    switch (size) {
      case "small":
        return 32;
      case "large":
        return 64;
      case "medium":
      default:
        return 48;
    }
  };

  const avatarSize = getSize();
  const fontSize = avatarSize * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: showBorder ? 2 : 0,
          borderColor,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>
          {name ? getInitials(name) : "?"}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: Colors.primary,
    fontWeight: "600",
  },
});

export default Avatar;