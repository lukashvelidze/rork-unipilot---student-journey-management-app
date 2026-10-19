import { supabase } from "@/lib/supabase";

/**
 * Study-abroad "route" helpers.
 *
 * The admin `generate-journey` edge function creates one visa_types row per
 * university, coded `ROUTE_STUDY_<DEST>_<ORIGIN>_<LEVEL>_<UNIVERSITY_SLUG>`, and
 * links its checklists to that code. The app mirrors the same code so it can look
 * a university's journey up. Keep this in sync with the edge function.
 */

/** Facts that depend on the student's education level (see universities.level_details). */
export interface UniversityLevelDetails {
  tuitionMinUsd?: number | null;
  tuitionMaxUsd?: number | null;
  scholarshipAvailable?: boolean | null;
  applicationDeadline?: string | null;
}

export interface UniversityRecord {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  city: string | null;
  ranking_global: number | null;
  website: string | null;
  is_featured: boolean;
  is_active: boolean;
  education_levels?: string[] | null;
  logo_url?: string | null;
  image_url?: string | null;
  tagline?: string | null;
  level_details?: Record<string, UniversityLevelDetails> | null;
  metadata?: { applicationSystem?: string | null; notes?: string | null } | null;
}

export interface UserJourneyRecord {
  id: string;
  user_id: string;
  university_id: string | null;
  destination_country_code: string;
  origin_country_code: string;
  education_level: string;
  route_visa_code: string;
  country_visa_type: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserJourneyWithUniversity extends UserJourneyRecord {
  university: UniversityRecord | null;
}

/**
 * Onboarding asks for the level a student is at NOW; journeys, routes and
 * university data are keyed by the level they are APPLYING for.
 */
const NEXT_STUDY_LEVEL: Record<string, string> = {
  high_school: "bachelors",
  bachelors: "masters",
  masters: "phd",
  phd: "phd",
  language: "language",
};

export const targetStudyLevel = (currentLevel: string): string =>
  NEXT_STUDY_LEVEL[currentLevel] ?? currentLevel;

/** Build the visa_types.code the generator uses for a (route x university). */
export const buildRouteVisaCode = (
  destinationCode: string,
  originCode: string,
  educationLevel: string,
  universitySlug: string,
): string =>
  `ROUTE_STUDY_${destinationCode}_${originCode}_${educationLevel}_${universitySlug}`
    .toUpperCase()
    .replace(/[^\w-]/g, "_")
    .slice(0, 150);

/**
 * Country-level route (no university) generated earlier by the admin console,
 * e.g. ROUTE_STUDY_HU_GE_bachelors. Used as a fallback while a university's
 * own route is still being generated.
 */
export const buildCountryRouteCode = (
  destinationCode: string,
  originCode: string,
  educationLevel: string,
): string =>
  `ROUTE_STUDY_${destinationCode.trim().toUpperCase()}_${originCode.trim().toUpperCase()}_${educationLevel.trim()}`;

/** Featured/active universities for a destination country (onboarding picker). */
export const fetchUniversitiesForCountry = async (
  destinationCountryCode: string,
): Promise<UniversityRecord[]> => {
  const code = destinationCountryCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from("universities")
    // "*" rather than a column list so the picker keeps working before the
    // university profile migration has been applied.
    .select("*")
    .eq("country_code", code)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("ranking_global", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading universities:", error);
    return [];
  }
  return (data || []) as UniversityRecord[];
};

/** All of a user's study journeys, newest primary first, with the university joined. */
export const fetchUserJourneys = async (
  userId: string,
): Promise<UserJourneyWithUniversity[]> => {
  const { data, error } = await supabase
    .from("user_journeys")
    .select(
      "*, university:universities(*)",
    )
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading user journeys:", error);
    return [];
  }
  return (data || []) as UserJourneyWithUniversity[];
};

interface CreateJourneyInput {
  userId: string;
  destinationCountryCode: string;
  originCountryCode: string;
  educationLevel: string;
  countryVisaType: string | null;
  universities: UniversityRecord[];
  /** When true, the first university becomes the primary journey. */
  makeFirstPrimary?: boolean;
}

/**
 * Create (idempotent) one user_journeys row per selected university.
 * Returns the rows that now exist for this (country x level).
 */
