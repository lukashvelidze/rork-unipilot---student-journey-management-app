import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  Lightbulb,
  Lock,
  Plane,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react-native";
import ProgressRing from "@/components/ui/ProgressRing";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import { useAppBack } from "@/hooks/useAppBack";
import { canAccessJourneyTier, formatJourneyTierLabel } from "@/lib/journeyProgress";
import {
  formatDeadline,
  getUniversityLevelDetails,
  upcomingDeadline,
} from "@/lib/journeyRoutes";
import { openManageSubscription } from "@/lib/subscriptionManager";
import { formatDue, setChecklistTaskCompleted, STAGE_LABELS } from "@/lib/tasks";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { JourneyStage, Task } from "@/types/user";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const ACCEPTANCE_TASK = "🎉 Receive acceptance letter";
const POST_ACCEPTANCE_TASKS = [
  "Compare offers",
  "Accept offer",
  "Decline other offers",
  "Request official enrollment",
  "Register for orientation",
  "Apply for on-campus housing",
  "Submit final transcripts",
];
const DEADLINE_STAGES = new Set<JourneyStage>(["research", "application"]);

const stageIcons: Record<JourneyStage, typeof BookOpen> = {
  research: BookOpen,
  application: Target,
  visa: Plane,
  pre_departure: FileText,
  arrival: HomeIcon,
  academic: GraduationCap,
  career: Briefcase,
};

const STAGE_TIPS: Record<JourneyStage, string> = {
  research:
    "Shortlist 6–10 programmes across reach, match and safe options. Look beyond rankings: location, cost, teaching style and graduate outcomes matter just as much.",
  application:
    "Start 3–4 months before the deadline. Draft your personal statement early, give referees at least a month's notice, and submit a few days before the cut-off.",
  visa:
    "Start as soon as you have your offer. Gather financial evidence early, book your appointment ahead of peak season and practise explaining your study plans.",
  pre_departure:
    "Keep originals and digital copies of every document. Arrange insurance, accommodation and money access before you fly.",
  arrival:
    "Go to every orientation session, register locally on time, and join a club in your first two weeks; it's the easiest moment to meet people.",
  academic:
    "Learn the grading system early and use office hours. Universities expect independent study, so plan your weekly schedule from the start.",
  career:
    "Visit the careers service in your first term. Check your visa's work rules, and build experience through part-time roles, societies and internships.",
};

/** Generic advice for tasks that don't carry a generated hint. */
const fallbackAdvice = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("personal statement") || t.includes("essay"))
    return "Tell your own story: what drew you to this field, what you've done about it, and why this programme is the next step. Be specific and authentic.";
  if (t.includes("recommendation") || t.includes("reference"))
    return "Ask people who know your work well, give them 4–6 weeks' notice, and share your CV and a short summary of what you're applying for.";
  if (t.includes("ielts") || t.includes("toefl") || t.includes("test"))
    return "Book your test 2–3 months ahead, practise with official materials, and leave time for a retake before the deadline.";
  if (t.includes("transcript"))
    return "Official transcripts can take 2–4 weeks. Request them early and check whether a certified translation is needed.";
  if (t.includes("visa"))
    return "Read the official requirements carefully, prepare every document in the requested format, and book your appointment early.";
  if (t.includes("accommodation") || t.includes("housing"))
    return "University housing fills quickly, so apply as soon as it opens. Compare total cost, commute time and contract length.";
  if (t.includes("flight"))
    return "Book 2–3 months ahead and aim to arrive a few days before orientation so you can settle in.";
  return "Check the official requirements carefully, and contact the university's admissions team if anything is unclear.";
};

