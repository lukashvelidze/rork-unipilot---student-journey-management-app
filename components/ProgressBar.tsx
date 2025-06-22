import React, { useEffect, useRef } from "react";
import { StyleSheet, View, ViewStyle, Animated, Easing } from "react-native";
import Colors from "@/constants/colors";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animated?: boolean;
  showPulse?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = Colors.lightBackground,
  progressColor = Colors.primary,
  style,
  animated = true,
  showPulse = false,
}) => {
  // Ensure progress is between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animate progress when it changes
  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: clampedProgress,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Width changes can't use native driver
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated, progressAnim]);
  
  // Pulse animation for completed or milestone progress
  useEffect(() => {
    if (showPulse && (clampedProgress === 100 || 
        clampedProgress === 25 || 
        clampedProgress === 50 || 
        clampedProgress === 75)) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [clampedProgress, showPulse, pulseAnim]);
  
  // Convert progress value to width percentage
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });
  
  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width: progressWidth,
            backgroundColor: progressColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 8,
  },
});

export default ProgressBar;