import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Colors from "@/constants/colors";
import { getInitials } from "@/utils/helpers";

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: "small" | "medium" | "large";
  color?: string;
  style?: any;
}

const Avatar: React.FC<AvatarProps> = ({
  name = "",
  imageUrl,
  size = "medium",
  color = Colors.primary,
  style,
}) => {
  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case "small":
        return { width: 32, height: 32, fontSize: 12 };
      case "large":
        return { width: 56, height: 56, fontSize: 20 };
      case "medium":
      default:
        return { width: 40, height: 40, fontSize: 16 };
    }
  };

  const { width, height, fontSize } = getDimensions();

  // Get initials from name
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: imageUrl ? "transparent" : color,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: Colors.white,
    fontWeight: "600",
  },
});

export default Avatar;