import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSharedValue } from "react-native-reanimated";
import { useUserStore } from "@/store/userStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useColors } from "@/hooks/useColors";
import { JourneyMap } from "@/components/journey/JourneyMap";
import {
  getJourneyProgress,
  toJourneyMilestones,
} from "@/components/journey/JourneyProgress";
import { JOURNEY_COLORS } from "@/components/journey/journeyTypes";
import { loadJourneyProgress } from "@/lib/journeyProgress";

export default function HomeScreen() {
  const router = useRouter();
  const Colors = useColors();
  const user = useUserStore((state) => state.user);
  const journeyProgress = useJourneyStore((state) => state.journeyProgress);
  const setJourneyProgress = useJourneyStore(
    (state) => state.setJourneyProgress,
  );
  const [isLoading, setIsLoading] = useState(journeyProgress.length === 0);

  const milestones = useMemo(
    () => toJourneyMilestones(journeyProgress),
    [journeyProgress],
  );
  const progress = useMemo(
    () => getJourneyProgress(journeyProgress),
    [journeyProgress],
  );
  const animatedProgress = useSharedValue(progress);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      loadJourneyProgress()
        .then(({ progress: latestProgress }) => {
          if (active) setJourneyProgress(latestProgress);
        })
        .catch((error) => {
          console.error("Failed to refresh Home journey:", error);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });

      return () => {
        active = false;
      };
    }, [setJourneyProgress, user?.destinationCountry.code, user?.id]),
  );

  const handleChecklistPress = useCallback(
    (checklistId: string) => {
      Haptics.selectionAsync().catch(() => undefined);
      router.push(`/journey/${checklistId}`);
    },
    [router],
  );

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.loading, { backgroundColor: Colors.background }]}
      >
        <Text style={[styles.loadingText, { color: Colors.lightText }]}>
          Setting up your journey…
        </Text>
      </SafeAreaView>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || "Explorer";
  const percent = Math.round(progress * 100);
  const firstIncompleteIndex = journeyProgress.findIndex(
    (checklist) => !checklist.completed,
  );
  const currentStep =
    journeyProgress.length === 0
      ? 0
      : firstIncompleteIndex < 0
        ? journeyProgress.length
        : firstIncompleteIndex + 1;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: Colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scroll}
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.lightText }]}>
              Welcome back,
            </Text>
            <Text style={[styles.name, { color: Colors.text }]}>
              {firstName}!
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => [
              styles.notification,
              pressed && styles.pressed,
            ]}
          >
            <Bell size={23} color={JOURNEY_COLORS.ink} strokeWidth={1.8} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            Checklist {currentStep} of {milestones.length}
          </Text>
          <Text style={styles.progressText}>{percent}%</Text>
        </View>

        {isLoading && milestones.length === 0 ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={JOURNEY_COLORS.coral} />
            <Text style={styles.stateText}>Loading your route…</Text>
          </View>
        ) : milestones.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.emptyTitle}>Your route is being prepared</Text>
            <Text style={styles.stateText}>
              Complete your destination and visa details to generate checklists.
            </Text>
          </View>
        ) : (
          <JourneyMap
            milestones={milestones}
            progress={progress}
            origin={user.homeCountry}
            destination={user.destinationCountry}
            animatedProgress={animatedProgress}
            onMilestonePress={handleChecklistPress}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F9FD",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 24,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F9FD",
  },
  loadingText: {
    color: JOURNEY_COLORS.muted,
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
  },
  notification: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: "#6C7A90",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  notificationDot: {
    position: "absolute",
    right: 12,
    top: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: JOURNEY_COLORS.coral,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DEE7F0",
    overflow: "hidden",
    marginTop: 32,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: JOURNEY_COLORS.coral,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    marginBottom: 20,
  },
  progressText: {
    color: JOURNEY_COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  stateContainer: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: JOURNEY_COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  stateText: {
    color: JOURNEY_COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
