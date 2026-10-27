import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  ListChecks,
  Lock,
  Plane,
  Plus,
  Target,
} from "lucide-react-native";
import BottomSheet from "@/components/ui/BottomSheet";
import CalendarPicker, { toIsoDate } from "@/components/ui/CalendarPicker";
import ProgressRing from "@/components/ui/ProgressRing";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { CARD_SHADOW, GUTTER, RADIUS, UI } from "@/constants/design";
import {
  ensureUniversityRoutes,
  fetchJourneysWithProgress,
  formatJourneyTierLabel,
} from "@/lib/journeyProgress";
import { openManageSubscription } from "@/lib/subscriptionManager";
import {
  buildTaskEntries,
  byPriority,
  createUserTask,
  deleteUserTask,
  dueStatus,
  fetchUserTasks,
  formatDue,
  setChecklistTaskCompleted,
  setUserTaskCompleted,
  STAGE_LABELS,
  TaskEntry,
  UserTaskRecord,
} from "@/lib/tasks";
import { useJourneyStore } from "@/store/journeyStore";
import { useUserStore } from "@/store/userStore";
import { JourneyStage } from "@/types/user";

type Filter = "all" | "upcoming" | "done";

const PRIORITY_COUNT = 2;
const LIST_PREVIEW = 5;

