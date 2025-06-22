import React, { useEffect, useRef } from "react";
import { StyleSheet, View, ViewStyle, Animated, Easing, Platform } from "react-native";
import Colors from "@/constants/colors";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  animated?: boolean;
  showPulse?: boolean;
  borderRadius?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = Colors.lightBackground,
  progressColor = Colors.primary,
  style,
  animated = true,
  showPulse = false,
  borderRadius,
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
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
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
  
  // Calculate border radius (default to half the height for pill shape)
  const calculatedBorderRadius = borderRadius !== undefined ? borderRadius : height / 2;
  
  return (
    <View
      style={[
        styles.container,
        { 
          height, 
          backgroundColor,
          borderRadius: calculatedBorderRadius
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width: progressWidth,
            backgroundColor: progressColor,
            borderRadius: calculatedBorderRadius,
            transform: Platform.OS !== 'web' ? [{ scale: pulseAnim }] : undefined,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
  },
});

export default ProgressBar;