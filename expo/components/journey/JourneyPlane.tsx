import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Send } from "lucide-react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { JOURNEY_COLORS } from "./journeyTypes";
import {
  JOURNEY_VIEWBOX_WIDTH,
} from "./JourneyPath";
import type { JourneyGeometry } from "./journeyTypes";

interface JourneyPlaneProps {
  geometry: JourneyGeometry;
  progress: SharedValue<number>;
  mapWidth: number;
  mapHeight: number;
}

function JourneyPlaneComponent({
  geometry,
  progress,
  mapWidth,
  mapHeight,
}: JourneyPlaneProps) {
  const float = useSharedValue(0);
  const inputRange = geometry.samples.map(
    (_, index) => index / (geometry.samples.length - 1),
  );
  const xRange = geometry.samples.map((sample) => sample.x);
  const yRange = geometry.samples.map((sample) => sample.y);
  const angleRange = geometry.samples.map((sample) => sample.angle);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [float]);

  const planeStyle = useAnimatedStyle(() => {
    const x = interpolate(
      progress.value,
      inputRange,
      xRange,
      Extrapolation.CLAMP,
    );
    const y = interpolate(
      progress.value,
      inputRange,
      yRange,
      Extrapolation.CLAMP,
    );
    const angle = interpolate(
      progress.value,
      inputRange,
      angleRange,
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: (x / JOURNEY_VIEWBOX_WIDTH) * mapWidth - 20 },
        {
          translateY:
            (y / geometry.height) * mapHeight -
            20 +
            (float.value - 0.5) * 3,
        },
        // Lucide's paper plane points 45° up-right in its own artwork.
        { rotate: `${angle + 45}deg` },
      ],
    };
  }, [mapHeight, mapWidth]);

  return (
    <Animated.View pointerEvents="none" style={[styles.plane, planeStyle]}>
      <View style={styles.shadow} />
      <View style={styles.paperPlane}>
        <Send
          size={27}
          color={JOURNEY_COLORS.coral}
          fill="#FFFFFF"
          strokeWidth={2}
        />
      </View>
    </Animated.View>
  );
}

export const JourneyPlane = memo(JourneyPlaneComponent);

const styles = StyleSheet.create({
  plane: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  shadow: {
    position: "absolute",
    width: 24,
    height: 10,
    borderRadius: 12,
    backgroundColor: "#5B6574",
    opacity: 0.12,
    transform: [{ translateY: 8 }],
  },
  paperPlane: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#526279",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4,
  },
});
