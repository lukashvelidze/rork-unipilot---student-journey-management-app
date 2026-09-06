import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Map } from "lucide-react-native";
import { svgPathProperties } from "svg-path-properties";
import worldMap from "@svg-maps/world";
import type { Country } from "@/types/user";
import { JOURNEY_COLORS } from "./journeyTypes";

interface CountryMarkerProps {
  country: Country;
  label: "Origin" | "Destination";
  align: "left" | "right";
  style?: object;
}

const getSilhouette = (countryCode: string) => {
  const location = worldMap.locations.find(
    (candidate: { id: string }) =>
      candidate.id === countryCode.toLowerCase(),
  );
  if (!location) return null;

  try {
    const properties = new svgPathProperties(location.path);
    const length = properties.getTotalLength();
    const points = Array.from({ length: 241 }, (_, index) =>
      properties.getPointAtLength((index / 240) * length),
    );
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const padding = Math.max(width, height) * 0.12;

    return {
      path: location.path,
      viewBox: `${minX - padding} ${minY - padding} ${
        width + padding * 2
      } ${height + padding * 2}`,
    };
  } catch {
    return null;
  }
};

function CountryMarkerComponent({
  country,
  label,
  align,
  style,
}: CountryMarkerProps) {
  const silhouette = useMemo(
    () => getSilhouette(country.code),
    [country.code],
  );
  const isDestination = label === "Destination";
  const accent = isDestination
    ? JOURNEY_COLORS.coral
    : JOURNEY_COLORS.blue;

  return (
    <View
      style={[
        styles.container,
        align === "right" && styles.rightAligned,
        style,
      ]}
    >
      <View style={[styles.silhouette, { backgroundColor: `${accent}12` }]}>
        {silhouette ? (
          <Svg width={48} height={38} viewBox={silhouette.viewBox}>
            <Path d={silhouette.path} fill={accent} />
          </Svg>
        ) : (
          <Map size={30} color={accent} strokeWidth={1.6} />
        )}
      </View>
      <View style={[styles.copy, align === "right" && styles.copyRight]}>
        <Text style={styles.eyebrow}>{label}</Text>
        <Text numberOfLines={1} style={styles.countryName}>
          {country.flag ? `${country.flag} ` : ""}
          {country.name}
        </Text>
      </View>
    </View>
  );
}

export const CountryMarker = memo(CountryMarkerComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 12,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 178,
  },
  rightAligned: {
    flexDirection: "row-reverse",
  },
  silhouette: {
    width: 62,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#EEF4FA",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#617189",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  eyebrow: {
    color: JOURNEY_COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  countryName: {
    color: JOURNEY_COLORS.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
    maxWidth: 104,
  },
  copy: {
    marginLeft: 9,
  },
  copyRight: {
    alignItems: "flex-end",
    marginLeft: 0,
    marginRight: 9,
  },
});
