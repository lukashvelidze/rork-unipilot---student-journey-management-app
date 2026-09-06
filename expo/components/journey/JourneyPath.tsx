import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";
import Animated, {
  SharedValue,
  useAnimatedProps,
} from "react-native-reanimated";
import { svgPathProperties } from "svg-path-properties";
import type { JourneyGeometry, JourneyPoint } from "./journeyTypes";
import { JOURNEY_COLORS } from "./journeyTypes";

export const JOURNEY_VIEWBOX_WIDTH = 360;
export const CARD_START_Y = 108;
export const CARD_GAP = 178;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function createJourneyGeometry(
  checklistCount: number,
): JourneyGeometry {
  const count = Math.max(1, checklistCount);
  const destinationY = CARD_START_Y + count * CARD_GAP + 30;
  const height = destinationY + 105;
  const points: Array<{ x: number; y: number }> = [{ x: 58, y: 58 }];

  for (let index = 0; index < count; index += 1) {
    points.push({
      x: index % 2 === 0 ? 304 : 56,
      y: CARD_START_Y + index * CARD_GAP + 76,
    });
  }
  points.push({ x: 302, y: destinationY });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const verticalDistance = to.y - from.y;
    path += ` C ${from.x} ${from.y + verticalDistance * 0.44}, ${to.x} ${
      to.y - verticalDistance * 0.44
    }, ${to.x} ${to.y}`;
  }

  const properties = new svgPathProperties(path);
  const pathLength = properties.getTotalLength();
  const sampleCount = Math.max(160, points.length * 48);
  const samples: JourneyPoint[] = Array.from(
    { length: sampleCount + 1 },
    (_, index) => {
      const distance = (index / sampleCount) * pathLength;
      const point = properties.getPointAtLength(distance);
      const tangent = properties.getTangentAtLength(distance);
      return {
        x: point.x,
        y: point.y,
        angle: (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI,
      };
    },
  );

  for (let index = 1; index < samples.length; index += 1) {
    const previousAngle = samples[index - 1].angle;
    let angle = samples[index].angle;
    while (angle - previousAngle > 180) angle -= 360;
    while (angle - previousAngle < -180) angle += 360;
    samples[index].angle = angle;
  }

  return { path, pathLength, height, samples };
}

interface JourneyPathProps {
  geometry: JourneyGeometry;
  progress: SharedValue<number>;
}

function JourneyPathComponent({ geometry, progress }: JourneyPathProps) {
  const completedProps = useAnimatedProps(() => ({
    strokeDasharray: [
      progress.value * geometry.pathLength,
      geometry.pathLength,
    ],
  }));

  const currentProps = useAnimatedProps(() => ({
    strokeDasharray: [
      Math.min(1, progress.value + 0.055) * geometry.pathLength,
      geometry.pathLength,
    ],
  }));

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${JOURNEY_VIEWBOX_WIDTH} ${geometry.height}`}
      preserveAspectRatio="none"
    >
      <Path
        d={geometry.path}
        fill="none"
        stroke={JOURNEY_COLORS.upcoming}
        strokeWidth={4}
        strokeDasharray="7 10"
        strokeLinecap="round"
      />
      <AnimatedPath
        animatedProps={currentProps}
        d={geometry.path}
        fill="none"
        stroke={JOURNEY_COLORS.coral}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <AnimatedPath
        animatedProps={completedProps}
        d={geometry.path}
        fill="none"
        stroke={JOURNEY_COLORS.blue}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export const JourneyPath = memo(JourneyPathComponent);

