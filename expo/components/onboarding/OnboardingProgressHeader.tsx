import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface OnboardingProgressHeaderProps {
  progress: number;
  onBack: () => void;
}

export default function OnboardingProgressHeader({
  progress,
  onBack,
}: OnboardingProgressHeaderProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const reducedMotion = useReducedMotion();
  const animatedProgress = useSharedValue(
    Math.max(0, clampedProgress - 0.2),
  );
  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  useEffect(() => {
    animatedProgress.value = reducedMotion
      ? clampedProgress
      : withTiming(clampedProgress, {
          duration: 520,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
  }, [animatedProgress, clampedProgress, reducedMotion]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.65}
        onPress={onBack}
        style={styles.backButton}
        testID="onboarding-back-button"
      >
        <ArrowLeft color="#111827" size={25} strokeWidth={1.8} />
      </TouchableOpacity>

      <View
        accessibilityLabel={`${Math.round(clampedProgress * 100)} percent complete`}
        accessibilityRole="progressbar"
        style={styles.track}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 2,
  },
  backButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginLeft: -8,
    width: 40,
  },
  track: {
    backgroundColor: "#E0E0E0",
    borderRadius: 99,
    height: 6,
    marginTop: 8,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    backgroundColor: "#FF6B6B",
    borderRadius: 99,
    height: "100%",
  },
});