export default function StageDetailScreen() {
  const router = useRouter();
  const handleBack = useAppBack("/(tabs)");
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const {
    journeyProgress,
    journeys,
    activeJourneyKey,
    updateTaskCompletion,
    markAcceptance,
    addRecentMilestone,
  } = useJourneyStore();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [logoFailed, setLogoFailed] = useState(false);

  const stageIndex = journeyProgress.findIndex((s) => s.id === id || s.stage === id);
  const stage = stageIndex >= 0 ? journeyProgress[stageIndex] : null;
  const activeJourney = journeys.find((j) => j.key === activeJourneyKey) || journeys[0] || null;
  const university = activeJourney?.journey?.university ?? null;

  const userTier = user?.subscriptionTier || "free";
  const locked = !!stage && !canAccessJourneyTier(userTier, stage.subscriptionTier);

  const completedCount = stage?.tasks.filter((t) => t.completed).length ?? 0;
  const total = stage?.tasks.length ?? 0;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;
  const stageDone = total > 0 && completedCount === total;

  // Celebrate the moment the last task gets ticked (not when opening a finished stage).
  const wasDoneRef = useRef(stageDone);
  const celebrate = useRef(new Animated.Value(stageDone ? 1 : 0)).current;
  useEffect(() => {
    if (stageDone && !wasDoneRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
      celebrate.setValue(0);
      Animated.spring(celebrate, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
      if (stage) addRecentMilestone({ type: "stage_complete", stage: stage.stage, timestamp: Date.now() });
    } else if (!stageDone) {
      celebrate.setValue(0);
    }
    wasDoneRef.current = stageDone;
  }, [addRecentMilestone, celebrate, stage, stageDone]);

  if (!stage) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header onBack={handleBack} title="Stage" />
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>We couldn't find this stage</Text>
          <Text style={styles.missingText}>It may belong to another university. Go back and pick it again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const Icon = stageIcons[stage.stage] || FileText;
  const stageLabel = STAGE_LABELS[stage.stage] ?? "Stage";

  const hasAcceptance =
    stage.hasAcceptance || stage.tasks.some((t) => t.title.includes(ACCEPTANCE_TASK) && t.completed);
  const visibleTasks = stage.tasks.filter((task) => {
    if (stage.stage !== "application") return true;
    const postAcceptance = POST_ACCEPTANCE_TASKS.some((title) => task.title.includes(title));
    return !postAcceptance || hasAcceptance;
  });
  const nextTask = visibleTasks.find((t) => !t.completed) ?? null;

  const deadline = DEADLINE_STAGES.has(stage.stage) && university
    ? upcomingDeadline(
        getUniversityLevelDetails(university, activeJourney?.journey?.education_level)?.applicationDeadline,
      )
    : null;

  // ---------------------------------------------------------------------

  const persistToggle = async (task: Task, next: boolean) => {
    setPending((keys) => new Set(keys).add(task.id));
    updateTaskCompletion(stage.id, task.id, next);
    try {
      await setChecklistTaskCompleted(task.id, next);
    } catch (error) {
      console.error("Could not update task:", error);
      updateTaskCompletion(stage.id, task.id, !next);
      Alert.alert("Couldn't update task", "Please check your connection and try again.");
    } finally {
      setPending((keys) => {
        const copy = new Set(keys);
        copy.delete(task.id);
        return copy;
      });
    }
  };

  const toggle = (task: Task) => {
    if (pending.has(task.id)) return;
    const next = !task.completed;
    if (next) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    else Haptics.selectionAsync().catch(() => null);

    if (next && task.title.includes(ACCEPTANCE_TASK)) {
      Alert.alert("🎉 Congratulations!", "You've been accepted! This unlocks your enrolment tasks.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as complete",
          onPress: async () => {
            await persistToggle(task, true);
            markAcceptance(stage.id);
          },
        },
      ]);
      return;
    }
    persistToggle(task, next);
  };

  const toggleExpanded = (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, "easeInEaseOut", "opacity"));
    setExpanded((current) => (current === taskId ? null : taskId));
  };

  // ---------------------------------------------------------------------

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header onBack={handleBack} title={`Step ${stageIndex + 1} of ${journeyProgress.length}`} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.stageIcon, stageDone && styles.stageIconDone]}>
              {stageDone ? (
                <Check color={UI.success} size={22} strokeWidth={2.6} />
              ) : (
                <Icon color="#FFFFFF" size={22} strokeWidth={2} />
              )}
            </View>
            <View style={styles.heroBadges}>
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>{stageLabel.toUpperCase()}</Text>
              </View>
              {stage.subscriptionTier && stage.subscriptionTier !== "free" ? (
                <View style={[styles.stagePill, styles.tierPill]}>
                  <Sparkles color="#B7791F" size={10} strokeWidth={2.6} />
                  <Text style={[styles.stagePillText, styles.tierPillText]}>
                    {formatJourneyTierLabel(stage.subscriptionTier).toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
            {university?.logo_url && !logoFailed ? (
              <Image
                contentFit="contain"
                onError={() => setLogoFailed(true)}
                source={{ uri: university.logo_url }}
                style={styles.heroLogo}
              />
            ) : null}
          </View>

          <Text accessibilityRole="header" style={styles.heroTitle}>
            {stage.title}
          </Text>
          {stage.description ? <Text style={styles.heroDescription}>{stage.description}</Text> : null}

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <ProgressRing
              color={stageDone ? UI.success : UI.primary}
              fillColor={stageDone ? UI.successSoft : UI.primaryRing}
              labelSize={14}
              progress={percent}
              size={56}
              trackColor={stageDone ? "#BFEDE7" : "#FFD9D9"}
            />
            <View style={styles.heroStatCopy}>
              <Text style={styles.heroStatTitle}>
                {stageDone ? "Stage complete" : `${completedCount} of ${total} tasks done`}
              </Text>
              <Text numberOfLines={1} style={styles.heroStatText}>
                {deadline
                  ? `Application deadline ${formatDeadline(deadline)}`
                  : university
                    ? university.name
                    : stageDone
                      ? "Great work, on to the next step"
                      : `${total - completedCount} left in this stage`}
              </Text>
            </View>
          </View>
        </View>

        {locked ? (
          <LockedCard tier={stage.subscriptionTier} onUpgrade={() => openManageSubscription().catch(() => router.push("/premium" as any))} />
        ) : (
          <>
            {stageDone ? (
              <Animated.View
                style={[
                  styles.doneCard,
                  {
                    opacity: celebrate,
                    transform: [{ scale: celebrate.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
                  },
                ]}
              >
                <View style={styles.doneIcon}>
                  <Trophy color="#FFFFFF" size={20} strokeWidth={2.2} />
                </View>
                <View style={styles.doneCopy}>
                  <Text style={styles.doneTitle}>{stageLabel} stage complete!</Text>
                  <Text style={styles.doneText}>Every task here is done. Your roadmap has moved on.</Text>
                </View>
              </Animated.View>
            ) : null}

            {hasAcceptance && stage.stage === "application" ? (
              <View style={styles.acceptanceCard}>
                <Sparkles color={UI.success} size={18} strokeWidth={2.2} />
                <Text style={styles.acceptanceText}>
                  Congratulations on your offer! Your enrolment tasks are now unlocked.
                </Text>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Tasks
              </Text>
              <Text style={styles.sectionMeta}>
                {completedCount}/{total}
              </Text>
            </View>

            {visibleTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Tasks will appear here as you progress through your journey.</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {visibleTasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    due={deadline && !task.completed ? formatDue(deadline) : null}
                    expanded={expanded === task.id}
                    isLast={index === visibleTasks.length - 1}
                    isNext={task.id === nextTask?.id}
                    onExpand={() => toggleExpanded(task.id)}
                    onToggle={() => toggle(task)}
                    pending={pending.has(task.id)}
                    step={index + 1}
                    task={task}
                  />
                ))}
              </View>
            )}

            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Lightbulb color="#B7791F" size={18} strokeWidth={2} />
              </View>
              <View style={styles.tipCopy}>
                <Text style={styles.tipTitle}>Tip for this stage</Text>
                <Text style={styles.tipText}>{STAGE_TIPS[stage.stage] ?? STAGE_TIPS.pre_departure}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {!locked && nextTask ? (
        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityHint="Marks the next task in this stage as done"
            accessibilityRole="button"
            activeOpacity={0.85}
            disabled={pending.has(nextTask.id)}
            onPress={() => toggle(nextTask)}
            style={styles.footerButton}
          >
            {pending.has(nextTask.id) ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check color="#FFFFFF" size={18} strokeWidth={2.6} />
                <Text numberOfLines={1} style={styles.footerButtonText}>
                  Mark next task done
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" hitSlop={8} onPress={onBack} style={styles.backButton}>
        <ArrowLeft color={UI.text} size={20} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.backButtonSpacer} />
    </View>
  );
}

function TaskItem({
  task,
  step,
  isNext,
  isLast,
  expanded,
  pending,
  due,
  onToggle,
  onExpand,
}: {
  task: Task;
  step: number;
  isNext: boolean;
  isLast: boolean;
  expanded: boolean;
  pending: boolean;
  due: string | null;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const advice = task.hint || fallbackAdvice(task.title);
  return (
    <View style={[styles.task, !isLast && styles.taskDivider, isNext && styles.taskNext]}>
      <View style={styles.taskRow}>
        <Pressable
          accessibilityLabel={task.completed ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed, busy: pending }}
          hitSlop={10}
          onPress={onToggle}
          style={[styles.checkbox, task.completed && styles.checkboxDone, isNext && !task.completed && styles.checkboxNext]}
        >
          {pending ? (
            <ActivityIndicator color={task.completed ? "#FFFFFF" : UI.primary} size="small" style={styles.checkboxSpinner} />
          ) : task.completed ? (
            <Check color="#FFFFFF" size={14} strokeWidth={3} />
          ) : (
            <Text style={[styles.stepNumber, isNext && styles.stepNumberNext]}>{step}</Text>
          )}
        </Pressable>

        <Pressable accessibilityHint="Shows guidance" accessibilityRole="button" onPress={onExpand} style={styles.taskBody}>
          {isNext && !task.completed ? <Text style={styles.nextLabel}>UP NEXT</Text> : null}
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
          {task.completed && task.completedDate ? (
            <Text style={styles.taskMetaDone}>
              Done {new Date(task.completedDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </Text>
          ) : due ? (
            <Text style={styles.taskMeta}>{due}</Text>
          ) : null}
        </Pressable>

        <TouchableOpacity
          accessibilityLabel={expanded ? "Hide guidance" : "Show guidance"}
          hitSlop={10}
          onPress={onExpand}
          style={[styles.expandButton, expanded && styles.expandButtonOpen]}
        >
          <ChevronDown color={expanded ? UI.primary : UI.muted} size={16} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.advice}>
          <Lightbulb color="#B7791F" size={15} strokeWidth={2} style={styles.adviceIcon} />
          <Text style={styles.adviceText}>{advice}</Text>
        </View>
      ) : null}
    </View>
  );
}

function LockedCard({ tier, onUpgrade }: { tier?: string; onUpgrade: () => void }) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedIcon}>
        <Lock color={UI.primary} size={22} strokeWidth={2} />
      </View>
      <Text style={styles.lockedTitle}>Part of the {formatJourneyTierLabel(tier)} plan</Text>
      <Text style={styles.lockedText}>
        Upgrade to unlock the step-by-step tasks and guidance for this stage.
      </Text>
      <TouchableOpacity activeOpacity={0.85} onPress={onUpgrade} style={styles.lockedButton}>
        <Text style={styles.footerButtonText}>View plans</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    paddingHorizontal: GUTTER - 4,
    paddingTop: 6,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
    ...CARD_SHADOW,
  },
  backButtonSpacer: {
    width: 40,
  },
  headerTitle: {
    color: UI.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: GUTTER,
  },
  missing: {
    alignItems: "center",
    padding: GUTTER,
    paddingTop: 60,
  },
  missingTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
  },
  missingText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  hero: {
    backgroundColor: UI.card,
    borderRadius: 22,
    marginTop: 6,
    padding: 18,
    ...CARD_SHADOW,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  stageIcon: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  stageIconDone: {
    backgroundColor: UI.successSoft,
  },
  heroBadges: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  stagePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: UI.primarySoft,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stagePillText: {
    color: UI.primary,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  tierPill: {
    backgroundColor: UI.warningSoft,
  },
  tierPillText: {
    color: "#B7791F",
  },
  heroLogo: {
    height: 30,
    width: 84,
  },
  heroTitle: {
    color: UI.text,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 29,
    marginTop: 16,
  },
  heroDescription: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  heroDivider: {
    backgroundColor: UI.hairline,
    height: 1,
    marginVertical: 16,
  },
  heroStats: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  heroStatCopy: {
    flex: 1,
  },
  heroStatTitle: {
    color: UI.text,
    fontSize: 15.5,
    fontWeight: "700",
  },
  heroStatText: {
    color: UI.muted,
    fontSize: 12.5,
    marginTop: 3,
  },
  doneCard: {
    alignItems: "center",
    backgroundColor: UI.successSoft,
    borderRadius: RADIUS.tile,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 14,
  },
  doneIcon: {
    alignItems: "center",
    backgroundColor: UI.success,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  doneCopy: {
    flex: 1,
  },
  doneTitle: {
    color: "#14776E",
    fontSize: 15,
    fontWeight: "800",
  },
  doneText: {
    color: "#2B7C74",
    fontSize: 12.5,
    marginTop: 2,
  },
  acceptanceCard: {
    alignItems: "center",
    backgroundColor: UI.successSoft,
    borderRadius: RADIUS.tile,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 14,
  },
  acceptanceText: {
    color: "#14776E",
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 24,
  },
  sectionTitle: {
    color: UI.text,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionMeta: {
    color: UI.muted,
    fontSize: 13.5,
    fontWeight: "600",
  },
  listCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    overflow: "hidden",
    ...CARD_SHADOW,
  },
  task: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taskDivider: {
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
  },
  taskNext: {
    backgroundColor: "#FFF8F8",
  },
  taskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#D5D5DE",
    borderRadius: 14,
    borderWidth: 1.5,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  checkboxNext: {
    borderColor: UI.primary,
  },
  checkboxDone: {
    backgroundColor: UI.success,
    borderColor: UI.success,
  },
  checkboxSpinner: {
    transform: [{ scale: 0.7 }],
  },
  stepNumber: {
    color: UI.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  stepNumberNext: {
    color: UI.primary,
  },
  taskBody: {
    flex: 1,
  },
  nextLabel: {
    color: UI.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  taskTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 21,
  },
  taskTitleDone: {
    color: UI.muted,
    textDecorationLine: "line-through",
  },
  taskMeta: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 3,
  },
  taskMetaDone: {
    color: UI.success,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  expandButton: {
    alignItems: "center",
    backgroundColor: "#F3F3F7",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  expandButtonOpen: {
    backgroundColor: UI.primarySoft,
    transform: [{ rotate: "180deg" }],
  },
  advice: {
    backgroundColor: "#FFFAEF",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    marginLeft: 40,
    marginTop: 12,
    padding: 12,
  },
  adviceIcon: {
    marginTop: 1,
  },
  adviceText: {
    color: "#5C4A1E",
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    padding: 20,
    ...CARD_SHADOW,
  },
  emptyText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  tipCard: {
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: RADIUS.tile,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 16,
  },
  tipIcon: {
    alignItems: "center",
    backgroundColor: UI.warningSoft,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  tipCopy: {
    flex: 1,
  },
  tipTitle: {
    color: UI.text,
    fontSize: 14.5,
    fontWeight: "700",
  },
  tipText: {
    color: UI.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 4,
  },
  lockedCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 18,
    padding: 24,
    ...CARD_SHADOW,
  },
  lockedIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  lockedTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  lockedText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  lockedButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: UI.primary,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    marginTop: 18,
  },
  footer: {
    backgroundColor: UI.background,
    bottom: 0,
    left: 0,
    paddingBottom: 30,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  footerButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    height: 56,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
