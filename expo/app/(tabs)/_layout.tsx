import React, { useCallback, useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ACTIVE_COLOR = "#E07A5F";
const INACTIVE_COLOR = "#7D8492";
const DOCK_HEIGHT = 84;
const DOCK_PADDING = 8;

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type TabDetails = {
  defaultFallback: IoniconName;
  defaultSymbol: SFSymbol;
  label: string;
  selectedFallback: IoniconName;
  selectedSymbol: SFSymbol;
};

const TAB_DETAILS: Record<string, TabDetails> = {
  index: {
    defaultFallback: "paper-plane-outline",
    defaultSymbol: "paperplane",
    label: "Journey",
    selectedFallback: "paper-plane",
    selectedSymbol: "paperplane.fill",
  },
  journey: {
    defaultFallback: "checkmark-circle-outline",
    defaultSymbol: "checkmark.circle",
    label: "Tasks",
    selectedFallback: "checkmark-circle",
    selectedSymbol: "checkmark.circle.fill",
  },
  premium: {
    defaultFallback: "documents-outline",
    defaultSymbol: "doc.on.doc",
    label: "Resources",
    selectedFallback: "documents",
    selectedSymbol: "doc.on.doc.fill",
  },
  profile: {
    defaultFallback: "person-circle-outline",
    defaultSymbol: "person.crop.circle",
    label: "Profile",
    selectedFallback: "person-circle",
    selectedSymbol: "person.crop.circle.fill",
  },
};

type RefinedTabIconProps = {
  details: TabDetails;
  focused: boolean;
};

function RefinedTabIcon({ details, focused }: RefinedTabIconProps) {
  const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  const fallbackName = focused
    ? details.selectedFallback
    : details.defaultFallback;

  return (
    <SymbolView
      fallback={<Ionicons color={color} name={fallbackName} size={25} />}
      name={focused ? details.selectedSymbol : details.defaultSymbol}
      resizeMode="scaleAspectFit"
      size={25}
      style={styles.symbol}
      tintColor={color}
      type={focused ? "hierarchical" : "monochrome"}
      weight={focused ? "semibold" : "regular"}
    />
  );
}

type GlassTabButtonProps = {
  accessibilityLabel: string;
  details: TabDetails;
  focused: boolean;
  onLongPress: () => void;
  onPress: () => void;
  testID?: string;
};

function GlassTabButton({
  accessibilityLabel,
  details,
  focused,
  onLongPress,
  onPress,
  testID,
}: GlassTabButtonProps) {
  const reducedMotion = useReducedMotion();
  const activeProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    activeProgress.value = reducedMotion
      ? focused
        ? 1
        : 0
      : withTiming(focused ? 1 : 0, {
          duration: 220,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
  }, [activeProgress, focused, reducedMotion]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.97 + activeProgress.value * 0.08 },
      { translateY: -activeProgress.value },
    ],
  }));
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + activeProgress.value * 0.28,
    transform: [{ translateY: -activeProgress.value }],
  }));

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      hitSlop={4}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        pressed ? styles.tabButtonPressed : null,
      ]}
      testID={testID}
    >
      <Animated.View style={[styles.iconStage, iconAnimatedStyle]}>
        <RefinedTabIcon details={details} focused={focused} />
      </Animated.View>

      <Animated.Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          { color: focused ? ACTIVE_COLOR : INACTIVE_COLOR },
          focused ? styles.activeTabLabel : null,
          labelAnimatedStyle,
        ]}
      >
        {details.label}
      </Animated.Text>
    </Pressable>
  );
}

