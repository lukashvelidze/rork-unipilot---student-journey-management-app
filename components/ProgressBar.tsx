import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = Colors.lightBackground,
  progressColor = Colors.primary,
  style,
  animated = true,
}) => {
  // Ensure progress is between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor },
        style,
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress}%`,
            backgroundColor: progressColor,
          },
          animated && styles.animated,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
  },
  animated: {
    transition: "width 0.5s ease-in-out",
  },
});

export default ProgressBar;