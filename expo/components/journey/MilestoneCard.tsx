import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  FileText,
  GraduationCap,
  LockKeyhole,
  Send,
} from "lucide-react-native";
import type { JourneyIcon, JourneyMilestone } from "./journeyTypes";
import { JOURNEY_COLORS } from "./journeyTypes";

interface MilestoneCardProps {
  milestone: JourneyMilestone;
  onPress: () => void;
  style?: object;
}

const ICONS: Record<JourneyIcon, typeof BookOpen> = {
  research: BookOpen,
  application: FileText,
  visa: FileText,
  pre_departure: Send,
  arrival: Building2,
  academic: GraduationCap,
  career: BriefcaseBusiness,
};

function MilestoneCardComponent({
  milestone,
  onPress,
  style,
}: MilestoneCardProps) {
  const Icon = ICONS[milestone.icon];
  const isCurrent = milestone.status === "current";
  const isLocked = milestone.status === "locked";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${milestone.title} checklist`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isCurrent && styles.currentCard,
        isLocked && styles.lockedCard,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={[styles.iconBox, isCurrent && styles.currentIconBox]}>
        <Icon
          size={27}
          strokeWidth={1.8}
          color={isCurrent ? JOURNEY_COLORS.coral : JOURNEY_COLORS.blue}
        />
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {milestone.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {milestone.completedTasks} of {milestone.totalTasks} tasks
        </Text>
        <View style={styles.cardProgressTrack}>
          <View
            style={[
              styles.cardProgressFill,
              {
                width: `${milestone.progress}%`,
                backgroundColor: isCurrent
                  ? JOURNEY_COLORS.coral
                  : JOURNEY_COLORS.blue,
              },
            ]}
          />
        </View>
      </View>

      {milestone.status === "completed" && (
        <View style={styles.completedIndicator}>
          <Check size={17} strokeWidth={3} color={JOURNEY_COLORS.blue} />
        </View>
      )}

      {isCurrent && (
        <View style={styles.continueButton}>
          <ArrowRight size={19} strokeWidth={2.5} color="#FFFFFF" />
        </View>
      )}

      {isLocked && (
        <View style={styles.lockIndicator}>
          <LockKeyhole size={15} color="#98A5B7" />
        </View>
      )}

      {isCurrent && (
        <View style={styles.continuePill}>
          <Text style={styles.continueText}>Continue</Text>
        </View>
      )}
    </Pressable>
  );
}

export const MilestoneCard = memo(MilestoneCardComponent);

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: 252,
    minHeight: 108,
    padding: 14,
    paddingRight: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.93)",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.98)",
    shadowColor: "#56708E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    zIndex: 10,
  },
  currentCard: {
    width: 282,
    minHeight: 120,
    borderColor: "rgba(255,107,102,0.6)",
    backgroundColor: "#FFFCFC",
    shadowColor: JOURNEY_COLORS.coral,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 7,
  },
  lockedCard: {
    opacity: 0.66,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EEF4FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  currentIconBox: {
    backgroundColor: "#FFF0EF",
  },
  copy: {
    flex: 1,
  },
  title: {
    color: JOURNEY_COLORS.ink,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  subtitle: {
    color: JOURNEY_COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8EDF3",
    overflow: "hidden",
    marginTop: 9,
  },
  cardProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  completedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: JOURNEY_COLORS.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F3F7",
    alignItems: "center",
    justifyContent: "center",
  },
  continuePill: {
    position: "absolute",
    bottom: -19,
    left: 89,
    width: 104,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF0EF",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: JOURNEY_COLORS.coral,
    fontSize: 14,
    fontWeight: "700",
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});
