import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  fetchJourneyProgressFromSupabase,
  formatJourneyTierLabel,
} from "@/lib/journeyProgress";
import { openManageSubscription } from "@/lib/subscriptionManager";

const worldMapImage = require("@/assets/images/journey/world-map-figma.png");

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

type NodeState = "done" | "active" | "locked";

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
  const { journeyProgress, setJourneyProgress } = useJourneyStore();
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
          const result = await fetchJourneyProgressFromSupabase();
          if (!isActive) return;

          setUserTier(result.userTier);
          setJourneyProgress(result.progress);
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
    }, [setJourneyProgress, updateUser, userId, userIsPremium, userSubscriptionTier])
  );

  const stages = journeyProgress;
  const contentWidth = Math.min(width, 430);
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

  const currentStage = stages[currentStageIndex];
  const firstName = user?.name?.trim().split(" ")[0] || "there";
  const overallProgress = calculateOverallProgress(stages);

  useEffect(() => {
    shouldStartAtBottomRef.current = true;
  }, [stages.length]);

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

  const promptUpgrade = useCallback((tier?: string) => {
    const label = formatJourneyTierLabel(tier);
    Alert.alert(
      "Upgrade Required",
      `${label} tasks are available on a higher plan. Manage your plan to unlock them.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Manage Subscription",
          onPress: () => {
            openManageSubscription().catch((error) => {
              console.error("Open subscription manager failed", error);
              router.push("/settings");
            });
          },
        },
      ]
    );
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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={worldMapImage}
          style={[
            styles.fixedMapImage,
            {
              left: horizontalOffset - contentWidth * 0.74,
              width: contentWidth * 2.78,
              height: Math.max(height * 1.42, 930),
            },
          ]}
        />
      </View>
      <View style={[styles.header, { width: contentWidth, marginLeft: horizontalOffset }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>Welcome, {firstName}</Text>
            <Text style={styles.subtitle}>Your UniPilot Journey</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Step {stages.length ? currentStageIndex + 1 : 0} of {stages.length || 0}
            </Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
          </View>
          <Text style={styles.milestoneText} numberOfLines={1}>
            {currentStage
              ? `Milestone ${currentStageIndex + 1} of ${stages.length}: ${currentStage.title}`
              : "Milestones will appear after your profile is ready"}
          </Text>
        </View>
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
              <Text style={styles.emptyTitle}>No checklist yet</Text>
              <Text style={styles.emptyDescription}>
                Complete your visa and destination profile to generate your personalized journey.
              </Text>
            </View>
          ) : (
            stages.map((stage, index) => {
              const tierLocked = !canAccessJourneyTier(userTier, stage.subscriptionTier);
              const state: NodeState = stage.completed
                ? "done"
                : (index === currentStageIndex && !tierLocked ? "active" : "locked");

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

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {points.slice(0, -1).map((point, index) => {
        const nextPoint = points[index + 1];
        const controlX = index % 2 === 0
          ? Math.max(point.x, nextPoint.x) + 98
          : Math.min(point.x, nextPoint.x) - 76;
        const controlY = (point.y + nextPoint.y) / 2;

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
    : (state === "locked" ? Lock : (stageIcons[stage.stage] || FileText));
  const completedTasks = stage.tasks.filter((task) => task.completed).length;
  const totalTasks = stage.tasks.length;
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);
  const tag = state === "done" ? "DONE" : (state === "active" ? "ACTIVE" : "LOCKED");
  const tagColor = state === "done" ? SUCCESS : (state === "active" ? PRIMARY : SOFT_MUTED);
  const titleColor = state === "locked" ? "#5E5E6E" : TEXT;
  const iconBackground = state === "done" ? "#E6F9F7" : (state === "active" ? PRIMARY : "#EEEEF4");
  const iconColor = state === "done" ? SUCCESS : (state === "active" ? "#FFFFFF" : SOFT_MUTED);
  const borderColor = state === "done" ? SUCCESS : (state === "active" ? PRIMARY : BORDER);
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
        state === "active" && styles.activeNodeCard,
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
      </View>

      <View style={[
        styles.stepDot,
        {
          backgroundColor: state === "done" ? SUCCESS : (state === "active" ? PRIMARY : "#E0E0EA"),
          right: state === "active" ? -11 : -7,
          top: state === "active" ? 39 : 46,
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
  fixedMapImage: {
    opacity: 0.38,
    position: "absolute",
    top: -118,
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
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
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
  stepBadge: {
    backgroundColor: "#FFF0F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepBadgeText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "700",
  },
  progressBlock: {
    marginTop: 10,
  },
  progressTrack: {
    backgroundColor: BORDER,
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    height: "100%",
  },
  milestoneText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 7,
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
