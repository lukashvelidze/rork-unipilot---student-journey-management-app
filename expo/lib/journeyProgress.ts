import { supabase } from "@/lib/supabase";
import type { JourneyProgress, JourneyStage, Task } from "@/types/user";

const TIER_ACCESS: Record<string, string[]> = {
  free: ["free", "basic", "standard", "premium"],
  basic: ["free", "basic"],
  standard: ["free", "basic", "standard"],
  premium: ["free", "basic", "standard", "premium"],
  pro: ["free", "basic", "standard", "premium"],
};

const determineStage = (title: string): JourneyStage => {
  const normalized = title.toLowerCase();
  const mappings: Array<[RegExp, JourneyStage]> = [
    [/research|university|program/, "research"],
    [/application|apply/, "application"],
    [/visa|immigration/, "visa"],
    [/pre[-\s]?departure|document|financial|insurance|pre-arrival/, "pre_departure"],
    [/arrival|orientation|accommodation|housing/, "arrival"],
    [/academic|class|course/, "academic"],
    [/career|internship|job/, "career"],
  ];

  return (
    mappings.find(([pattern]) => pattern.test(normalized))?.[1] ??
    "pre_departure"
  );
};

export interface LoadedJourneyProgress {
  progress: JourneyProgress[];
  userTier: string;
}

export async function loadJourneyProgress(): Promise<LoadedJourneyProgress> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { progress: [], userTier: "free" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("visa_type, destination_country, subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile?.visa_type || !profile?.destination_country) {
    return {
      progress: [],
      userTier: profile?.subscription_tier || "free",
    };
  }

  const userTier =
    profile.subscription_tier === "pro"
      ? "premium"
      : profile.subscription_tier || "free";
  const countryCode = profile.destination_country.trim().toUpperCase();
  const visaType = profile.visa_type.trim();
  const filter = `and(visa_type.eq.${visaType},country_code.eq.${countryCode}),and(visa_type.eq.${visaType},country_code.is.null)`;

  const { data: checklists, error: checklistError } = await supabase
    .from("checklists")
    .select("*")
    .or(filter)
    .in("subscription_tier", TIER_ACCESS[userTier] || TIER_ACCESS.free)
    .order("sort_order", { ascending: true });

  if (checklistError) throw checklistError;
  if (!checklists?.length) return { progress: [], userTier };

  const checklistIds = checklists.map((checklist) => checklist.id);
  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .in("checklist_id", checklistIds)
    .order("sort_order", { ascending: true });

  if (itemsError) throw itemsError;

  const itemIds = (items || []).map((item) => item.id);
  const progressByItem = new Map<string, any>();

  if (itemIds.length > 0) {
    const { data: userProgress, error: progressError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("checklist_item_id", itemIds);

    if (progressError) throw progressError;
    (userProgress || []).forEach((entry) => {
      progressByItem.set(entry.checklist_item_id, entry);
    });
  }

  const progress: JourneyProgress[] = checklists.map((checklist) => {
    const tasks: Task[] = (items || [])
      .filter((item) => item.checklist_id === checklist.id)
      .map((item) => {
        const entry = progressByItem.get(item.id);
        const completed = !!entry?.is_completed;
        return {
          id: item.id,
          title: item.label,
          completed,
          completedDate: completed
            ? entry.updated_at || entry.created_at
            : undefined,
        };
      });

    const completedTasks = tasks.filter((task) => task.completed).length;
    const progressPercent =
      tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    return {
      id: checklist.id,
      stage: determineStage(checklist.title),
      title: checklist.title,
      description: checklist.description || undefined,
      subscriptionTier: checklist.subscription_tier,
      progress: progressPercent,
      completed: progressPercent === 100,
      completedDate:
        progressPercent === 100 ? new Date().toISOString() : undefined,
      tasks,
      hasAcceptance: tasks.some(
        (task) =>
          task.title.includes("🎉 Receive acceptance letter") && task.completed,
      ),
      checklists: [
        {
          id: checklist.id,
          title: checklist.title,
          subscriptionTier: checklist.subscription_tier,
          items: tasks,
        },
      ],
    };
  });

  return { progress, userTier };
}

