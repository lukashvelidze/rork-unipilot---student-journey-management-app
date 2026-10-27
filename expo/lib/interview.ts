import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface InterviewUsage {
  tier: string;
  unlimited: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface InterviewFeedback {
  score: number;
  strengths: string;
  improvements: string;
}

export type TranscriptTurn = { role: "agent" | "user"; text: string };

/** Call the interview-feedback function, surfacing JSON error bodies. */
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("interview-feedback", { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      if (payload) return Promise.reject(Object.assign(new Error(payload.error ?? "Request failed"), payload));
    }
    throw error;
  }
  return data as T;
}

export const fetchInterviewUsage = async (): Promise<InterviewUsage | null> => {
  try {
    const { usage } = await invoke<{ usage: InterviewUsage }>({ action: "status" });
    return usage;
  } catch (error) {
    console.warn("Could not load interview usage:", error);
    return null;
  }
};

/** Opens a session. Rejects with `limitReached: true` when free sessions are used up. */
export const startInterviewSession = (): Promise<{ sessionId: string; usage: InterviewUsage }> =>
  invoke({ action: "start" });

export const finishInterviewSession = (
  sessionId: string,
  transcript: TranscriptTurn[],
): Promise<{
  scored: boolean;
  feedback?: InterviewFeedback;
  reason?: string;
  usage: InterviewUsage;
}> => invoke({ action: "finish", sessionId, transcript });
