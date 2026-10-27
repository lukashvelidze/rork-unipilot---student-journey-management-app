import { supabase } from "@/lib/supabase";
import { EducationLevel } from "@/types/user";

export type TestScore = { type: string; score: string };

/** Everything the Edit Profile screen reads and writes on `profiles`. */
export interface ProfileDetails {
  full_name: string;
  email: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_city: string | null;
  phone: string | null;
  country_origin: string | null;
  current_school: string | null;
  graduation_year: number | null;
  gpa: number | null;
  gpa_scale: number | null;
  test_scores: TestScore[];
  level_of_study: EducationLevel | null;
  intended_majors: string[];
  destination_country: string | null;
  target_countries: string[];
  budget_min: number | null;
  budget_max: number | null;
  intake_term: string | null;
}

const COLUMNS =
  "full_name, email, avatar_url, date_of_birth, nationality, current_city, phone, country_origin, current_school, graduation_year, gpa, gpa_scale, test_scores, level_of_study, intended_majors, destination_country, target_countries, budget_min, budget_max, intake_term";

export const fetchProfileDetails = async (): Promise<ProfileDetails> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", user.id).single();
  if (error) throw error;

  return {
    full_name: data.full_name ?? "",
    email: data.email ?? user.email ?? "",
    avatar_url: data.avatar_url ?? null,
    date_of_birth: data.date_of_birth ?? null,
    nationality: data.nationality ?? null,
    current_city: data.current_city ?? null,
    phone: data.phone ?? null,
    country_origin: data.country_origin ?? null,
    current_school: data.current_school ?? null,
    graduation_year: data.graduation_year ?? null,
    gpa: data.gpa === null || data.gpa === undefined ? null : Number(data.gpa),
    gpa_scale: data.gpa_scale === null || data.gpa_scale === undefined ? null : Number(data.gpa_scale),
    test_scores: Array.isArray(data.test_scores) ? data.test_scores : [],
    level_of_study: (data.level_of_study as EducationLevel) ?? null,
    intended_majors: data.intended_majors ?? [],
    destination_country: data.destination_country ?? null,
    target_countries: data.target_countries ?? [],
    budget_min: data.budget_min ?? null,
    budget_max: data.budget_max ?? null,
    intake_term: data.intake_term ?? null,
  };
};

export const saveProfileDetails = async (patch: Partial<ProfileDetails>) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw error;
};

/** Upload a picked image to the avatars bucket and return its public URL. */
export const uploadAvatar = async (uri: string, mimeType = "image/jpeg"): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const extension = mimeType.includes("png") ? "png" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;
  const body = await (await fetch(uri)).arrayBuffer();

  const { error } = await supabase.storage.from("avatars").upload(path, body, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
};

/** Best-effort cleanup of a previously uploaded avatar. */
export const deleteAvatarFile = async (publicUrl: string | null) => {
  const marker = "/object/public/avatars/";
  if (!publicUrl || !publicUrl.includes(marker)) return;
  const path = publicUrl.split(marker)[1];
  await supabase.storage.from("avatars").remove([path]).catch(() => null);
};

// --------------------------------------------------------------------------
// completeness
// --------------------------------------------------------------------------

export type CompletionField = { key: string; label: string; filled: boolean };

/** The 12 details that make a profile "complete", in the order we prompt for them. */
export const profileCompletion = (profile: ProfileDetails) => {
  const fields: CompletionField[] = [
    { key: "full_name", label: "Full name", filled: !!profile.full_name.trim() },
    { key: "date_of_birth", label: "Date of birth", filled: !!profile.date_of_birth },
    { key: "nationality", label: "Nationality", filled: !!profile.nationality },
    { key: "current_city", label: "Current city", filled: !!profile.current_city },
    { key: "phone", label: "Phone number", filled: !!profile.phone },
    { key: "current_school", label: "Current school", filled: !!profile.current_school },
    { key: "graduation_year", label: "Graduation year", filled: !!profile.graduation_year },
    { key: "gpa", label: "GPA", filled: profile.gpa !== null },
    { key: "test_scores", label: "Test scores", filled: profile.test_scores.length > 0 },
    { key: "intended_majors", label: "Intended major", filled: profile.intended_majors.length > 0 },
    { key: "budget", label: "Budget range", filled: profile.budget_max !== null || profile.budget_min !== null },
    { key: "intake_term", label: "Intake term", filled: !!profile.intake_term },
  ];
  const filled = fields.filter((f) => f.filled).length;
  return {
    filled,
    total: fields.length,
    percent: Math.round((filled / fields.length) * 100),
    next: fields.find((f) => !f.filled) ?? null,
  };
};

// --------------------------------------------------------------------------
// options
// --------------------------------------------------------------------------

/** Degree students apply for, and the current level onboarding stores for it. */
export const DEGREE_OPTIONS: { label: string; hint: string; level: EducationLevel }[] = [
  { label: "Bachelor's degree", hint: "Finishing or finished high school", level: "high_school" },
  { label: "Master's degree", hint: "Have or finishing a bachelor's", level: "bachelors" },
  { label: "PhD / Doctorate", hint: "Have or finishing a master's", level: "masters" },
  { label: "Language course", hint: "Improve your English first", level: "language" },
  { label: "Something else", hint: "Exchange, foundation, other", level: "other" },
];

export const degreeLabelForLevel = (level: EducationLevel | null) =>
  level === "phd"
    ? "PhD / Doctorate"
    : DEGREE_OPTIONS.find((option) => option.level === level)?.label ?? null;

export const TEST_TYPES = ["IELTS", "TOEFL", "Duolingo", "SAT", "ACT", "GRE", "GMAT"];

export const GPA_SCALES = [4, 5, 10, 20, 100];

export const MAJOR_SUGGESTIONS = [
  "Computer Science", "Data Science", "Business Administration", "Economics", "Finance",
  "Engineering", "Mechanical Engineering", "Electrical Engineering", "Medicine", "Biology",
  "Psychology", "Law", "International Relations", "Architecture", "Design", "Mathematics",
  "Physics", "Chemistry", "Marketing", "Political Science", "Environmental Science", "Media & Communications",
];

export const BUDGET_OPTIONS: { label: string; min: number | null; max: number | null }[] = [
  { label: "Under $10k / yr", min: null, max: 10000 },
  { label: "$10k–$20k / yr", min: 10000, max: 20000 },
  { label: "$20k–$35k / yr", min: 20000, max: 35000 },
  { label: "$35k–$50k / yr", min: 35000, max: 50000 },
  { label: "$50k+ / yr", min: 50000, max: null },
];

export const budgetLabel = (min: number | null, max: number | null) =>
  BUDGET_OPTIONS.find((option) => option.min === min && option.max === max)?.label ??
  (min || max ? `$${Math.round((min ?? 0) / 1000)}k–$${Math.round((max ?? 0) / 1000)}k / yr` : null);

/** The next few intakes, e.g. ["Spring 2027", "Fall 2027", ...]. */
export const upcomingIntakes = (today = new Date()) => {
  const intakes: string[] = [];
  // Before September this year's fall intake is still ahead; after it, the
  // next intake is spring of next year.
  const pastFall = today.getMonth() >= 8;
  let year = today.getFullYear() + (pastFall ? 1 : 0);
  let fall = !pastFall;
  for (let i = 0; i < 6; i++) {
    intakes.push(`${fall ? "Fall" : "Spring"} ${year}`);
    if (fall) {
      fall = false;
      year += 1;
    } else {
      fall = true;
    }
  }
  return intakes;
};