function GlassTabBar({
  descriptors,
  navigation,
  state,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [dockWidth, setDockWidth] = useState(0);
  const visibleRoutes = state.routes.filter((route) => TAB_DETAILS[route.name]);
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(
    visibleRoutes.findIndex((route) => route.key === activeRouteKey),
    0,
  );
  const buttonWidth =
    dockWidth > 0 ? (dockWidth - DOCK_PADDING * 2) / visibleRoutes.length : 0;
  const indicatorPosition = useSharedValue(activeIndex);
  const dockBottom = Math.max(insets.bottom - 8, 16);

  useEffect(() => {
    indicatorPosition.value = reducedMotion
      ? activeIndex
      : withTiming(activeIndex, {
          duration: 260,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
  }, [activeIndex, indicatorPosition, reducedMotion]);

  const indicatorAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: buttonWidth > 0 ? 1 : 0,
      transform: [{ translateX: indicatorPosition.value * buttonWidth }],
    }),
    [buttonWidth],
  );

  const handleDockLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number } } }) => {
      const nextWidth = event.nativeEvent.layout.width;
      setDockWidth((currentWidth) =>
        Math.abs(currentWidth - nextWidth) < 0.5 ? currentWidth : nextWidth,
      );
    },
    [],
  );

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarFrame, { bottom: dockBottom }]}
    >
      <View onLayout={handleDockLayout} style={styles.dockShadow}>
        <View style={styles.dockMaterial}>
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={Platform.OS === "ios" ? 68 : 48}
            style={StyleSheet.absoluteFill}
            tint="systemChromeMaterialLight"
          />
          <View pointerEvents="none" style={styles.dockTint} />
          <View pointerEvents="none" style={styles.dockBorder} />
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            { width: buttonWidth },
            indicatorAnimatedStyle,
          ]}
        >
          <View style={styles.activeBloom} />
          <View style={styles.activePillHighlight} />
        </Animated.View>

        <View style={styles.tabRow}>
          {visibleRoutes.map((route) => {
            const details = TAB_DETAILS[route.name];
            const options = descriptors[route.key].options;
            const focused = activeRouteKey === route.key;

            const handlePress = () => {
              const event = navigation.emit({
                canPreventDefault: true,
                target: route.key,
                type: "tabPress",
              });

              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => undefined);
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <GlassTabButton
                accessibilityLabel={
                  options.tabBarAccessibilityLabel || details.label
                }
                details={details}
                focused={focused}
                key={route.key}
                onLongPress={() =>
                  navigation.emit({
                    target: route.key,
                    type: "tabLongPress",
                  })
                }
                onPress={handlePress}
                testID={options.tabBarButtonTestID}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const Colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        freezeOnBlur: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowColor: "transparent",
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: "600",
        },
        lazy: true,
        sceneStyle: {
          backgroundColor: Colors.background,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Journey",
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          headerShown: false,
          title: "Tasks",
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          headerShown: false,
          title: "Resources",
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          headerShown: false,
          href: null,
          title: "Documents",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarFrame: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  dockShadow: {
    borderRadius: 36,
    height: DOCK_HEIGHT,
    maxWidth: 448,
    shadowColor: "#464C59",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "92%",
    ...Platform.select({
      android: { elevation: 14 },
      web: { boxShadow: "0 14px 40px rgba(70, 76, 89, 0.18)" },
    }),
  },
  dockMaterial: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    overflow: "hidden",
  },
  dockTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(247, 248, 251, 0.78)",
  },
  dockBorder: {
    ...StyleSheet.absoluteFillObject,
    borderColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 36,
    borderWidth: 1,
  },
  activePill: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 28,
    borderWidth: 1,
    bottom: DOCK_PADDING,
    left: DOCK_PADDING,
    overflow: "hidden",
    position: "absolute",
    shadowColor: "#5B6170",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    top: DOCK_PADDING,
  },
  activeBloom: {
    backgroundColor: "rgba(224, 122, 95, 0.07)",
    borderRadius: 24,
    bottom: 5,
    left: 18,
    position: "absolute",
    right: 18,
    top: 5,
  },
  activePillHighlight: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 999,
    height: 1,
    left: 13,
    position: "absolute",
    right: 13,
    top: 1,
  },
  tabRow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "stretch",
    flexDirection: "row",
    padding: DOCK_PADDING,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 28,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  tabButtonPressed: {
    opacity: 0.68,
  },
  iconStage: {
    alignItems: "center",
    height: 27,
    justifyContent: "center",
  },
  symbol: {
    height: 27,
    width: 27,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: "500",
    letterSpacing: 0.08,
    lineHeight: 15,
    marginTop: 5,
    textAlign: "center",
  },
  activeTabLabel: {
    fontWeight: "600",
  },
});
