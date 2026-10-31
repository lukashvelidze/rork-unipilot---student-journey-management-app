import * as FileSystem from "expo-file-system/legacy";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchProfileDetails, profileCompletion } from "@/lib/profileDetails";
import { fetchJourneysWithProgress } from "@/lib/journeyProgress";

// --------------------------------------------------------------------------
// AI resume feedback
// --------------------------------------------------------------------------

export interface ResumeSuggestion {
  section: string;
  issue: string;
  suggestion: string;
}

export interface ResumeReview {
  id?: string;
  file_name: string | null;
  score: number;
  summary: string;
  strengths: string;
  suggestions: ResumeSuggestion[];
  created_at?: string;
}

const MAX_BYTES = 7 * 1024 * 1024;

export const fetchLatestResumeReview = async (): Promise<ResumeReview | null> => {
  const { data, error } = await supabase
    .from("resume_reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("Could not load resume review:", error);
    return null;
  }
  return (data as ResumeReview) ?? null;
};

/** Send a picked CV (PDF or image) for review. Throws with a user-facing message. */
export const reviewResume = async (file: {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
}): Promise<ResumeReview> => {
  if (file.size && file.size > MAX_BYTES) throw new Error("That file is too large. Keep it under 7 MB.");
  const data = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });

  const { data: result, error } = await supabase.functions.invoke("interview-feedback", {
    body: { action: "resume", data, mimeType: file.mimeType, fileName: file.name },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? "We couldn't review this file. Please try again.");
    }
    throw new Error("We couldn't review this file. Check your connection and try again.");
  }
  return (result as { review: ResumeReview }).review;
};

// --------------------------------------------------------------------------
// career readiness
// --------------------------------------------------------------------------

export const CAREER_SKILLS: { key: string; label: string; hint: string }[] = [
  { key: "communication", label: "Communication", hint: "Presentations, writing, debating" },
  { key: "teamwork", label: "Teamwork", hint: "Group projects, sports, societies" },
  { key: "leadership", label: "Leadership", hint: "Led a team, club or initiative" },
  { key: "problem_solving", label: "Problem solving", hint: "Competitions, projects, research" },
  { key: "digital", label: "Digital skills", hint: "Spreadsheets, coding, design tools" },
  { key: "languages", label: "Languages", hint: "Speak two or more languages" },
  { key: "work_experience", label: "Work experience", hint: "Part-time job, internship, volunteering" },
  { key: "networking", label: "Professional network", hint: "LinkedIn, mentors, alumni contacts" },
];

export interface ReadinessFactor {
  key: string;
  label: string;
  /** 0-1 */
  value: number;
  weight: number;
  detail: string;
  action?: { label: string; route: string };
}

export interface CareerReadiness {
  score: number;
  factors: ReadinessFactor[];
  skills: string[];
}

/** Blend of skills, CV quality, interview practice, profile and career-stage progress. */
export const fetchCareerReadiness = async (): Promise<CareerReadiness> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const [profileRes, review, sessions, profile, journeys] = await Promise.all([
    supabase.from("profiles").select("career_skills").eq("id", user.id).single(),
    fetchLatestResumeReview(),
    supabase
      .from("interview_sessions")
      .select("score")
      .eq("status", "scored")
      .order("started_at", { ascending: false })
      .limit(5),
    fetchProfileDetails().catch(() => null),
    fetchJourneysWithProgress().catch(() => ({ journeys: [] })),
  ]);

  const skills: string[] = profileRes.data?.career_skills ?? [];
  const scores = (sessions.data ?? []).map((s: { score: number | null }) => s.score ?? 0);
  const bestInterview = scores.length ? Math.max(...scores) : null;
  const completion = profile ? profileCompletion(profile) : null;
  const careerTasks = journeys.journeys
    .flatMap((j) => j.progress)
    .filter((stage) => stage.stage === "career" || stage.stage === "academic")
    .flatMap((stage) => stage.tasks);
  const careerDone = careerTasks.filter((t) => t.completed).length;

  const factors: ReadinessFactor[] = [
    {
      key: "skills",
      label: "Employability skills",
      value: skills.length / CAREER_SKILLS.length,
      weight: 0.3,
      detail: `${skills.length} of ${CAREER_SKILLS.length} skills built`,
    },
    {
      key: "cv",
      label: "CV quality",
      value: review ? review.score / 10 : 0,
      weight: 0.2,
      detail: review ? `Last review scored ${review.score}/10` : "No CV reviewed yet",
      action: { label: review ? "Review again" : "Review my CV", route: "/toolkit/resume" },
    },
    {
      key: "interview",
      label: "Interview practice",
      value: bestInterview !== null ? bestInterview / 10 : 0,
      weight: 0.2,
      detail: bestInterview !== null ? `Best score ${bestInterview}/10` : "No scored practice yet",
      action: { label: "Practise", route: "/premium/interview-simulator" },
    },
    {
      key: "profile",
      label: "Profile",
      value: completion ? completion.percent / 100 : 0,
      weight: 0.15,
      detail: completion ? `${completion.percent}% complete` : "Not started",
      action: { label: "Complete profile", route: "/profile/edit" },
    },
    {
      key: "career_tasks",
      label: "Academic & career tasks",
      value: careerTasks.length ? careerDone / careerTasks.length : 0,
      weight: 0.15,
      detail: careerTasks.length ? `${careerDone} of ${careerTasks.length} done` : "Unlocks later in your roadmap",
      action: { label: "Open tasks", route: "/(tabs)/journey" },
    },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0) * 100);
  return { score, factors, skills };
};

export const saveCareerSkills = async (skills: string[]) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("profiles").update({ career_skills: skills }).eq("id", user.id);
  if (error) throw error;
};
