import React, { memo, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Easing, SharedValue, withTiming } from "react-native-reanimated";
import type { Country } from "@/types/user";
import {
  CARD_GAP,
  CARD_START_Y,
  createJourneyGeometry,
  JourneyPath,
} from "./JourneyPath";
import { JourneyPlane } from "./JourneyPlane";
import { MilestoneCard } from "./MilestoneCard";
import { CountryMarker } from "./CountryMarker";
import type { JourneyMilestone } from "./journeyTypes";

interface JourneyMapProps {
  milestones: JourneyMilestone[];
  progress: number;
  origin: Country;
  destination: Country;
  onMilestonePress: (checklistId: string) => void;
  animatedProgress: SharedValue<number>;
}

function JourneyMapComponent({
  milestones,
  progress,
  origin,
  destination,
  onMilestonePress,
  animatedProgress,
}: JourneyMapProps) {
  const geometry = React.useMemo(
    () => createJourneyGeometry(milestones.length),
    [milestones.length],
  );
  const [dimensions, setDimensions] = useState({
    width: 360,
    height: geometry.height,
  });
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      animatedProgress.value = Math.max(0, progress - 0.06);
      hasMounted.current = true;
    }
    animatedProgress.value = withTiming(progress, {
      duration: 1150,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [animatedProgress, progress]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.map, { height: geometry.height }]}
    >
      <View style={StyleSheet.absoluteFill}>
        <JourneyPath geometry={geometry} progress={animatedProgress} />
      </View>
      <JourneyPlane
        geometry={geometry}
        progress={animatedProgress}
        mapWidth={dimensions.width}
        mapHeight={dimensions.height}
      />
      <CountryMarker
        country={origin}
        label="Origin"
        align="left"
        style={styles.origin}
      />
      {milestones.map((milestone, index) => (
        <MilestoneCard
          key={milestone.id}
          milestone={milestone}
          onPress={() => onMilestonePress(milestone.id)}
          style={[
            { top: CARD_START_Y + index * CARD_GAP },
            index % 2 === 0 ? styles.cardLeft : styles.cardRight,
          ]}
        />
      ))}
      <CountryMarker
        country={destination}
        label="Destination"
        align="right"
        style={[styles.destination, { top: geometry.height - 137 }]}
      />
    </View>
  );
}

export const JourneyMap = memo(JourneyMapComponent);

const styles = StyleSheet.create({
  map: {
    width: "100%",
    position: "relative",
  },
  origin: {
    left: 0,
    top: 5,
  },
  destination: {
    right: 0,
  },
  cardLeft: {
    left: 6,
  },
  cardRight: {
    right: 4,
  },
});
