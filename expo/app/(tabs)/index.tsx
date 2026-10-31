import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  Lock,
  Plane,
  Target,
} from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { useAppStateStore } from "@/store/appStateStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { JourneyProgress, JourneyStage, SubscriptionTier } from "@/types/user";
import { calculateOverallProgress } from "@/utils/helpers";
import {
  canAccessJourneyTier,
  ensureUniversityRoutes,
  fetchJourneysWithProgress,
} from "@/lib/journeyProgress";
import UniversityStrip from "@/components/journey/UniversityStrip";

const worldMapImage = require("@/assets/images/journey/world-map.png");
// The map art is a 1.6:1 world map; x ≈ MAP_X_AT_GREENWICH + longitude * MAP_X_PER_DEGREE
// (fractions of its width).
const MAP_ASPECT = 1.6;
const MAP_X_AT_GREENWICH = 0.4785;
const MAP_X_PER_DEGREE = 0.002725;
// Rough longitude of each destination, to centre the map on it.
const DESTINATION_LONGITUDE: Record<string, number> = {
  AL: 20, AM: 45, AT: 14, AU: 134, BR: -52, CA: -100, DE: 10, EG: 30, FI: 26, FR: 2,
  GB: -2, GE: 43, GH: -1, GR: 22, HK: 114, HU: 19, ID: 118, NE: 5, NG: 8, PH: 122,
  TR: 35, UAE: 54, US: -98,
};

const PRIMARY = "#FF6B6B";
const SUCCESS = "#2EC4B6";
const TEXT = "#1A1A1A";
const MUTED = "#8888A0";
const SOFT_MUTED = "#A0A0B0";
const BORDER = "#EEEEF2";

const BASE_CANVAS_WIDTH = 402;
const BASE_NODE_SLOTS = [
  { left: 24, top: 500, width: 150 },
  { left: 193, top: 318, width: 168 },
  { left: 28, top: 184, width: 148 },
  { left: 208, top: 62, width: 148 },
];

type NodeSlot = {
  left: number;
  top: number;
  width: number;
};

// "pro": the student's next stage is a Pro stage; it invites them to unlock it.
type NodeState = "done" | "active" | "pro" | "locked";

const stageIcons: Record<JourneyStage, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  research: BookOpen,
  application: Target,
  visa: Plane,
  pre_departure: FileText,
  arrival: HomeIcon,
  academic: GraduationCap,
  career: Briefcase,
};

