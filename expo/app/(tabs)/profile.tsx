import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  Edit3,
  Settings,
} from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useSignOut } from "@/hooks/useSignOut";
import { useDocumentStore } from "@/store/documentStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useThemeStore } from "@/store/themeStore";
import { useUserStore } from "@/store/userStore";

const CORAL = "#FF6570";
const MINT = "#55D6B5";
const GOLD = "#A97800";
const RING_SIZE = 60;
const RING_STROKE = 5;

function JourneyProgressRing({ progress }: { progress: number }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const dashOffset = circumference * (1 - clampedProgress / 100);

  return (
    <View style={styles.progressRing}>
      <Svg height={RING_SIZE} width={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="transparent"
          r={radius}
          stroke="#E8E8EE"
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          fill="transparent"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          r={radius}
          rotation={-90}
          stroke={CORAL}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
        />
      </Svg>
      <Text style={styles.progressRingValue}>{progress}%</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const Colors = useColors();
  const { isDarkMode } = useThemeStore();
  const { user } = useUserStore();
  const signOut = useSignOut();
  const { journeyProgress } = useJourneyStore();
  const { documents } = useDocumentStore();

  const palette = {
    background: isDarkMode ? Colors.background : "#F7F7FA",
    card: Colors.card,
    journey: isDarkMode ? Colors.surface : "#E5E7EB",
    journeyInset: isDarkMode
      ? Colors.surfaceElevated
      : "rgba(255,255,255,0.56)",
    muted: isDarkMode ? Colors.lightText : "#66697C",
    text: isDarkMode ? Colors.text : "#25263A",
  };

  if (!user) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: palette.background }]}
      >
        <View style={styles.missingUserState}>
          <Text style={[styles.errorText, { color: palette.text }]}>
            User data not available.
          </Text>
          <Button
            fullWidth
            onPress={signOut}
            style={styles.logoutButton}
            textStyle={{ color: Colors.error }}
            title="Log out"
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  const allTasks = journeyProgress.flatMap((stage) => stage.tasks);
  const actualCompletedTasks = allTasks.filter((task) => task.completed).length;
  const actualJourneyProgress = allTasks.length
    ? Math.round((actualCompletedTasks / allTasks.length) * 100)
    : 0;
  const nextTask = allTasks.find((task) => !task.completed);
  const tier = (
    user.subscriptionTier || (user.isPremium ? "premium" : "free")
  ).toLowerCase();
  const membershipLabel = `${tier.charAt(0).toUpperCase()}${tier.slice(1)} member`;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>Your space</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: palette.card }]}>
          <Avatar
            color={CORAL}
            imageUrl={user.avatar}
            name={user.name}
            size="large"
            style={styles.avatar}
          />
          <View style={styles.memberDetails}>
            <Text
              numberOfLines={1}
              style={[styles.name, { color: palette.text }]}
            >
              {user.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.email, { color: palette.muted }]}
            >
              {user.email}
            </Text>
            <View style={styles.membershipBadge}>
              <Text style={styles.membershipText}>✦ {membershipLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.progressCard, { backgroundColor: palette.card }]}>
            <JourneyProgressRing progress={actualJourneyProgress} />
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Journey progress
            </Text>
          </View>

          <View style={styles.stackedStats}>
            <View
              style={[styles.miniStatCard, { backgroundColor: palette.card }]}
            >
              <Text style={[styles.miniStatValue, { color: MINT }]}>
                {actualCompletedTasks}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  styles.miniStatLabel,
                  { color: palette.muted },
                ]}
              >
                Tasks completed
              </Text>
            </View>
            <View
              style={[styles.miniStatCard, { backgroundColor: palette.card }]}
            >
              <Text style={[styles.miniStatValue, { color: GOLD }]}>
                {documents.length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  styles.miniStatLabel,
                  { color: palette.muted },
                ]}
              >
                Documents
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel={`Current journey. Study in ${user.destinationCountry?.name || "your destination"}. ${nextTask ? `Next step: ${nextTask.title}` : "All tasks completed"}`}
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={() => router.push("/(tabs)/journey")}
          style={[styles.journeyCard, { backgroundColor: palette.journey }]}
        >
          <Text style={[styles.journeyEyebrow, { color: palette.text }]}>
            Current journey
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.journeyTitle, { color: palette.text }]}
          >
            Study in {user.destinationCountry?.name || "your destination"}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${actualJourneyProgress}%` as `${number}%` },
              ]}
            />
          </View>

          <View
            style={[
              styles.nextStep,
              { backgroundColor: palette.journeyInset },
            ]}
          >
            <View style={styles.nextStepIcon}>
              <Check color={MINT} size={16} strokeWidth={2} />
            </View>
            <View style={styles.nextStepCopy}>
              <Text style={[styles.nextStepLabel, { color: palette.text }]}>
                Next step:
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.nextStepTitle, { color: palette.text }]}
              >
                {nextTask?.title || "All caught up"}
              </Text>
            </View>
            <ChevronRight color={palette.text} size={17} strokeWidth={1.7} />
          </View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            onPress={() => router.push("/profile/edit")}
            style={[styles.actionCard, { backgroundColor: palette.card }]}
          >
            <Edit3 color={CORAL} size={24} strokeWidth={1.8} />
            <Text style={[styles.actionTitle, { color: palette.text }]}>
              Edit profile
            </Text>
            <Text style={[styles.actionSubtitle, { color: palette.muted }]}>
              Update your information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            onPress={() => router.push("/settings")}
            style={[styles.actionCard, { backgroundColor: palette.card }]}
          >
            <Settings color={MINT} size={24} strokeWidth={1.8} />
            <Text style={[styles.actionTitle, { color: palette.text }]}>
              Settings
            </Text>
            <Text style={[styles.actionSubtitle, { color: palette.muted }]}>
              Privacy and preferences
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: 24,
  },
  pageHeader: {
    alignItems: "center",
    flexDirection: "row",
    height: 58,
    justifyContent: "flex-start",
  },
  eyebrow: {
    color: CORAL,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.12,
    textTransform: "uppercase",
  },
  profileCard: {
    alignItems: "center",
    borderRadius: 26,
    flexDirection: "row",
    height: 107,
    marginTop: 16,
    padding: 18,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: "#20213A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
      },
      web: { boxShadow: "0 8px 24px rgba(32, 33, 58, 0.05)" },
    }),
  },
  avatar: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  memberDetails: {
    flex: 1,
    gap: 5,
    marginLeft: 14,
  },
  name: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 23,
  },
  email: {
    fontSize: 12,
    lineHeight: 15,
  },
  membershipBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF8E7",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  membershipText: {
    color: GOLD,
    fontSize: 11,
    lineHeight: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 30,
    height: 150,
    marginTop: 16,
  },
  progressCard: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    justifyContent: "center",
  },
  progressRing: {
    alignItems: "center",
    height: RING_SIZE,
    justifyContent: "center",
    width: RING_SIZE,
  },
  progressRingValue: {
    color: CORAL,
    fontSize: 18,
    fontWeight: "700",
    position: "absolute",
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 14,
    textAlign: "center",
  },
  stackedStats: {
    flex: 1,
    gap: 10,
  },
  miniStatCard: {
    alignItems: "center",
    borderRadius: 18,
    flex: 1,
    justifyContent: "center",
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  miniStatLabel: {
    marginTop: 4,
  },
  journeyCard: {
    borderRadius: 26,
    marginTop: 31,
    minHeight: 167,
    padding: 18,
  },
  journeyEyebrow: {
    fontSize: 11,
    fontWeight: "300",
    letterSpacing: 0.77,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  journeyTitle: {
    fontSize: 17,
    lineHeight: 21,
    marginTop: 3,
  },
  progressTrack: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: CORAL,
    borderRadius: 999,
    height: 8,
  },
  nextStep: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    height: 58,
    marginTop: 14,
    padding: 12,
  },
  nextStepIcon: {
    alignItems: "center",
    backgroundColor: "#EAFBF6",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  nextStepCopy: {
    flex: 1,
    gap: 2,
    marginLeft: 10,
    marginRight: 6,
  },
  nextStepLabel: {
    fontSize: 11,
    lineHeight: 13,
  },
  nextStepTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 27,
    marginTop: 36,
  },
  actionCard: {
    borderRadius: 18,
    flex: 1,
    minHeight: 107,
    padding: 16,
  },
  actionTitle: {
    fontSize: 14,
    lineHeight: 17,
    marginTop: 10,
  },
  actionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 10,
  },
  missingUserState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  logoutButton: {
    borderColor: "#FF5252",
  },
});
