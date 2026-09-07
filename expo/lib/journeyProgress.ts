import { supabase } from "@/lib/supabase";
import { JourneyProgress, JourneyStage, Task } from "@/types/user";

const allowedTiers: Record<string, string[]> = {
  free: ["free"],
  basic: ["free", "basic"],
  standard: ["free", "basic", "standard"],
  premium: ["free", "basic", "standard", "premium"],
  pro: ["free", "basic", "standard", "premium"],
};

const normalizeTier = (tier?: string | null) => {
  const normalized = (tier || "free").toLowerCase();
  return normalized === "pro" ? "premium" : normalized;
};

const determineStage = (title: string): JourneyStage => {
  const titleLower = title.toLowerCase();
  const mapping: { match: RegExp; stage: JourneyStage }[] = [
    { match: /research|university|program/, stage: "research" },
    { match: /application|apply/, stage: "application" },
    { match: /visa|immigration/, stage: "visa" },
    { match: /pre[-\s]?departure|document|financial|insurance|pre-arrival/, stage: "pre_departure" },
    { match: /arrival|orientation|accommodation|housing|campus/, stage: "arrival" },
    { match: /academic|class|course/, stage: "academic" },
    { match: /career|internship|job/, stage: "career" },
  ];

  return mapping.find(({ match }) => match.test(titleLower))?.stage || "pre_departure";
};

export const canAccessJourneyTier = (userTier?: string | null, requiredTier?: string) => {
  if (!requiredTier) return true;
  const normalizedUserTier = normalizeTier(userTier);
  const normalizedRequiredTier = normalizeTier(requiredTier);
  return (allowedTiers[normalizedUserTier] || allowedTiers.free).includes(normalizedRequiredTier);
};

export const formatJourneyTierLabel = (tier?: string) => {
  if (!tier) return "Premium";
  const normalized = normalizeTier(tier);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const fetchJourneyProgressFromSupabase = async (): Promise<{
  progress: JourneyProgress[];
  userTier: string;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { progress: [], userTier: "free" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("visa_type, destination_country, subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching journey profile:", profileError);
  }

  const userTier = normalizeTier(profile?.subscription_tier);
  if (!profile?.visa_type || !profile?.destination_country) {
    return { progress: [], userTier };
  }

  const tiersToShow = userTier === "free"
    ? ["free", "basic", "standard", "premium"]
    : (allowedTiers[userTier] || allowedTiers.free);
  const countryCode = profile.destination_country.trim().toUpperCase();
  const visaType = profile.visa_type.trim();
  const checklistFilter = `and(visa_type.eq.${visaType},country_code.eq.${countryCode}),and(visa_type.eq.${visaType},country_code.is.null)`;

  const { data: checklistsData, error: checklistsError } = await supabase
    .from("checklists")
    .select("*")
    .or(checklistFilter)
    .in("subscription_tier", tiersToShow)
    .order("sort_order", { ascending: true });

  if (checklistsError) {
    console.error("Error fetching journey checklists:", checklistsError);
    return { progress: [], userTier };
  }

  if (!checklistsData?.length) {
    return { progress: [], userTier };
  }

  const checklistIds = checklistsData.map((checklist: any) => checklist.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .in("checklist_id", checklistIds)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("Error fetching journey checklist items:", itemsError);
    return { progress: [], userTier };
  }

  if (!itemsData?.length) {
    return { progress: [], userTier };
  }

  const itemIds = itemsData.map((item: any) => item.id);
  const { data: progressData, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .in("checklist_item_id", itemIds);

  if (progressError) {
    console.error("Error fetching user journey progress:", progressError);
  }

  const progressMap = new Map<string, any>();
  (progressData || []).forEach((entry: any) => {
    progressMap.set(entry.checklist_item_id, entry);
  });

  const progress = checklistsData.map((checklist: any) => {
    const tasks: Task[] = itemsData
      .filter((item: any) => item.checklist_id === checklist.id)
      .map((item: any) => {
        const progressEntry = progressMap.get(item.id);
        const completed = !!progressEntry?.is_completed;
        const completedDate = completed
          ? progressEntry?.updated_at || progressEntry?.created_at || new Date().toISOString()
          : undefined;

        return {
          id: item.id,
          title: item.label,
          completed,
          completedDate,
          checklistId: checklist.id,
          checklistTitle: checklist.title,
        };
      });

    const completedCount = tasks.filter((task) => task.completed).length;
    const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return {
      id: checklist.id,
      stage: determineStage(checklist.title),
      title: checklist.title,
      description: checklist.description || undefined,
      subscriptionTier: checklist.subscription_tier,
      progress: progressPercent,
      completed: progressPercent === 100,
      completedDate: progressPercent === 100 ? new Date().toISOString() : undefined,
      tasks,
      hasAcceptance: tasks.some((task) => task.title.includes("Receive acceptance letter") && task.completed),
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
};