const stageIcons: Record<JourneyStage, typeof BookOpen> = {
  research: BookOpen,
  application: Target,
  visa: Plane,
  pre_departure: FileText,
  arrival: HomeIcon,
  academic: GraduationCap,
  career: Briefcase,
};

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { journeys, activeJourneyKey, setJourneys, updateTaskCompletion } = useJourneyStore();

  const [userTier, setUserTier] = useState<string>(user?.subscriptionTier || "free");
  const [customTasks, setCustomTasks] = useState<UserTaskRecord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(journeys.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const activeJourney = journeys.find((j) => j.key === activeJourneyKey) || journeys[0] || null;
  const university = activeJourney?.journey?.university ?? null;

  const load = useCallback(async () => {
    try {
      const [{ journeys: loaded, userTier: tier }, own] = await Promise.all([
        fetchJourneysWithProgress(),
        fetchUserTasks(),
      ]);
      setUserTier(tier);
      setJourneys(loaded);
      setCustomTasks(own);
      ensureUniversityRoutes(loaded);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setJourneys]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const tasks = useMemo(
    () => buildTaskEntries(activeJourney, userTier, customTasks),
    [activeJourney, customTasks, userTier],
  );

  const completed = tasks.filter((t) => t.completed);
  const open = tasks.filter((t) => !t.completed);
  const actionable = open.filter((t) => !t.locked).sort(byPriority);
  const percent = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const currentStageId = actionable.find((t) => t.source === "checklist")?.stageId;
  const requiringAction = actionable.filter((t) => {
    const status = dueStatus(t.dueDate);
    return (
      t.source === "custom" ||
      t.stageId === currentStageId ||
      status === "overdue" ||
      status === "today" ||
      status === "tomorrow"
    );
  }).length;

  const priority = filter === "done" ? [] : actionable.slice(0, PRIORITY_COUNT);
  const listSource =
    filter === "done"
      ? completed
      : filter === "upcoming"
        ? [...actionable.slice(PRIORITY_COUNT), ...open.filter((t) => t.locked)]
        : [...actionable.slice(PRIORITY_COUNT), ...open.filter((t) => t.locked), ...completed];
  const list = showAll ? listSource : listSource.slice(0, LIST_PREVIEW);

  // ---------------------------------------------------------------------
  // actions
  // ---------------------------------------------------------------------

  const promptUpgrade = (tier?: string) => {
    Alert.alert(
      "Upgrade required",
      `This task is part of the ${formatJourneyTierLabel(tier)} plan. Upgrade to unlock it.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "View plans",
          onPress: () => openManageSubscription().catch(() => router.push("/premium" as any)),
        },
      ],
    );
  };

  const toggleTask = async (task: TaskEntry) => {
    if (task.locked) {
      promptUpgrade(task.requiredTier);
      return;
    }
    if (pendingKeys.has(task.key)) return;
    const next = !task.completed;
    setPendingKeys((keys) => new Set(keys).add(task.key));
    if (next) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    else Haptics.selectionAsync().catch(() => null);

    // Optimistic update, rolled back on failure.
    const apply = (value: boolean) => {
      if (task.source === "checklist" && task.stageId) {
        updateTaskCompletion(task.stageId, task.id, value);
      } else {
        setCustomTasks((current) =>
          current.map((t) => (t.id === task.id ? { ...t, is_completed: value } : t)),
        );
      }
    };
    apply(next);
    try {
      if (task.source === "checklist") await setChecklistTaskCompleted(task.id, next);
      else await setUserTaskCompleted(task.id, next);
    } catch (error) {
      console.error("Could not update task:", error);
      apply(!next);
      Alert.alert("Couldn't update task", "Please check your connection and try again.");
    } finally {
      setPendingKeys((keys) => {
        const copy = new Set(keys);
        copy.delete(task.key);
        return copy;
      });
    }
  };

  const openTask = (task: TaskEntry) => {
    if (task.locked) {
      promptUpgrade(task.requiredTier);
      return;
    }
    if (task.source === "checklist" && task.stageId) {
      router.push(`/journey/${task.stageId}` as any);
      return;
    }
    Alert.alert(task.title, task.hint || undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete task", style: "destructive", onPress: () => removeCustomTask(task) },
      { text: task.completed ? "Mark as not done" : "Mark as done", onPress: () => toggleTask(task) },
    ]);
  };

  const removeCustomTask = async (task: TaskEntry) => {
    const previous = customTasks;
    setCustomTasks((current) => current.filter((t) => t.id !== task.id));
    try {
      await deleteUserTask(task.id);
    } catch (error) {
      console.error("Could not delete task:", error);
      setCustomTasks(previous);
      Alert.alert("Couldn't delete task", "Please try again.");
    }
  };

  const addTask = async (title: string, dueDate: string | null) => {
    const created = await createUserTask({
      title,
      dueDate,
      journeyId: activeJourney?.journey?.id ?? null,
    });
    setCustomTasks((current) => [created, ...current]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  };

  // ---------------------------------------------------------------------
  // render
  // ---------------------------------------------------------------------

  const hasRoadmap = tasks.some((t) => t.source === "checklist");

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} tintColor={UI.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Tasks
          </Text>
          <TouchableOpacity
            accessibilityLabel="Add a task"
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => setIsAdding(true)}
            style={styles.addButton}
          >
            <Plus color={UI.text} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={UI.primary} />
          </View>
        ) : (
          <>
            <View style={styles.overviewCard}>
              <ProgressRing progress={percent} />
              <View style={styles.overviewCopy}>
                <View style={styles.overviewTitleRow}>
                  <Text style={styles.overviewTitle}>Task Overview</Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>
                      {completed.length} of {tasks.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${percent}%` }]} />
                </View>
                <Text numberOfLines={1} style={styles.overviewCaption}>
                  {open.length === 0 && tasks.length > 0
                    ? "Everything is done. Great work!"
                    : `${requiringAction} pending ${requiringAction === 1 ? "task requires" : "tasks require"} action`}
                </Text>
              </View>
            </View>

            <View style={styles.segmentWrap}>
              <SegmentedControl
                onChange={(key) => {
                  setFilter(key);
                  setShowAll(false);
                }}
                segments={[
                  { key: "all", label: `All · ${tasks.length}` },
                  { key: "upcoming", label: `Upcoming · ${open.length}` },
                  { key: "done", label: `Done · ${completed.length}` },
                ]}
                value={filter}
              />
            </View>

            {!hasRoadmap && customTasks.length === 0 ? (
              <EmptyState
                hasUniversity={!!university}
                onAdd={() => setIsAdding(true)}
                onChoose={() => router.push("/onboarding/step-universities?mode=manage" as any)}
              />
            ) : null}

            {priority.length > 0 ? (
              <>
                <SectionHeader
                  action={currentStageId ? "View details" : undefined}
                  onAction={() => currentStageId && router.push(`/journey/${currentStageId}` as any)}
                  title="Top priority"
                />
                <View style={styles.priorityList}>
                  {priority.map((task) => (
                    <PriorityCard
                      key={task.key}
                      logoUrl={university?.logo_url ?? null}
                      onPress={() => openTask(task)}
                      task={task}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {listSource.length > 0 ? (
              <>
                <SectionHeader
                  action={
                    listSource.length > LIST_PREVIEW
                      ? showAll
                        ? "Show less"
                        : `See all ${listSource.length}`
                      : undefined
                  }
                  onAction={() => setShowAll((value) => !value)}
                  title={filter === "done" ? "Completed tasks" : "Upcoming tasks"}
                />
                <View style={styles.listCard}>
                  {list.map((task, index) => (
                    <TaskRow
                      key={task.key}
                      isLast={index === list.length - 1}
                      onOpen={() => openTask(task)}
                      onToggle={() => toggleTask(task)}
                      pending={pendingKeys.has(task.key)}
                      task={task}
                    />
                  ))}
                </View>
              </>
            ) : filter === "done" && tasks.length > 0 ? (
              <Text style={styles.emptyFilter}>Tasks you complete will show up here.</Text>
            ) : filter === "upcoming" && tasks.length > 0 && priority.length === 0 ? (
              <Text style={styles.emptyFilter}>Nothing left to do. Enjoy the moment!</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <AddTaskSheet onClose={() => setIsAdding(false)} onSubmit={addTask} visible={isAdding} />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// pieces
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {action ? (
        <TouchableOpacity accessibilityRole="button" hitSlop={10} onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function badgeFor(task: TaskEntry) {
  const status = dueStatus(task.dueDate);
  if (status === "overdue") return { label: "Overdue", tone: "danger" as const };
  if (status === "today") return { label: "DUE TODAY", tone: "danger" as const };
  if (status === "tomorrow" || status === "soon") return { label: formatDue(task.dueDate)!, tone: "warning" as const };
  if (task.dueDate) return { label: formatDue(task.dueDate)!, tone: "neutral" as const };
  return { label: task.source === "custom" ? "Your task" : "Up next", tone: "neutral" as const };
}

function PriorityCard({
  task,
  logoUrl,
  onPress,
}: {
  task: TaskEntry;
  logoUrl: string | null;
  onPress: () => void;
}) {
  const badge = badgeFor(task);
  const [logoFailed, setLogoFailed] = useState(false);
  const Icon = task.stage ? stageIcons[task.stage] : ListChecks;
  const caption =
    task.source === "checklist"
      ? `${task.stageTitle} · ${task.step} of ${task.steps} steps`
      : task.hint || "Added by you";

  return (
    <TouchableOpacity
      accessibilityHint="Opens the task"
      accessibilityLabel={`${badge.label}. ${task.title}. ${caption}`}
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.priorityCard}
    >
      <View style={styles.priorityLogo}>
        {logoUrl && !logoFailed && task.source === "checklist" ? (
          <Image
            contentFit="contain"
            onError={() => setLogoFailed(true)}
            source={{ uri: logoUrl }}
            style={styles.priorityLogoImage}
          />
        ) : (
          <Icon color={UI.primary} size={24} strokeWidth={1.8} />
        )}
      </View>
      <View style={styles.priorityCopy}>
        <View style={[styles.badge, badgeStyles[badge.tone]]}>
          <Text style={[styles.badgeText, badgeTextStyles[badge.tone]]}>{badge.label}</Text>
        </View>
        <Text numberOfLines={2} style={styles.priorityTitle}>
          {task.title}
        </Text>
        <Text numberOfLines={1} style={styles.priorityCaption}>
          {caption}
        </Text>
      </View>
      <View style={styles.priorityArrow}>
        <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

function TaskRow({
  task,
  isLast,
  pending,
  onToggle,
  onOpen,
}: {
  task: TaskEntry;
  isLast: boolean;
  pending: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const Icon = task.stage ? stageIcons[task.stage] : ListChecks;
  const due = task.completed ? null : formatDue(task.dueDate);
  const category = task.source === "custom" ? "Your task" : task.stage ? STAGE_LABELS[task.stage] : "";
  const caption = task.locked
    ? `${formatJourneyTierLabel(task.requiredTier)} plan · ${category}`
    : [due, category].filter(Boolean).join(" · ");
  const overdue = dueStatus(task.dueDate) === "overdue" && !task.completed;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <Pressable
        accessibilityLabel={task.completed ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed, disabled: task.locked || pending }}
        hitSlop={10}
        onPress={onToggle}
        style={[
          styles.checkbox,
          task.completed && styles.checkboxDone,
          task.locked && styles.checkboxLocked,
        ]}
      >
        {task.completed ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
        {task.locked ? <Lock color={UI.muted} size={11} strokeWidth={2.4} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.rowBody}>
        <Text
          numberOfLines={2}
          style={[styles.rowTitle, task.completed && styles.rowTitleDone, task.locked && styles.rowTitleLocked]}
        >
          {task.title}
        </Text>
        {caption ? (
          <Text numberOfLines={1} style={[styles.rowCaption, overdue && styles.rowCaptionOverdue]}>
            {caption}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.rowIcon}>
        <Icon color="#6B6B80" size={15} strokeWidth={2} />
      </View>
    </View>
  );
}

function EmptyState({
  hasUniversity,
  onChoose,
  onAdd,
}: {
  hasUniversity: boolean;
  onChoose: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <ListChecks color={UI.primary} size={24} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasUniversity ? "Your roadmap is on its way" : "Let's build your task list"}
      </Text>
      <Text style={styles.emptyText}>
        {hasUniversity
          ? "We're preparing the tasks for your university. Meanwhile, add anything you need to remember."
          : "Choose the universities you're applying to and we'll create a step-by-step task list for each."}
      </Text>
      <TouchableOpacity activeOpacity={0.85} onPress={hasUniversity ? onAdd : onChoose} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>{hasUniversity ? "Add a task" : "Choose universities"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const QUICK_DATES: { label: string; days: number }[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

function AddTaskSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, dueDate: string | null) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const reset = () => {
    setTitle("");
    setDueDate(null);
    setShowCalendar(false);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!title.trim()) {
      setError("Give your task a name.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(title, dueDate);
      close();
    } catch (submitError) {
      console.error("Could not add task:", submitError);
      setError("Couldn't save the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const quickIso = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
  };

  return (
    <BottomSheet
      footer={
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          disabled={saving}
          onPress={submit}
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Add task</Text>}
        </TouchableOpacity>
      }
      onClose={close}
      onOpened={() => inputRef.current?.focus()}
      title="New task"
      visible={visible}
    >
      <TextInput
        ref={inputRef}
        accessibilityLabel="Task name"
        maxLength={200}
        onChangeText={(text) => {
          setTitle(text);
          if (error) setError("");
        }}
        onSubmitEditing={submit}
        placeholder="e.g. Book IELTS test date"
        placeholderTextColor={UI.muted}
        returnKeyType="done"
        style={[styles.input, !!error && styles.inputError]}
        value={title}
      />
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}

      <Text style={styles.fieldLabel}>Due date</Text>
      <View style={styles.chips}>
        <DateChip active={!dueDate} label="No date" onPress={() => setDueDate(null)} />
        {QUICK_DATES.map((option) => {
          const iso = quickIso(option.days);
          return (
            <DateChip
              key={option.label}
              active={dueDate === iso && !showCalendar}
              label={option.label}
              onPress={() => {
                setDueDate(iso);
                setShowCalendar(false);
              }}
            />
          );
        })}
        <DateChip
          active={showCalendar}
          icon
          label={dueDate && showCalendar ? formatDue(dueDate)!.replace(/^Due /, "") : "Pick date"}
          onPress={() => setShowCalendar((value) => !value)}
        />
      </View>
      {showCalendar ? (
        <View style={styles.calendar}>
          <CalendarPicker minDate={toIsoDate(new Date())} onChange={setDueDate} value={dueDate} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

function DateChip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon ? <CalendarDays color={active ? "#FFFFFF" : UI.textSecondary} size={14} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const badgeStyles = StyleSheet.create({
  danger: { backgroundColor: UI.primarySoft },
  warning: { backgroundColor: UI.warningSoft },
  neutral: { backgroundColor: "#F1F1F6" },
});

const badgeTextStyles = StyleSheet.create({
  danger: { color: UI.primary },
  warning: { color: "#B7791F" },
  neutral: { color: UI.textSecondary },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI.background,
    flex: 1,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: GUTTER,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 18,
    paddingTop: 12,
  },
  title: {
    color: UI.text,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...CARD_SHADOW,
  },
  loading: {
    paddingTop: 80,
  },
  overviewCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: 22,
    flexDirection: "row",
    gap: 16,
    padding: 18,
    ...CARD_SHADOW,
  },
  overviewCopy: {
    flex: 1,
  },
  overviewTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewTitle: {
    color: UI.text,
    fontSize: 16,
    fontWeight: "700",
  },
  countPill: {
    backgroundColor: UI.successSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countPillText: {
    color: UI.success,
    fontSize: 11.5,
    fontWeight: "700",
  },
  track: {
    backgroundColor: UI.track,
    borderRadius: 4,
    height: 6,
    marginTop: 10,
    overflow: "hidden",
  },
  trackFill: {
    backgroundColor: UI.primary,
    borderRadius: 4,
    height: "100%",
  },
  overviewCaption: {
    color: UI.textSecondary,
    fontSize: 12.5,
    marginTop: 8,
  },
  segmentWrap: {
    marginTop: 18,
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
  sectionAction: {
    color: UI.primary,
    fontSize: 13.5,
    fontWeight: "600",
  },
  priorityList: {
    gap: 14,
  },
  priorityCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderColor: UI.primary,
    borderRadius: RADIUS.tile,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    ...CARD_SHADOW,
  },
  priorityLogo: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  priorityLogoImage: {
    height: 56,
    width: 56,
  },
  priorityCopy: {
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: RADIUS.pill,
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  priorityTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  priorityCaption: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 4,
  },
  priorityArrow: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  listCard: {
    backgroundColor: UI.card,
    borderRadius: RADIUS.tile,
    paddingHorizontal: 16,
    ...CARD_SHADOW,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomColor: UI.hairline,
    borderBottomWidth: 1,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#C9C9D4",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxDone: {
    backgroundColor: UI.success,
    borderColor: UI.success,
  },
  checkboxLocked: {
    backgroundColor: "#F3F3F7",
    borderColor: "#E2E2EA",
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  rowTitleDone: {
    color: UI.muted,
    textDecorationLine: "line-through",
  },
  rowTitleLocked: {
    color: UI.textSecondary,
  },
  rowCaption: {
    color: UI.muted,
    fontSize: 12,
    marginTop: 3,
  },
  rowCaptionOverdue: {
    color: UI.primary,
    fontWeight: "600",
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: "#F1F1F6",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  emptyFilter: {
    color: UI.muted,
    fontSize: 14,
    marginTop: 28,
    textAlign: "center",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: UI.card,
    borderRadius: RADIUS.card,
    marginTop: 24,
    padding: 24,
    ...CARD_SHADOW,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: UI.primarySoft,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  emptyTitle: {
    color: UI.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: UI.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: UI.primary,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    color: UI.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: UI.danger,
  },
  inputErrorText: {
    color: UI.danger,
    fontSize: 12.5,
    marginTop: 6,
  },
  fieldLabel: {
    color: UI.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: UI.background,
    borderColor: UI.border,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: UI.primary,
    borderColor: UI.primary,
  },
  chipText: {
    color: UI.textSecondary,
    fontSize: 13.5,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  calendar: {
    marginTop: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: UI.primary,
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    shadowColor: UI.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
