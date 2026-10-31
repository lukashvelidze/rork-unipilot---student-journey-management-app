// interview-feedback
// --------------------------------------------------------------------------
// Backs the Interview Simulator.
//
//   action: "status" -> how many free sessions the caller has used.
//   action: "start"  -> opens a session (enforces the free-tier limit).
//   action: "finish" -> stores the transcript and scores it out of 10 with
//                       key strengths and improvements (Gemini).
//   action: "resume" -> reviews an uploaded CV (PDF or image) and returns a
//                       score, strengths and line-by-line suggestions.
//
// Every action requires the caller's Supabase JWT.
// --------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";
const MODEL_CHAIN = Array.from(
  new Set([
    Deno.env.get("GENERATE_JOURNEY_MODEL") || "gemini-2.5-flash",
    ...(Deno.env.get("GENERATE_JOURNEY_FALLBACK_MODELS") ?? "gemini-flash-latest,gemini-flash-lite-latest")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  ]),
);

// Free students get this many simulator sessions; Pro (and every legacy paid tier) is unlimited.
const FREE_SESSION_LIMIT = 3;
const UNLIMITED_TIERS = new Set(["pro", "premium", "standard", "basic"]);
// Sessions that never got going don't use up an allowance.
const MIN_COUNTED_SECONDS = 20;
const MIN_STUDENT_TURNS = 2;
const MAX_TRANSCRIPT_TURNS = 120;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

type Turn = { role: "agent" | "user"; text: string };

// --------------------------------------------------------------------------
// usage
// --------------------------------------------------------------------------

async function usageFor(admin: SupabaseClient, userId: string) {
  const [{ data: profile }, { count }] = await Promise.all([
    admin.from("profiles").select("subscription_tier").eq("id", userId).maybeSingle(),
    admin
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["completed", "scored"])
      .gte("duration_seconds", MIN_COUNTED_SECONDS),
  ]);
  const tier = String(profile?.subscription_tier ?? "free").toLowerCase();
  const unlimited = UNLIMITED_TIERS.has(tier);
  const used = count ?? 0;
  return {
    tier,
    unlimited,
    used,
    limit: unlimited ? null : FREE_SESSION_LIMIT,
    remaining: unlimited ? null : Math.max(FREE_SESSION_LIMIT - used, 0),
  };
}

// --------------------------------------------------------------------------
// scoring
// --------------------------------------------------------------------------

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

async function gemini(prompt: string, extraParts: GeminiPart[] = [], maxOutputTokens = 1200): Promise<string> {
  let lastError = "no model available";
  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.3,
        maxOutputTokens,
        responseMimeType: "application/json",
      };
      if (model.startsWith("gemini-2.5")) generationConfig.thinkingConfig = { thinkingBudget: 0 };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [...extraParts, { text: prompt }] }],
            generationConfig,
          }),
        },
      );
      if (res.ok) {
        const body = await res.json();
        const text = (body?.candidates?.[0]?.content?.parts ?? [])
          .map((p: { text?: string }) => p.text ?? "")
          .join("")
          .trim();
        if (text) return text;
        lastError = `${model} returned no text`;
        break;
      }
      lastError = `${model} ${res.status}: ${(await res.text()).slice(0, 300)}`;
      // Quota, retired model or rejected options: try the next model.
      if ([400, 404, 429].includes(res.status)) break;
      if (res.status >= 500 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      break;
    }
  }
  throw new Error(lastError);
}

async function scoreTranscript(transcript: Turn[]) {
  const dialogue = transcript
    .map((turn) => `${turn.role === "agent" ? "Interviewer" : "Student"}: ${turn.text}`)
    .join("\n");

  const prompt = `You are an experienced admissions and student-visa interview coach. Evaluate the STUDENT's performance in this practice interview.

Score from 0 to 10 for clarity, relevance, confidence, specificity about study plans and finances, and honesty. Be encouraging but candid; ignore transcription glitches.

Return ONLY JSON:
{ "score": integer 0-10,
  "strengths": "2-3 short sentences on what the student did well, citing specifics",
  "improvements": "2-3 short sentences with concrete, actionable advice for next time" }

Transcript:
${dialogue}`;

  const raw = await gemini(prompt);
  const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
  const score = Math.round(Number(parsed.score));
  if (!Number.isFinite(score)) throw new Error("model returned no score");
  return {
    score: Math.min(Math.max(score, 0), 10),
    strengths: String(parsed.strengths ?? "").trim().slice(0, 800),
    improvements: String(parsed.improvements ?? "").trim().slice(0, 800),
  };
}

// --------------------------------------------------------------------------
// actions
// --------------------------------------------------------------------------

async function handleStart(admin: SupabaseClient, userId: string) {
  const usage = await usageFor(admin, userId);
  if (!usage.unlimited && usage.used >= FREE_SESSION_LIMIT) {
    return json({ error: "Free sessions used up", limitReached: true, usage }, 403);
  }
  const { data, error } = await admin
    .from("interview_sessions")
    .insert({ user_id: userId, status: "started" })
    .select("id")
    .single();
  if (error || !data) return json({ error: `Could not start session: ${error?.message}` }, 500);
  return json({ sessionId: data.id, usage });
}

