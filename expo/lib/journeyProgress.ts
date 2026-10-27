import { supabase } from "@/lib/supabase";
import { JourneyProgress, JourneyStage, Task } from "@/types/user";
import {
  buildCountryRouteCode,
  fetchUserJourneys,
  requestMissingJourneyRoutes,
  UserJourneyWithUniversity,
} from "@/lib/journeyRoutes";

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

// generate-journey prefixes some titles ("Research: English Language
// Preparation") so determineStage files them under the right stage. The stage
// is derived from the full title; users see it without the prefix.
const GENERATED_STAGE_PREFIX =
  /^(Research|Application|Visa & immigration|Pre-departure & documents|Arrival & orientation|Academic start|Career & internships):\s+/i;

const displayChecklistTitle = (title: string) => {
  const stripped = title.replace(GENERATED_STAGE_PREFIX, "").trim();
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : title;
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

const tiersToShowFor = (userTier: string) =>
  userTier === "free"
    ? ["free", "basic", "standard", "premium"]
    : allowedTiers[userTier] || allowedTiers.free;

/**
 * Turn a set of checklists (matched by visa_type + country) into JourneyProgress
 * stages, merged with the user's per-item progress.
 */
const buildProgressForVisaType = async (
  userId: string,
  visaType: string,
  countryCode: string,
  tiersToShow: string[],
): Promise<JourneyProgress[]> => {
  const checklistFilter = `and(visa_type.eq.${visaType},country_code.eq.${countryCode}),and(visa_type.eq.${visaType},country_code.is.null)`;

  const { data: checklistsData, error: checklistsError } = await supabase
    .from("checklists")
    .select("*")
    .or(checklistFilter)
    .in("subscription_tier", tiersToShow)
    .order("sort_order", { ascending: true });

  if (checklistsError || !checklistsData?.length) {
    if (checklistsError) console.error("Error fetching journey checklists:", checklistsError);
    return [];
  }

  const checklistIds = checklistsData.map((checklist: any) => checklist.id);
  const { data: itemsData, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .in("checklist_id", checklistIds)
    .order("sort_order", { ascending: true });

  if (itemsError || !itemsData?.length) {
    if (itemsError) console.error("Error fetching journey checklist items:", itemsError);
    return [];
  }

  const itemIds = itemsData.map((item: any) => item.id);
  const { data: progressData, error: progressError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .in("checklist_item_id", itemIds);

  if (progressError) console.error("Error fetching user journey progress:", progressError);

  const progressMap = new Map<string, any>();
  (progressData || []).forEach((entry: any) => {
    progressMap.set(entry.checklist_item_id, entry);
  });

  return checklistsData.map((checklist: any) => {
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
          // Generated hints can carry search citation markers such as "[7]".
          hint:
            typeof item.metadata?.hint === "string"
              ? item.metadata.hint.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "").trim() || undefined
              : undefined,
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
      title: displayChecklistTitle(checklist.title),
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
};

/** Which checklist set a journey is currently showing. */
export type JourneySource = "university" | "country_route" | "visa" | "none";

/**
 * Progress for one journey. Tries, in order: the university-specific route,
 * the country-level route for the student's (origin x level), and the
 * country visa type the user picked.
 */
export const fetchJourneyProgressForRoute = async (input: {
  userId: string;
  routeVisaCode?: string | null;
  countryRouteCode?: string | null;
  countryVisaType?: string | null;
  destinationCountryCode: string;
  userTier: string;
}): Promise<{ progress: JourneyProgress[]; source: JourneySource }> => {
  const countryCode = input.destinationCountryCode.trim().toUpperCase();
  const tiers = tiersToShowFor(normalizeTier(input.userTier));

  const attempts: Array<[string | null | undefined, JourneySource]> = [
    [input.routeVisaCode, "university"],
    [input.countryRouteCode, "country_route"],
    [input.countryVisaType, "visa"],
  ];
  for (const [code, source] of attempts) {
    if (!code) continue;
    const progress = await buildProgressForVisaType(input.userId, code.trim(), countryCode, tiers);
    if (progress.length > 0) return { progress, source };
  }

  return { progress: [], source: "none" };
};

export interface JourneyWithProgress {
  journey: UserJourneyWithUniversity | null;
  /** Stable id for switcher UI — the user_journeys row id, or "legacy". */
  key: string;
  label: string;
  destinationCountryCode: string;
  routeVisaCode: string | null;
  progress: JourneyProgress[];
  /**
   * "university" once the university's own route exists; anything else means
   * a fallback checklist is shown while that route is generated.
   */
  source: JourneySource;
}

/**
 * Every study journey a user has. Reads user_journeys; if there are none, falls
 * back to the single legacy journey stored on the profile.
 */
export const fetchJourneysWithProgress = async (): Promise<{
  journeys: JourneyWithProgress[];
  userTier: string;
}> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { journeys: [], userTier: "free" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("visa_type, destination_country, subscription_tier")
    .eq("id", user.id)
    .single();

  const userTier = normalizeTier(profile?.subscription_tier);
  const journeyRows = await fetchUserJourneys(user.id);

  if (journeyRows.length > 0) {
    const journeys = await Promise.all(
      journeyRows.map(async (row) => {
        const { progress, source } = await fetchJourneyProgressForRoute({
          userId: user.id,
          routeVisaCode: row.route_visa_code,
          countryRouteCode: buildCountryRouteCode(
            row.destination_country_code,
            row.origin_country_code,
            row.education_level,
          ),
          countryVisaType: row.country_visa_type,
          destinationCountryCode: row.destination_country_code,
          userTier,
        });
        return {
          journey: row,
          key: row.id,
          label: row.university?.name || row.destination_country_code,
          destinationCountryCode: row.destination_country_code,
          routeVisaCode: row.route_visa_code,
          progress,
          source,
        } as JourneyWithProgress;
      }),
    );
    return { journeys, userTier };
  }

  // Legacy: single journey on the profile.
  if (!profile?.visa_type || !profile?.destination_country) {
    return { journeys: [], userTier };
  }

  const { progress, source } = await fetchJourneyProgressForRoute({
    userId: user.id,
    routeVisaCode: null,
    countryVisaType: profile.visa_type,
    destinationCountryCode: profile.destination_country,
    userTier,
  });

  return {
    journeys: [
      {
        journey: null,
        key: "legacy",
        label: profile.destination_country,
        destinationCountryCode: profile.destination_country,
        routeVisaCode: null,
        progress,
        source,
      },
    ],
    userTier,
  };
};

/**
 * Back-compat entry point (used by the home tab). Returns the PRIMARY / first
 * journey's progress.
 */
export const fetchJourneyProgressFromSupabase = async (): Promise<{
  progress: JourneyProgress[];
  userTier: string;
}> => {
  const { journeys, userTier } = await fetchJourneysWithProgress();
  return { progress: journeys[0]?.progress ?? [], userTier };
};

const RETRY_MISSING_ROUTES_MS = 10 * 60 * 1000;
let lastRouteRequestAt = 0;

/**
 * If any university journey is still on a fallback checklist, ask the server
 * to (re)generate it. Throttled per app session; the server also skips routes
 * that are already generating or keep failing.
 */
export const ensureUniversityRoutes = (journeys: JourneyWithProgress[]) => {
  const missing = journeys.some((j) => j.journey?.university && j.source !== "university");
  if (!missing || Date.now() - lastRouteRequestAt < RETRY_MISSING_ROUTES_MS) return;
  lastRouteRequestAt = Date.now();
  void requestMissingJourneyRoutes();
};