export default function HomeScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { width, height } = useWindowDimensions();
  const { user, updateUser } = useUserStore();
  const authInitializing = useUserStore((state) => state.authInitializing);
  const { inCriticalFlow } = useAppStateStore();
  const { journeyProgress, setJourneys, journeys, activeJourneyKey, setActiveJourneyKey } =
    useJourneyStore();
  const [userTier, setUserTier] = useState<string>(user?.subscriptionTier || "free");
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const shouldStartAtBottomRef = useRef(true);
  const userId = user?.id;
  const userSubscriptionTier = user?.subscriptionTier || "free";
  const userIsPremium = user?.isPremium || false;

  useEffect(() => {
    if (inCriticalFlow || authInitializing) return;

    if (!user || !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [authInitializing, inCriticalFlow, router, user]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refreshJourney = async () => {
        if (!userId) return;

        setIsJourneyLoading(true);
        try {
          const result = await fetchJourneysWithProgress();
          if (!isActive) return;

          setUserTier(result.userTier);
          setJourneys(result.journeys);
          ensureUniversityRoutes(result.journeys);
          if (userSubscriptionTier !== result.userTier || userIsPremium !== (result.userTier !== "free")) {
            updateUser({
              subscriptionTier: result.userTier as SubscriptionTier,
              isPremium: result.userTier !== "free",
            });
          }
        } catch (error) {
          console.error("Failed to load homepage journey:", error);
        } finally {
          if (isActive) {
            setIsJourneyLoading(false);
          }
        }
      };

      refreshJourney();

      return () => {
        isActive = false;
      };
    }, [setJourneys, updateUser, userId, userIsPremium, userSubscriptionTier])
  );

  const stages = journeyProgress;
  const contentWidth = Math.min(width, 430);
  // Fill the screen height at the map's true proportions (wider than the
  // screen), centred on the destination being viewed.
  const mapHeight = Math.max(height, width / MAP_ASPECT);
  const mapWidth = mapHeight * MAP_ASPECT;
  const horizontalOffset = Math.max((width - contentWidth) / 2, 0);
  const scale = contentWidth / BASE_CANVAS_WIDTH;
  const extraStageCount = Math.max(0, stages.length - BASE_NODE_SLOTS.length);
  const baseCanvasHeight = 650 + extraStageCount * 156;
  const canvasHeight = baseCanvasHeight * scale;

  const currentStageIndex = useMemo(() => {
    const accessibleIncompleteIndex = stages.findIndex((stage) => {
      return !stage.completed && canAccessJourneyTier(userTier, stage.subscriptionTier);
    });
    if (accessibleIncompleteIndex >= 0) return accessibleIncompleteIndex;

    const incompleteIndex = stages.findIndex((stage) => !stage.completed);
    if (incompleteIndex >= 0) return incompleteIndex;

    return Math.max(stages.length - 1, 0);
  }, [stages, userTier]);

  const firstName = user?.name?.trim().split(" ")[0] || "there";
  const activeJourney = journeys.find((journey) => journey.key === activeJourneyKey) || null;
  const mapCountry = (activeJourney?.destinationCountryCode || user?.destinationCountry?.code || "").toUpperCase();
  const mapLongitude = DESTINATION_LONGITUDE[mapCountry] ?? 20;
  const mapLeft = Math.min(
    0,
    Math.max(width - mapWidth, width / 2 - (MAP_X_AT_GREENWICH + mapLongitude * MAP_X_PER_DEGREE) * mapWidth),
  );
  const mapOffset = useRef(new Animated.Value(mapLeft)).current;
  useEffect(() => {
    Animated.spring(mapOffset, {
      toValue: mapLeft,
      damping: 22,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  }, [mapLeft, mapOffset]);
  const activeUniversityName = activeJourney?.journey?.university?.name || null;
  const isActiveJourneyPreparing =
    !!activeUniversityName && activeJourney?.source !== "university" && stages.length > 0;
  const overallProgress = calculateOverallProgress(stages);

  useEffect(() => {
    shouldStartAtBottomRef.current = true;
  }, [stages.length, activeJourneyKey]);

  const getNodeSlot = useCallback((index: number): NodeSlot => {
    const topOffset = extraStageCount * 156;

    if (index < BASE_NODE_SLOTS.length) {
      const slot = BASE_NODE_SLOTS[index];
      return {
        left: horizontalOffset + slot.left * scale,
        top: (slot.top + topOffset) * scale,
        width: slot.width,
      };
    }

    const extraIndex = index - BASE_NODE_SLOTS.length;
    const isLeft = index % 2 === 0;
    const top = 62 + (extraStageCount - extraIndex - 1) * 156;
    return {
      left: horizontalOffset + (isLeft ? 26 * scale : 202 * scale),
      top: top * scale,
      width: isLeft ? 150 : 168,
    };
  }, [extraStageCount, horizontalOffset, scale]);

  // Pro stages open the paywall directly: it explains exactly what unlocking adds.
  const promptUpgrade = useCallback((_tier?: string) => {
    router.push("/premium" as any);
  }, [router]);

  const openStage = useCallback((stage: JourneyProgress) => {
    if (!canAccessJourneyTier(userTier, stage.subscriptionTier)) {
      promptUpgrade(stage.subscriptionTier);
      return;
    }

    router.push(`/journey/${stage.id}` as any);
  }, [promptUpgrade, router, userTier]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator color={PRIMARY} />
        <Text style={styles.loadingText}>Setting up your journey...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mapClip]}>
        <Animated.Image
          accessibilityIgnoresInvertColors
          resizeMode="stretch"
          source={worldMapImage}
          style={[
            styles.fixedMapImage,
            { height: mapHeight, width: mapWidth, transform: [{ translateX: mapOffset }] },
          ]}
        />
      </View>
      <View style={[styles.header, { width: contentWidth, marginLeft: horizontalOffset }]}>
        <Text style={styles.title} numberOfLines={1}>Welcome, {firstName}</Text>
        <Text style={styles.subtitle}>Your UniPilot Journey</Text>

        <View
          accessibilityLabel={`${overallProgress} percent of this journey complete`}
          accessibilityRole="progressbar"
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
        </View>

        <UniversityStrip
          activeKey={activeJourneyKey}
          journeys={journeys}
          onAdd={() => router.push("/onboarding/step-universities?mode=manage" as any)}
          onSelect={(key) => {
            // Tapping the university already shown opens its details page.
            const universityId = journeys.find((j) => j.key === key)?.journey?.university?.id;
            if (key === activeJourneyKey && universityId) {
              router.push(`/university/${universityId}` as any);
              return;
            }
            setActiveJourneyKey(key);
          }}
          style={styles.universityStrip}
        />

        {isActiveJourneyPreparing ? (
          <View style={styles.preparingNote}>
            <ActivityIndicator color="#F5A524" size="small" style={styles.preparingSpinner} />
            <Text numberOfLines={1} style={styles.preparingText}>
              Preparing your {activeUniversityName.replace(/^the\s+/i, "")} roadmap…
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (!shouldStartAtBottomRef.current) return;
          shouldStartAtBottomRef.current = false;
          requestAnimationFrame(() => {
            scrollRef.current?.scrollToEnd({ animated: false });
          });
        }}
      >
        <View style={[styles.mapCanvas, { height: canvasHeight }]}>
          {stages.length > 1 && (
            <JourneyPathLayer
              stages={stages}
              activeIndex={currentStageIndex}
              getNodeSlot={getNodeSlot}
              width={width}
              height={canvasHeight}
            />
          )}

          {isJourneyLoading && stages.length === 0 ? (
            <View style={[styles.emptyState, { width: contentWidth - 48, marginLeft: horizontalOffset + 24 }]}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={styles.emptyTitle}>Loading your roadmap...</Text>
            </View>
          ) : stages.length === 0 ? (
            <View style={[styles.emptyState, { width: contentWidth - 48, marginLeft: horizontalOffset + 24 }]}>
              <Text style={styles.emptyTitle}>
                {activeUniversityName ? "Building your journey" : "No checklist yet"}
              </Text>
              <Text style={styles.emptyDescription}>
                {activeUniversityName
                  ? `We're putting together your ${activeUniversityName} roadmap. This usually takes a few minutes.`
                  : "Complete your visa and destination profile to generate your personalized journey."}
              </Text>
            </View>
          ) : (
            stages.map((stage, index) => {
              const tierLocked = !canAccessJourneyTier(userTier, stage.subscriptionTier);
              const state: NodeState = stage.completed
                ? "done"
                : index === currentStageIndex
                  ? (tierLocked ? "pro" : "active")
                  : "locked";

              return (
                <JourneyNode
                  key={stage.id}
                  index={index}
                  slot={getNodeSlot(index)}
                  stage={stage}
                  state={state}
                  onPress={() => openStage(stage)}
                />
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function JourneyPathLayer({
  stages,
  activeIndex,
  getNodeSlot,
  width,
  height,
}: {
  stages: JourneyProgress[];
  activeIndex: number;
  getNodeSlot: (index: number) => NodeSlot;
  width: number;
  height: number;
}) {
  const points = stages.map((_, index) => getDotPoint(getNodeSlot(index), index));
  const controlFor = (index: number) => {
    const point = points[index];
    const nextPoint = points[index + 1];
    return {
      x: index % 2 === 0
        ? Math.max(point.x, nextPoint.x) + 98
        : Math.min(point.x, nextPoint.x) - 76,
      y: (point.y + nextPoint.y) / 2,
    };
  };

  // The plane flies the leg into the active stage; before any progress it
  // sits just after the first stage.
  const planeSegment = activeIndex > 0 ? activeIndex - 1 : 0;
  let plane: { x: number; y: number; angle: number } | null = null;
  if (points.length > 1) {
    const p0 = points[planeSegment];
    const p1 = points[planeSegment + 1];
    const c = controlFor(planeSegment);
    const at = (t: number) => {
      const u = 1 - t;
      return {
        x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
        y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
        angle:
          (Math.atan2(
            2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y),
            2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x),
          ) * 180) / Math.PI,
      };
    };
    // Cards sit on top of the route, so fly the plane through the stretch of
    // this leg that is furthest from every card (and from the screen edges),
    // leaning towards the middle of the leg.
    const cards = stages.map((_, index) => getNodeSlot(index));
    // Distance from the plane badge's edge (not its centre) to the nearest obstacle.
    const radius = PLANE_SIZE / 2;
    const clearance = (x: number, y: number) =>
      Math.min(
        x - radius - PLANE_MARGIN,
        width - PLANE_MARGIN - radius - x,
        ...cards.map((slot) => {
          const dx = Math.max(slot.left - x, 0, x - (slot.left + slot.width));
          const dy = Math.max(slot.top - y, 0, y - (slot.top + NODE_CARD_HEIGHT));
          return Math.hypot(dx, dy) - radius;
        }),
      );
    let best = at(0.5);
    let bestScore = -Infinity;
    for (let t = 0.15; t <= 0.85; t += 0.05) {
      const candidate = at(t);
      const score = Math.min(clearance(candidate.x, candidate.y), 40) - Math.abs(t - 0.5) * 20;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    plane = best;
  }

  return (
    <>
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.slice(0, -1).map((point, index) => {
        const nextPoint = points[index + 1];
        const { x: controlX, y: controlY } = controlFor(index);

        return (
          <Path
            key={`${point.x}-${point.y}-${nextPoint.x}-${nextPoint.y}`}
            d={`M ${point.x} ${point.y} Q ${controlX} ${controlY} ${nextPoint.x} ${nextPoint.y}`}
            stroke={index < activeIndex ? PRIMARY : "#DADAE4"}
            strokeWidth={1}
            strokeDasharray="8 10"
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </Svg>
    {plane ? <PathPlane angle={plane.angle} x={plane.x} y={plane.y} /> : null}
    </>
  );
}

const PLANE_SIZE = 30;
// Minimal airliner pointing right (0°), for platforms without SF Symbols.
const PLANE_PATH =
  "M21.5 12c0-.8-.7-1.4-1.5-1.4h-5.1L10.2 3H8l2.4 7.6H5.6L3.9 8H2.3l1.2 4-1.2 4h1.6l1.7-2.6h4.8L8 21h2.2l4.7-7.6H20c.8 0 1.5-.6 1.5-1.4z";
const PLANE_MARGIN = 9;
// Approximate rendered height of a stage card on the map.
const NODE_CARD_HEIGHT = 160;

/** A minimal coral airliner flying the route, with a fine dashed contrail. */
function PathPlane({ x, y, angle }: { x: number; y: number; angle: number }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const radians = (angle * Math.PI) / 180;
  const travel = drift.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  // Dashes trailing behind the tail, fading out.
  const contrail = [
    { distance: 19, opacity: 0.55 },
    { distance: 28, opacity: 0.35 },
    { distance: 37, opacity: 0.18 },
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        height: PLANE_SIZE,
        left: x - PLANE_SIZE / 2,
        position: "absolute",
        top: y - PLANE_SIZE / 2,
        width: PLANE_SIZE,
        transform: [
          // Nudge back and forth along the direction of travel.
          { translateX: Animated.multiply(travel, Math.cos(radians)) },
          { translateY: Animated.multiply(travel, Math.sin(radians)) },
        ],
      }}
    >
      {contrail.map((dash) => (
        <View
          key={dash.distance}
          style={[
            styles.contrailDash,
            {
              left: PLANE_SIZE / 2 - Math.cos(radians) * dash.distance - 3.5,
              opacity: dash.opacity,
              top: PLANE_SIZE / 2 - Math.sin(radians) * dash.distance - 1,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      ))}
      <View style={[styles.pathPlane, { transform: [{ rotate: `${angle}deg` }] }]}>
        {Platform.OS === "ios" ? (
          <SymbolView name="airplane" size={24} tintColor={PRIMARY} type="monochrome" weight="semibold" />
        ) : (
          <Svg height={24} viewBox="0 0 24 24" width={24}>
            <Path d={PLANE_PATH} fill={PRIMARY} />
          </Svg>
        )}
      </View>
    </Animated.View>
  );
}

function getDotPoint(slot: NodeSlot, index: number) {
  const pointOffsets = [
    { x: slot.width - 6, y: 68 },
    { x: slot.width - 2, y: 50 },
    { x: slot.width + 2, y: 58 },
    { x: slot.width - 6, y: 38 },
  ];
  const offset = pointOffsets[index % pointOffsets.length];

  return {
    x: slot.left + offset.x,
    y: slot.top + offset.y,
  };
}

function JourneyNode({
  stage,
  index,
  slot,
  state,
  onPress,
}: {
  stage: JourneyProgress;
  index: number;
  slot: NodeSlot;
  state: NodeState;
  onPress: () => void;
}) {
  const Icon = state === "done"
    ? Check
    : (state === "locked" || state === "pro" ? Lock : (stageIcons[stage.stage] || FileText));
  const completedTasks = stage.tasks.filter((task) => task.completed).length;
  const totalTasks = stage.tasks.length;
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);
  const tag = state === "done" ? "DONE" : state === "active" ? "ACTIVE" : state === "pro" ? "PRO" : "LOCKED";
  const tagColor = state === "done" ? SUCCESS : (state === "active" || state === "pro" ? PRIMARY : SOFT_MUTED);
  const titleColor = state === "locked" ? "#5E5E6E" : TEXT;
  const iconBackground =
    state === "done" ? "#E6F9F7" : state === "active" ? PRIMARY : state === "pro" ? "#FFECEC" : "#EEEEF4";
  const iconColor =
    state === "done" ? SUCCESS : state === "active" ? "#FFFFFF" : state === "pro" ? PRIMARY : SOFT_MUTED;
  const borderColor = state === "done" ? SUCCESS : (state === "active" || state === "pro" ? PRIMARY : BORDER);
  const subtitle = stage.description
    || (stage.completed ? "Milestone complete" : `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} remaining`);

  return (
    <TouchableOpacity
      style={[
        styles.nodeCard,
        {
          left: slot.left,
          top: slot.top,
          width: slot.width,
          borderColor,
        },
        (state === "active" || state === "pro") && styles.activeNodeCard,
        state === "done" && styles.completedNodeCard,
        state === "locked" && styles.futureNodeCard,
      ]}
      onPress={onPress}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={`Open ${stage.title}`}
    >
      <View style={styles.nodeGlassClip}>
        <BlurView intensity={Platform.OS === "ios" ? 32 : 18} tint="light" style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.nodeInner}>
        <View style={styles.nodeIconRow}>
          <View style={[styles.nodeIconCircle, { backgroundColor: iconBackground }]}>
            <Icon size={18} color={iconColor} strokeWidth={state === "done" ? 3 : 2.3} />
          </View>
          <View style={[styles.nodeTag, { backgroundColor: `${tagColor}14` }]}>
            <Text style={[styles.nodeTagText, { color: tagColor }]}>{tag}</Text>
          </View>
        </View>

        <Text style={[styles.nodeTitle, { color: titleColor }]} numberOfLines={2}>
          {stage.title}
        </Text>
        <Text style={[styles.nodeSubtitle, state === "locked" && styles.lockedNodeSubtitle]} numberOfLines={2}>
          {subtitle}
        </Text>

        {state === "active" && (
          <View style={styles.continueButton}>
            <Text style={styles.continueText}>Continue</Text>
            <ArrowRight size={13} color="#FFFFFF" strokeWidth={3} />
          </View>
        )}
        {state === "pro" && (
          <View style={styles.continueButton}>
            <Text style={styles.continueText}>Unlock with Pro</Text>
          </View>
        )}
      </View>

      <View style={[
        styles.stepDot,
        {
          backgroundColor: state === "done" ? SUCCESS : (state === "active" || state === "pro" ? PRIMARY : "#E0E0EA"),
          right: state === "active" || state === "pro" ? -11 : -7,
          top: state === "active" || state === "pro" ? 39 : 46,
        },
      ]}>
        <Text style={[styles.stepDotText, state === "locked" && styles.lockedStepDotText]}>{index + 1}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mapClip: {
    overflow: "hidden",
  },
  fixedMapImage: {
    left: 0,
    opacity: 0.38,
    position: "absolute",
    top: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    zIndex: 2,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  progressTrack: {
    backgroundColor: BORDER,
    borderRadius: 999,
    height: 6,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    height: "100%",
  },
  universityStrip: {
    marginTop: 10,
  },
  preparingNote: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,248,235,0.95)",
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  preparingSpinner: {
    transform: [{ scale: 0.75 }],
  },
  preparingText: {
    color: "#8A5A00",
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 15,
  },
  contrailDash: {
    backgroundColor: PRIMARY,
    borderRadius: 1,
    height: 2,
    position: "absolute",
    width: 7,
  },
  pathPlane: {
    alignItems: "center",
    height: PLANE_SIZE,
    justifyContent: "center",
    // A soft coral glow lifts the plane off the map without a backing shape.
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    width: PLANE_SIZE,
  },
  mapCanvas: {
    marginTop: 0,
    overflow: "visible",
    position: "relative",
  },
  emptyState: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginTop: 170,
    padding: 20,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  nodeCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "visible",
    position: "absolute",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  nodeGlassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: "hidden",
  },
  activeNodeCard: {
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  completedNodeCard: {
    borderWidth: 1.25,
  },
  futureNodeCard: {
    opacity: 0.68,
  },
  nodeInner: {
    gap: 6,
    padding: 14,
  },
  nodeIconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  nodeIconCircle: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  nodeTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nodeTagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0,
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  nodeSubtitle: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 15,
  },
  lockedNodeSubtitle: {
    color: SOFT_MUTED,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 10,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 3,
    paddingVertical: 7,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  stepDot: {
    alignItems: "center",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    width: 22,
  },
  stepDotText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  lockedStepDotText: {
    color: SOFT_MUTED,
  },
});