async function handleFinish(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const sessionId = String(body.sessionId ?? "");
  if (!sessionId) return json({ error: "Missing sessionId" }, 400);

  const { data: session } = await admin
    .from("interview_sessions")
    .select("id, user_id, started_at, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.user_id !== userId) return json({ error: "Session not found" }, 404);
  if (session.status !== "started") return json({ error: "Session already finished" }, 409);

  const transcript: Turn[] = (Array.isArray(body.transcript) ? body.transcript : [])
    .filter((t: unknown): t is Turn => {
      const turn = t as Turn;
      return !!turn && (turn.role === "agent" || turn.role === "user") &&
        typeof turn.text === "string" && turn.text.trim().length > 0;
    })
    .slice(0, MAX_TRANSCRIPT_TURNS)
    .map((t) => ({ role: t.role, text: t.text.trim().slice(0, 2000) }));

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000),
  );
  const studentTurns = transcript.filter((t) => t.role === "user").length;

  const base = {
    ended_at: new Date().toISOString(),
    duration_seconds: durationSeconds,
    transcript,
  };

  if (studentTurns < MIN_STUDENT_TURNS) {
    await admin.from("interview_sessions").update({ ...base, status: "completed" }).eq("id", sessionId);
    return json({
      scored: false,
      reason: "Too short to score. Answer at least a couple of questions to get feedback.",
      usage: await usageFor(admin, userId),
    });
  }

  try {
    const feedback = await scoreTranscript(transcript);
    await admin
      .from("interview_sessions")
      .update({ ...base, status: "scored", ...feedback })
      .eq("id", sessionId);
    return json({ scored: true, feedback, usage: await usageFor(admin, userId) });
  } catch (e) {
    console.error("interview scoring failed", e);
    await admin.from("interview_sessions").update({ ...base, status: "completed" }).eq("id", sessionId);
    return json({
      scored: false,
      reason: "We couldn't generate feedback right now. Your session was saved.",
      usage: await usageFor(admin, userId),
    });
  }
}

// --------------------------------------------------------------------------
// resume review
// --------------------------------------------------------------------------

const RESUME_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"]);
// base64 of ~7 MB; Gemini accepts inline files up to 20 MB.
const MAX_RESUME_BASE64 = 9_500_000;

async function handleResume(admin: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const mimeType = String(body.mimeType ?? "").toLowerCase();
  const data = String(body.data ?? "");
  const fileName = String(body.fileName ?? "CV").slice(0, 200);
  if (!RESUME_MIME_TYPES.has(mimeType)) return json({ error: "Upload a PDF or an image of your CV." }, 400);
  if (!data) return json({ error: "The file is empty." }, 400);
  if (data.length > MAX_RESUME_BASE64) return json({ error: "That file is too large. Keep it under 7 MB." }, 413);

  const { data: profile } = await admin
    .from("profiles")
    .select("level_of_study, destination_country, intended_majors")
    .eq("id", userId)
    .maybeSingle();
  const context = [
    profile?.level_of_study ? `current level: ${profile.level_of_study}` : null,
    profile?.destination_country ? `applying to study in: ${profile.destination_country}` : null,
    profile?.intended_majors?.length ? `intended majors: ${profile.intended_majors.join(", ")}` : null,
  ].filter(Boolean).join("; ");

  const prompt = `You are an admissions and careers adviser reviewing a student's CV/resume for university applications abroad${context ? ` (${context})` : ""}.

If the file is not a CV or resume, return {"notResume": true}.

Otherwise return ONLY JSON:
{ "score": integer 0-10 for how ready this CV is for international university applications,
  "summary": "one or two sentences on the overall impression",
  "strengths": "2-3 short sentences on what works well",
  "suggestions": [ { "section": "e.g. Education, Experience, Skills, Formatting", "issue": "what is weak or missing, quoting the line when relevant", "suggestion": "a concrete rewrite or fix" } ] }
Give 4-8 suggestions, most important first.`;

  let parsed: Record<string, unknown>;
  try {
    const raw = await gemini(prompt, [{ inline_data: { mime_type: mimeType, data } }], 3000);
    parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
  } catch (e) {
    console.error("resume review failed", e);
    return json({ error: "We couldn't review this file right now. Please try again." }, 502);
  }
  if (parsed.notResume) return json({ error: "This doesn't look like a CV. Try another file." }, 422);

  const score = Math.min(Math.max(Math.round(Number(parsed.score)) || 0, 0), 10);
  const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
    .filter((item: unknown) => item && typeof (item as { suggestion?: unknown }).suggestion === "string")
    .slice(0, 8)
    .map((item: Record<string, unknown>) => ({
      section: String(item.section ?? "General").slice(0, 60),
      issue: String(item.issue ?? "").slice(0, 400),
      suggestion: String(item.suggestion ?? "").slice(0, 600),
    }));
  const review = {
    user_id: userId,
    file_name: fileName,
    score,
    summary: String(parsed.summary ?? "").slice(0, 600),
    strengths: String(parsed.strengths ?? "").slice(0, 800),
    suggestions,
  };
  const { data: saved, error } = await admin.from("resume_reviews").insert(review).select("*").single();
  if (error) console.error("could not save resume review", error);
  return json({ review: saved ?? review });
}

// --------------------------------------------------------------------------
// entrypoint
// --------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Missing Supabase configuration" }, 500);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Missing authorization token" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth?.user) return json({ error: "Unauthorized" }, 401);
  const userId = auth.user.id;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // empty body -> status
  }

  try {
    switch (String(body.action ?? "status")) {
      case "status":
        return json({ usage: await usageFor(admin, userId) });
      case "start":
        return await handleStart(admin, userId);
      case "resume":
        if (!GEMINI_API_KEY) return json({ error: "Missing GEMINI_API_KEY secret" }, 500);
        return await handleResume(admin, userId, body);
      case "finish":
        if (!GEMINI_API_KEY) return json({ error: "Missing GEMINI_API_KEY secret" }, 500);
        return await handleFinish(admin, userId, body);
      default:
        return json({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (e) {
    console.error("interview-feedback error", e);
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
