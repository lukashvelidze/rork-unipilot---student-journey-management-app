import { supabase } from "@/lib/supabase";
import { canAccessJourneyTier, JourneyWithProgress } from "@/lib/journeyProgress";
import { getUniversityLevelDetails, upcomingDeadline } from "@/lib/journeyRoutes";
import { JourneyStage } from "@/types/user";

/**
 * Flat task model behind the Tasks tab: checklist items from the active
 * journey's stages plus tasks the student added themselves.
 */
export interface TaskEntry {
  key: string;
  id: string;
  source: "checklist" | "custom";
  title: string;
  hint?: string;
  completed: boolean;
  /** Stage the task belongs to (checklist tasks only). */
  stageId?: string;
  stageTitle?: string;
  stage?: JourneyStage;
  /** 1-based position of the task inside its stage, and the stage size. */
  step?: number;
  steps?: number;
  /** Locked behind a higher plan. */
  locked: boolean;
  requiredTier?: string;
  dueDate: string | null;
}

export interface UserTaskRecord {
  id: string;
  user_id: string;
  journey_id: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// Stages whose work has to be done before the university's application deadline.
const DEADLINE_STAGES = new Set<JourneyStage>(["research", "application"]);

export const STAGE_LABELS: Record<JourneyStage, string> = {
  research: "Research",
  application: "Application",
  visa: "Visa",
  pre_departure: "Documents",
  arrival: "Arrival",
  academic: "Academics",
  career: "Career",
};

/**
 * Tasks for one journey, in roadmap order. Research and application tasks are
 * due by the university's next application deadline for the student's level.
 */
export const buildTaskEntries = (
  journey: JourneyWithProgress | null,
  userTier: string,
  customTasks: UserTaskRecord[],
): TaskEntry[] => {
  const university = journey?.journey?.university ?? null;
  const level = journey?.journey?.education_level ?? null;
  const applicationDeadline = university
    ? upcomingDeadline(getUniversityLevelDetails(university, level)?.applicationDeadline)
    : null;

  const checklistTasks: TaskEntry[] = (journey?.progress ?? []).flatMap((stage) => {
    const locked = !canAccessJourneyTier(userTier, stage.subscriptionTier);
    return stage.tasks.map((task, index) => ({
      key: `checklist:${task.id}`,
      id: task.id,
      source: "checklist" as const,
      title: task.title,
      hint: task.hint,
      completed: task.completed,
      stageId: stage.id,
      stageTitle: stage.title,
      stage: stage.stage,
      step: index + 1,
      steps: stage.tasks.length,
      locked,
      requiredTier: stage.subscriptionTier,
      dueDate: DEADLINE_STAGES.has(stage.stage) ? applicationDeadline : null,
    }));
  });

  const journeyId = journey?.journey?.id ?? null;
  const own: TaskEntry[] = customTasks
    .filter((task) => !task.journey_id || task.journey_id === journeyId)
    .map((task) => ({
      key: `custom:${task.id}`,
      id: task.id,
      source: "custom" as const,
      title: task.title,
      hint: task.notes ?? undefined,
      completed: task.is_completed,
      locked: false,
      dueDate: task.due_date,
    }));

  return [...own, ...checklistTasks];
};

// --------------------------------------------------------------------------
// due dates
// --------------------------------------------------------------------------

export type DueStatus = "overdue" | "today" | "tomorrow" | "soon" | "later";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseIsoDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysUntil = (iso: string, today = new Date()) =>
  Math.round((parseIsoDate(iso).getTime() - startOfDay(today).getTime()) / 86_400_000);

export const dueStatus = (iso: string | null, today = new Date()): DueStatus | null => {
  if (!iso) return null;
  const days = daysUntil(iso, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "soon";
  return "later";
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Due today", "Due tomorrow", "Due in 3 days", "Due Oct 23rd", "Overdue". */
export const formatDue = (iso: string | null, today = new Date()): string | null => {
  const status = dueStatus(iso, today);
  if (!iso || !status) return null;
  if (status === "overdue") return "Overdue";
  if (status === "today") return "Due today";
  if (status === "tomorrow") return "Due tomorrow";
  if (status === "soon") return `Due in ${daysUntil(iso, today)} days`;
  const date = parseIsoDate(iso);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const sameYear = date.getFullYear() === today.getFullYear();
  return `Due ${MONTHS[date.getMonth()]} ${day}${suffix}${sameYear ? "" : ` ${date.getFullYear()}`}`;
};

/**
 * Order for "what should I do next": overdue and soon-due first, then roadmap
 * order. Locked and completed tasks are excluded by the caller.
 */
export const byPriority = (a: TaskEntry, b: TaskEntry) => {
  const rank = (task: TaskEntry) => {
    const status = dueStatus(task.dueDate);
    if (status === "overdue") return 0;
    if (status === "today" || status === "tomorrow") return 1;
    if (status === "soon") return 2;
    return 3;
  };
  return rank(a) - rank(b);
};

// --------------------------------------------------------------------------
// persistence
// --------------------------------------------------------------------------

/** Mark a checklist item done / not done for the signed-in student. */
export const setChecklistTaskCompleted = async (taskId: string, completed: boolean) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: existing, error: lookupError } = await supabase
    .from("user_progress")
    .select("checklist_item_id")
    .eq("user_id", user.id)
    .eq("checklist_item_id", taskId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const values = {
    is_completed: completed,
    value: completed ? {} : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabase
        .from("user_progress")
        .update(values)
        .eq("user_id", user.id)
        .eq("checklist_item_id", taskId)
    : await supabase
        .from("user_progress")
        .insert([{ user_id: user.id, checklist_item_id: taskId, ...values }]);
  if (error) throw error;
};

export const fetchUserTasks = async (): Promise<UserTaskRecord[]> => {
  const { data, error } = await supabase
    .from("user_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error loading custom tasks:", error);
    return [];
  }
  return (data || []) as UserTaskRecord[];
};

export const createUserTask = async (input: {
  title: string;
  dueDate: string | null;
  notes?: string | null;
  journeyId: string | null;
}): Promise<UserTaskRecord> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("user_tasks")
    .insert({
      user_id: user.id,
      journey_id: input.journeyId,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      due_date: input.dueDate,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as UserTaskRecord;
};

export const setUserTaskCompleted = async (taskId: string, completed: boolean) => {
  const { error } = await supabase
    .from("user_tasks")
    .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw error;
};

export const deleteUserTask = async (taskId: string) => {
  const { error } = await supabase.from("user_tasks").delete().eq("id", taskId);
  if (error) throw error;
};