export const upsertUserJourneys = async ({
  userId,
  destinationCountryCode,
  originCountryCode,
  educationLevel,
  countryVisaType,
  universities,
  makeFirstPrimary = false,
}: CreateJourneyInput): Promise<UserJourneyRecord[]> => {
  const dest = destinationCountryCode.trim().toUpperCase();
  const origin = originCountryCode.trim().toUpperCase();

  if (universities.length === 0) return [];

  const { data: existingPrimary } = await supabase
    .from("user_journeys")
    .select("id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  const hasPrimary = !!existingPrimary;

  const rows = universities.map((university, index) => ({
    user_id: userId,
    university_id: university.id,
    destination_country_code: dest,
    origin_country_code: origin,
    education_level: educationLevel,
    route_visa_code: buildRouteVisaCode(dest, origin, educationLevel, university.slug),
    country_visa_type: countryVisaType,
    is_primary: !hasPrimary && makeFirstPrimary && index === 0,
  }));

  const { data, error } = await supabase
    .from("user_journeys")
    .upsert(rows, { onConflict: "user_id,university_id,education_level" })
    .select("*");

  if (error) {
    console.error("Error creating user journeys:", error);
    throw error;
  }
  return (data || []) as UserJourneyRecord[];
};

/**
 * Re-point a user's journeys after their home country or education level
 * changes, so each one targets the right generated route again.
 */
export const syncJourneyRoutes = async (
  userId: string,
  profile: { originCountryCode: string | null; currentLevel: string | null },
): Promise<void> => {
  if (!profile.originCountryCode || !profile.currentLevel) return;
  const origin = profile.originCountryCode.trim().toUpperCase();
  const level = targetStudyLevel(profile.currentLevel);

  const journeys = await fetchUserJourneys(userId);
  const stale = journeys.filter(
    (j) =>
      j.university &&
      (j.origin_country_code !== origin || j.education_level !== level),
  );
  if (stale.length === 0) return;

  for (const journey of stale) {
    const { error } = await supabase
      .from("user_journeys")
      .update({
        origin_country_code: origin,
        education_level: level,
        route_visa_code: buildRouteVisaCode(
          journey.destination_country_code,
          origin,
          level,
          journey.university!.slug,
        ),
      })
      .eq("id", journey.id)
      .eq("user_id", userId);
    if (error) console.warn("Could not update journey route:", error);
  }
  void requestMissingJourneyRoutes();
};

export const setPrimaryJourney = async (userId: string, journeyId: string) => {
  await supabase
    .from("user_journeys")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .eq("is_primary", true);
  const { error } = await supabase
    .from("user_journeys")
    .update({ is_primary: true })
    .eq("id", journeyId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const deleteUserJourney = async (userId: string, journeyId: string) => {
  const { error } = await supabase
    .from("user_journeys")
    .delete()
    .eq("id", journeyId)
    .eq("user_id", userId);
  if (error) throw error;
};

/**
 * Ask the generator to build any of the user's university routes that don't
 * exist yet for their (origin x level). Fire-and-forget: until a route is
 * ready the journey falls back to the country-level visa checklists.
 */
export const requestMissingJourneyRoutes = async (): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke("generate-journey", {
      body: { action: "request" },
    });
    if (error) console.warn("Journey generation request failed:", error);
  } catch (error) {
    console.warn("Journey generation request failed:", error);
  }
};

// Levels the university catalog records; other target levels aren't filtered.
const CATALOG_LEVELS = new Set(["bachelors", "masters"]);

/** Whether a university should be offered to a student applying at this level. */
export const offersStudyLevel = (university: UniversityRecord, targetLevel: string | null) => {
  if (!targetLevel || !CATALOG_LEVELS.has(targetLevel)) return true;
  const known = (university.education_levels || []).filter((level) => CATALOG_LEVELS.has(level));
  return known.length === 0 || known.includes(targetLevel);
};

// Closest level to borrow facts from when a level has none of its own.
const NEAREST_LEVEL: Record<string, string> = { phd: "masters", language: "bachelors" };

/** Level-specific details, falling back to the nearest level we have data for. */
export const getUniversityLevelDetails = (
  university: UniversityRecord,
  educationLevel: string | null | undefined,
): UniversityLevelDetails | null => {
  const details = university.level_details || {};
  if (educationLevel && details[educationLevel]) return details[educationLevel];
  const nearest = educationLevel ? NEAREST_LEVEL[educationLevel] : undefined;
  if (nearest && details[nearest]) return details[nearest];
  return Object.values(details)[0] || null;
};

/** "Top 30 Global" style badge from a world ranking. */
export const formatRankingBadge = (rankingGlobal: number | null | undefined): string | null => {
  if (!rankingGlobal || rankingGlobal <= 0) return null;
  const buckets = [10, 20, 30, 50, 100, 200, 500];
  const bucket = buckets.find((limit) => rankingGlobal <= limit);
  return bucket ? `Top ${bucket} Global` : `#${rankingGlobal} Global`;
};

const formatThousands = (usd: number) =>
  usd >= 1000 ? `$${Math.round(usd / 1000)}k` : `$${usd}`;

/** "$8k–$12k / yr", "Free", or null when unknown. */
export const formatTuitionRange = (details: UniversityLevelDetails | null): string | null => {
  const min = details?.tuitionMinUsd ?? null;
  const max = details?.tuitionMaxUsd ?? null;
  if (min === null && max === null) return null;
  if ((min ?? 0) === 0 && (max ?? 0) === 0) return "Free";
  if (min !== null && max !== null && min !== max) {
    return `${formatThousands(min)}–${formatThousands(max)} / yr`;
  }
  return `${formatThousands((max ?? min) as number)} / yr`;
};

/**
 * Deadlines repeat every intake, so a stored date that has passed is shown as
 * its next yearly occurrence. Returns an ISO date, or null.
 */
export const upcomingDeadline = (
  isoDate: string | null | undefined,
  today: Date = new Date(),
): string | null => {
  const match = isoDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  let year = Number(match[1]);
  while (`${year}-${match[2]}-${match[3]}` < todayIso) year++;
  return `${year}-${match[2]}-${match[3]}`;
};

/** "15 Jan 2027" for the next occurrence of a deadline, or null. */
export const formatDeadline = (isoDate: string | null | undefined): string | null => {
  const upcoming = upcomingDeadline(isoDate);
  if (!upcoming) return null;
  const [year, month, day] = upcoming.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[month - 1] ? `${day} ${months[month - 1]} ${year}` : null;
};

/** Emoji flag for an ISO country code. */
export const countryFlag = (code: string | null | undefined): string => {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0)),
  );
};
