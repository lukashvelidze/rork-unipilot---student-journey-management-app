// generate-journey
// --------------------------------------------------------------------------
// AI-driven study-abroad journey generator.
//
//   action: "start"    (admin JWT)      -> creates a job, discovers the featured
//                                          universities for the destination, then
//                                          kicks off the per-university fan-out.
//   action: "process"  (x-internal-key) -> generates + persists ONE university's
//                                          journey, then self-invokes for the next.
//   action: "resume"   (admin JWT)      -> restarts a stalled job.
//   action: "request"  (any user JWT)   -> queues generation for the caller's
//                                          user_journeys whose route is missing.
//   action: "catalog"  (admin JWT)      -> fills a country's university picker
//                                          (profiles, fees, logos) without journeys.
//   action: "enrich"   (admin JWT)      -> backfills university logos/photos.
//
// Each university becomes its own visa_types route:
//   ROUTE_STUDY_<DEST>_<ORIGIN>_<LEVEL>_<UNIVERSITY_SLUG>
// with a full set of checklists + checklist_items the app reads via
// profiles.visa_type -> checklists -> checklist_items.
//
// Note on the AI client: this talks to the Google Gemini API (generateContent)
// over raw fetch. It uses Google Search grounding for current university data.
// Get a free key at https://aistudio.google.com/apikey and set it as the
// GEMINI_API_KEY Supabase secret. GENERATE_JOURNEY_MODEL overrides the model.
// --------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY =
  Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";
const MODEL = Deno.env.get("GENERATE_JOURNEY_MODEL") || "gemini-2.5-flash";
// Tried in order once a model's request quota is exhausted (each model has its
// own) or it isn't available to this key. Google's rolling aliases keep this
// list valid as model versions are retired.
const MODEL_CHAIN = Array.from(
  new Set([
    MODEL,
    ...(Deno.env.get("GENERATE_JOURNEY_FALLBACK_MODELS") ?? "gemini-flash-latest,gemini-flash-lite-latest")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean),
  ]),
);
const unavailableModels = new Set<string>();
const ADMIN_EMAIL_DOMAIN = "@unipilot.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  foundation: "Foundation / Pathway",
  bachelors: "Bachelor's degree",
  masters: "Master's degree",
  phd: "PhD / doctoral",
  exchange: "Exchange / visiting",
  language: "Language course",
  high_school: "High school",
};

const STAGE_KEYWORDS: Record<string, RegExp> = {
  research: /research|university|program/i,
  application: /application|apply/i,
  visa: /visa|immigration/i,
  pre_departure: /pre[-\s]?departure|document|financial|insurance|pre-arrival/i,
  arrival: /arrival|orientation|accommodation|housing|campus/i,
  academic: /academic|class|course/i,
  career: /career|internship|job/i,
};

const STAGE_TITLE_PREFIX: Record<string, string> = {
  research: "Research",
  application: "Application",
  visa: "Visa & immigration",
  pre_departure: "Pre-departure & documents",
  arrival: "Arrival & orientation",
  academic: "Academic start",
  career: "Career & internships",
};

const ALLOWED_TIERS = new Set(["free", "basic", "standard", "premium"]);
const ALLOWED_FIELD_TYPES = new Set(["checkbox", "file", "text", "date"]);

// --------------------------------------------------------------------------
// small utilities
// --------------------------------------------------------------------------

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

const background = (task: Promise<unknown>) => {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } })
    .EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(task);
  else void task; // local fallback
};

const educationLabel = (level: string) =>
  EDUCATION_LEVEL_LABELS[level] ?? level.replace(/_/g, " ");

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const routeVisaCode = (
  destCode: string,
  originCode: string,
  level: string,
  universitySlug: string,
) =>
  `ROUTE_STUDY_${destCode}_${originCode}_${level}_${universitySlug}`
    .toUpperCase()
    .replace(/[^\w-]/g, "_")
    .slice(0, 150);

/** Pull the first balanced JSON object/array out of a model response. */
function extractJson<T>(text: string): T {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();

  const start = t.search(/[[{]/);
  if (start === -1) throw new Error("model returned no JSON");

  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(t.slice(start, i + 1)) as T;
    }
  }
  throw new Error("model returned unbalanced JSON");
}

// The app resolves a checklist's journey stage from its TITLE, first-match wins
// in this exact order (mirrors journeyProgress.ts `determineStage`).
const APP_STAGE_ORDER: Array<{ stage: string; match: RegExp }> = [
  { stage: "research", match: /research|university|program/i },
  { stage: "application", match: /application|apply/i },
  { stage: "visa", match: /visa|immigration/i },
  { stage: "pre_departure", match: /pre[-\s]?departure|document|financial|insurance|pre-arrival/i },
  { stage: "arrival", match: /arrival|orientation|accommodation|housing|campus/i },
  { stage: "academic", match: /academic|class|course/i },
  { stage: "career", match: /career|internship|job/i },
];

const stageFromTitle = (title: string) =>
  APP_STAGE_ORDER.find(({ match }) => match.test(title.toLowerCase()))?.stage ?? "pre_departure";

const tidyTitle = (title: string) =>
  title
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+(at|to|for|with|of|in|and|&)\s*$/i, "")
    .replace(/^[\s:–,&-]+|[\s:–,&-]+$/g, "")
    .trim();

/**
 * Produce a title the app will map back to the intended stage. The app files
 * a checklist under the FIRST stage whose keywords its title contains, so a
 * visa checklist titled "Student Visa Application" lands in "application",
 * and "... at the University of Melbourne" lands in "research". Try, in order:
 * the AI title, then without the university's name, then without keywords of
 * the stages checked before the intended one, then those with a stage prefix,
 * and finally the bare prefix.
 */
function normalizeChecklistTitle(rawTitle: string, stage: string, universityName = ""): string {
  const prefix = STAGE_TITLE_PREFIX[stage] ?? "Checklist";
  const aiText = tidyTitle((rawTitle || "").slice(0, 120));
  if (!aiText) return prefix;

  const nameVariants = [universityName.trim(), universityName.trim().replace(/^the\s+/i, "")]
    .filter(Boolean)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  let withoutUniversity = aiText;
  for (const name of nameVariants) {
    withoutUniversity = withoutUniversity.replace(new RegExp(`(the\\s+)?${name}`, "gi"), "");
  }
  withoutUniversity = tidyTitle(
    withoutUniversity.replace(/\b(the\s+)?(university|universities|uni)\b/gi, ""),
  );

  const stageIndex = APP_STAGE_ORDER.findIndex((s) => s.stage === stage);
  const withoutConflicts = tidyTitle(
    APP_STAGE_ORDER.slice(0, Math.max(stageIndex, 0)).reduce(
      (title, { match }) => title.replace(new RegExp(`\\b(${match.source})\\w*`, "gi"), ""),
      withoutUniversity,
    ),
  );

  const candidates = [aiText, withoutUniversity, withoutConflicts]
    .flatMap((title) => (title ? [title, `${prefix}: ${title}`] : []));
  return candidates.find((title) => stageFromTitle(title) === stage) ?? prefix;
}

// --------------------------------------------------------------------------
// Google Gemini API (generateContent + Google Search grounding, raw fetch)
// --------------------------------------------------------------------------

class ModelError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Per-minute quota (429) and overload (503) errors are transient. Keep the
// total wait small: a single invocation has a ~150s wall-clock budget.
const RETRYABLE_STATUS = new Set([429, 500, 503]);
const MAX_MODEL_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 15_000;

async function geminiGenerate(payload: Record<string, unknown>): Promise<GeminiResponse> {
  // Models skipped for this call only (overloaded right now).
  const skipped = new Set<string>();
  let retries = 0;

  for (;;) {
    const model = MODEL_CHAIN.find((m) => !unavailableModels.has(m) && !skipped.has(m));
    if (!model) throw new ModelError(503, "No Gemini model is currently available (quota or capacity)");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );
    if (res.ok) return (await res.json()) as GeminiResponse;

    const detail = await res.text();
    const error = new ModelError(res.status, `Gemini API ${res.status} (${model}): ${detail.slice(0, 600)}`);

    // A request quota (e.g. the free tier's daily cap) won't recover within this
    // invocation, and a retired model never will: drop it for this isolate.
    const quotaExhausted =
      res.status === 429 && /per ?day|PerDay|free_tier_requests|quota exceeded/i.test(detail);
    if (quotaExhausted || res.status === 404) {
      console.warn(`Gemini ${model} unusable (${res.status}); trying the next model`);
      unavailableModels.add(model);
      retries = 0;
      continue;
    }
    if (res.status === 400 && model !== MODEL) {
      // Newer fallback models reject some generation options (thinkingBudget).
      const config = payload.generationConfig as Record<string, unknown> | undefined;
      if (config?.thinkingConfig) {
        payload = { ...payload, generationConfig: { ...config, thinkingConfig: undefined } };
        continue;
      }
      console.warn(`Gemini ${model} rejected the request (400); trying the next model`);
      skipped.add(model);
      retries = 0;
      continue;
    }
    if (!RETRYABLE_STATUS.has(res.status)) throw error;

    if (retries >= MAX_MODEL_RETRIES) {
      // Still overloaded after retrying: hand over to the next model.
      console.warn(`Gemini ${model} still failing (${res.status}); trying the next model`);
      skipped.add(model);
      retries = 0;
      continue;
    }
    const suggested = Number(detail.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1]);
    const waitMs = Math.min(
      Number.isFinite(suggested) && suggested > 0 ? suggested * 1000 : 4_000 * (retries + 1),
      MAX_RETRY_WAIT_MS,
    );
    retries++;
    console.warn(`Gemini ${model} ${res.status}, retrying in ${waitMs}ms`);
    await sleep(waitMs);
  }
}

/**
 * One grounded generation. Falls back to an ungrounded call if the model or key
 * rejects the google_search tool, and asks for JSON directly in that case.
 */
async function askModel(
  userText: string,
  opts: { grounding?: boolean; maxTokens?: number } = {},
): Promise<string> {
  const { grounding = true, maxTokens = 8192 } = opts;
  let useGrounding = grounding;

  for (let attempt = 0; attempt < 3; attempt++) {
    const generationConfig: Record<string, unknown> = {
      temperature: 0.5,
      maxOutputTokens: maxTokens,
      // Structured generation, not deep reasoning — spend the whole budget on output.
      thinkingConfig: { thinkingBudget: 0 },
    };
    const payload: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig,
    };
    if (useGrounding) {
      payload.tools = [{ google_search: {} }];
    } else {
      // Grounding and response schemas are mutually exclusive; only ask for
      // strict JSON once we've dropped grounding.
      generationConfig.responseMimeType = "application/json";
    }

    let json: GeminiResponse;
    try {
      json = await geminiGenerate(payload);
    } catch (err) {
      const e = err as ModelError;
      if (
        e.status === 400 &&
        useGrounding &&
        /google_search|tool|grounding|not supported/i.test(e.message)
      ) {
        useGrounding = false;
        continue;
      }
      throw err;
    }

    const candidate = json.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (text) return text;

    // No text: retry ungrounded (often frees up the token budget) then give up.
    if (useGrounding) {
      useGrounding = false;
      continue;
    }
    throw new Error(
      `model produced no text (finishReason: ${candidate?.finishReason ?? "unknown"})`,
    );
  }
  throw new Error("model did not return usable output");
}

// --------------------------------------------------------------------------
// AI steps
// --------------------------------------------------------------------------

interface DiscoveredUniversity {
  name: string;
  city: string | null;
  rankingGlobal: number | null;
}

async function discoverUniversities(input: {
  destinationName: string;
  originName: string;
  level: string;
  limit: number;
}): Promise<DiscoveredUniversity[]> {
  const label = educationLabel(input.level);
  const prompt = `Identify the ${input.limit} most notable universities in ${input.destinationName} that international students from ${input.originName} realistically target for ${label} study.

Prefer well-known, high-reputation institutions that actively enrol international students and have strong international-student support. Use web search to confirm the current official names and cities.

Return ONLY a JSON array (no prose, no code fence) of exactly ${input.limit} objects, most prominent first:
[{ "name": string, "city": string | null, "rankingGlobal": number | null }]`;

  const raw = await askModel(prompt, { maxTokens: 4000 });
  const parsed = extractJson<DiscoveredUniversity[]>(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("university discovery returned an empty list");
  }
  return parsed
    .filter((u) => u && typeof u.name === "string" && u.name.trim().length > 0)
    .map((u) => ({
      name: u.name.trim(),
      city: typeof u.city === "string" && u.city.trim() ? u.city.trim() : null,
      rankingGlobal:
        typeof u.rankingGlobal === "number" && Number.isFinite(u.rankingGlobal)
          ? Math.round(u.rankingGlobal)
          : null,
    }))
    .slice(0, input.limit);
}

interface GeneratedChecklist {
  title: string;
  stage: string;
  subscriptionTier: string;
  items: Array<{ label: string; fieldType: string; hint: string | null }>;
}

interface GeneratedUniversityProfile {
  name: string;
  city: string | null;
  rankingGlobal: number | null;
  website: string | null;
  applicationSystem: string | null;
  notes: string | null;
  tagline: string | null;
  wikipediaTitle: string | null;
  // level-specific facts, stored under universities.level_details[<level>]
  tuitionMinUsd: number | null;
  tuitionMaxUsd: number | null;
  scholarshipAvailable: boolean | null;
  applicationDeadline: string | null;
}

interface GeneratedJourney {
  university: GeneratedUniversityProfile;
  checklists: GeneratedChecklist[];
}

const toWholeNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;

const toIsoDate = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : `${match[1]}-${match[2]}-${match[3]}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Application deadlines repeat every intake. Models often quote last cycle's
 * date, so move a past deadline forward by whole years to the next occurrence.
 */
const toUpcomingDeadline = (value: unknown): string | null => {
  const iso = toIsoDate(value);
  if (!iso) return null;
  const today = todayIso();
  let year = Number(iso.slice(0, 4));
  const monthDay = iso.slice(4);
  while (`${year}${monthDay}` < today) year++;
  return `${year}${monthDay}`;
};

// Grounded answers can embed search citation markers such as "[3, 7]".
const stripCitations = (text: string) => text.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, "");

const trimmedOrNull = (value: unknown, maxLength = 500): string | null =>
  typeof value === "string" && stripCitations(value).trim()
    ? stripCitations(value).trim().slice(0, maxLength)
    : null;

async function generateUniversityJourney(input: {
  destinationName: string;
  originName: string;
  level: string;
  universityName: string;
  universityCity: string | null;
}): Promise<GeneratedJourney> {
  const label = educationLabel(input.level);
  const where = input.universityCity
    ? `${input.universityName}, ${input.universityCity}`
    : input.universityName;

  const prompt = `Build a complete, highly detailed study-abroad journey for:
- Student origin country: ${input.originName}
- Destination country: ${input.destinationName}
- Target university: ${where}
- Education level: ${label}

Use web search to ground the university-specific details: application system / portal, intake terms and deadlines, entry and English-language requirements, tuition and fees, required essays and recommendation letters, interviews, scholarships, and campus/graduate housing.

Produce checklists that cover the whole journey IN ORDER, one stage-focused group per checklist, using these stages: "research", "application", "visa", "pre_departure", "arrival", "academic", "career". You may have more than one checklist per stage. Aim for 7-12 checklists total, each with 6-14 concrete, individually actionable task items.

Every task item must be specific and checkable. Prefer tasks tied to ${input.universityName} or the ${input.originName} -> ${input.destinationName} route (named portals, exact document names, specific offices, real deadlines) over generic advice. Put the earlier, lower-friction stages on the "free" tier and reserve "basic"/"standard"/"premium" for later visa, arrival, and career checklists.

Also fill in the university profile shown to students when they choose where to apply:
- "tagline": one short phrase (max 60 characters) naming what the university is known for, e.g. "Strong in sustainability and life sciences".
- "wikipediaTitle": the exact title of the university's English Wikipedia article, or null.
- "tuitionMinUsd" / "tuitionMaxUsd": the typical yearly tuition range in US dollars that a ${label} student from ${input.originName} pays (0 when tuition-free for them).
- "scholarshipAvailable": whether scholarships or fee waivers are open to ${input.originName} students at this level.
- "applicationDeadline": the main application deadline for the next intake after ${todayIso()} (today) as "YYYY-MM-DD", or null if unknown.

Return ONLY JSON (no prose, no code fence):
{
  "university": {
    "name": string,
    "city": string | null,
    "rankingGlobal": number | null,
    "website": string | null,
    "applicationSystem": string | null,
    "notes": string | null,
    "tagline": string | null,
    "wikipediaTitle": string | null,
    "tuitionMinUsd": number | null,
    "tuitionMaxUsd": number | null,
    "scholarshipAvailable": boolean | null,
    "applicationDeadline": string | null
  },
  "checklists": [
    {
      "title": string,
      "stage": "research" | "application" | "visa" | "pre_departure" | "arrival" | "academic" | "career",
      "subscriptionTier": "free" | "basic" | "standard" | "premium",
      "items": [
        { "label": string, "fieldType": "checkbox" | "file" | "text" | "date", "hint": string | null }
      ]
    }
  ]
}`;

  // Kept deliberately lean so a single university stays well under the
  // Supabase edge function wall-clock limit (150s on the free plan).
  const raw = await askModel(prompt, { maxTokens: 16000 });
  const parsed = extractJson<GeneratedJourney>(raw);

  if (!parsed || !Array.isArray(parsed.checklists) || parsed.checklists.length === 0) {
    throw new Error("journey generation returned no checklists");
  }

  // sanitise
  const checklists: GeneratedChecklist[] = parsed.checklists
    .map((c) => {
      const stage = STAGE_KEYWORDS[c?.stage as string] ? (c.stage as string) : "pre_departure";
      const tier = ALLOWED_TIERS.has(c?.subscriptionTier as string)
        ? (c.subscriptionTier as string)
        : "free";
      const items = Array.isArray(c?.items)
        ? c.items
            .filter((it) => it && typeof it.label === "string" && it.label.trim())
            .map((it) => ({
              label: it.label.trim(),
              fieldType: ALLOWED_FIELD_TYPES.has(it.fieldType) ? it.fieldType : "checkbox",
              hint:
                typeof it.hint === "string" && it.hint.trim() ? it.hint.trim() : null,
            }))
        : [];
      return {
        title: normalizeChecklistTitle(c?.title as string, stage, input.universityName),
        stage,
        subscriptionTier: tier,
        items,
      };
    })
    .filter((c) => c.items.length > 0)
    // checklists are unique per (country, route, title); fold same-titled
    // groups together (their items are usually a continuation).
    .reduce<GeneratedChecklist[]>((merged, checklist) => {
      const existing = merged.find((c) => c.title.toLowerCase() === checklist.title.toLowerCase());
      if (!existing) return [...merged, checklist];
      const seen = new Set(existing.items.map((it) => it.label.toLowerCase()));
      existing.items.push(...checklist.items.filter((it) => !seen.has(it.label.toLowerCase())));
      return merged;
    }, []);

  if (checklists.length === 0) throw new Error("journey generation produced no usable checklists");

  const profile = (parsed.university ?? {}) as Partial<Record<keyof GeneratedUniversityProfile, unknown>>;
  let tuitionMinUsd = toWholeNumber(profile.tuitionMinUsd);
  let tuitionMaxUsd = toWholeNumber(profile.tuitionMaxUsd);
  if (tuitionMinUsd !== null && tuitionMaxUsd !== null && tuitionMinUsd > tuitionMaxUsd) {
    [tuitionMinUsd, tuitionMaxUsd] = [tuitionMaxUsd, tuitionMinUsd];
  }

  return {
    university: {
      name: trimmedOrNull(profile.name, 200) || input.universityName,
      city: trimmedOrNull(profile.city, 120) || input.universityCity,
      rankingGlobal: toWholeNumber(profile.rankingGlobal) || null,
      website: trimmedOrNull(profile.website, 300),
      applicationSystem: trimmedOrNull(profile.applicationSystem, 300),
      notes: trimmedOrNull(profile.notes, 1000),
      tagline: trimmedOrNull(profile.tagline, 80),
      wikipediaTitle: trimmedOrNull(profile.wikipediaTitle, 200),
      tuitionMinUsd,
      tuitionMaxUsd,
      scholarshipAvailable:
        typeof profile.scholarshipAvailable === "boolean" ? profile.scholarshipAvailable : null,
      applicationDeadline: toUpcomingDeadline(profile.applicationDeadline),
    },
    checklists,
  };
}

// --------------------------------------------------------------------------
// university media (logo + campus photo) via Wikidata / Wikipedia
// --------------------------------------------------------------------------

// Wikimedia rate-limits requests without a descriptive User-Agent (HTTP 429).
const WIKI_HEADERS = {
  "User-Agent": "UniPilotBot/1.0 (https://unipilot.app; support@unipilot.app)",
  "Api-User-Agent": "UniPilotBot/1.0 (https://unipilot.app; support@unipilot.app)",
  accept: "application/json",
};
const LOGO_FILE = /logo|wordmark/i;
const EMBLEM_FILE = /seal|coat[_ ]of[_ ]arms|arms|crest|emblem|shield/i;
const NOT_A_CAMPUS_PHOTO = /logo|wordmark|seal|coat|arms|crest|emblem|shield|map|flag|signature|portrait|diagram|chart|icon/i;

const wikiJson = async <T>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

/**
 * Stable image URL for a Wikipedia/Commons file name. SVGs come back as PNG
 * renders at `width`. The redirect is resolved so the app loads straight from
 * the upload CDN.
 */
async function wikiFileUrl(fileName: string, width: number): Promise<string | null> {
  const name = fileName.replace(/^File:/i, "").replace(/ /g, "_");
  const url = `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`;
  try {
    const res = await fetch(url, { method: "HEAD", headers: WIKI_HEADERS, redirect: "follow" });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) return null;
    return res.url.replace(/[?&]utm_[^&]+/g, "").replace(/\?$/, "") || url;
  } catch {
    return null;
  }
}

async function wikidataIdFor(title: string): Promise<{ qid: string | null; pageTitle: string | null }> {
  const page = await wikiJson<{
    query?: { pages?: Record<string, { title?: string; missing?: string; pageprops?: { wikibase_item?: string } }> };
  }>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(title)}`,
  );
  const found = Object.values(page?.query?.pages ?? {})[0];
  if (found && found.missing === undefined && found.pageprops?.wikibase_item) {
    return { qid: found.pageprops.wikibase_item, pageTitle: found.title ?? title };
  }

  const search = await wikiJson<{ search?: Array<{ id: string }> }>(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=1&search=${encodeURIComponent(title)}`,
  );
  return { qid: search?.search?.[0]?.id ?? null, pageTitle: null };
}

/** File names from the article's infobox: its curated logo and its crest/seal image. */
async function infoboxImages(pageTitle: string): Promise<{ logo: string | null; emblem: string | null }> {
  const parsed = await wikiJson<{ parse?: { wikitext?: { "*"?: string } } }>(
    `https://en.wikipedia.org/w/api.php?action=parse&format=json&redirects=1&prop=wikitext&section=0&page=${encodeURIComponent(pageTitle)}`,
  );
  const wikitext = parsed?.parse?.wikitext?.["*"] ?? "";
  const field = (name: string): string | null => {
    const match = wikitext.match(new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n]*)`, "i"));
    if (!match) return null;
    const value = match[1]
      .replace(/<!--[\s\S]*?(-->|$)/g, "")
      .replace(/^\[\[/, "")
      .replace(/^(File|Image):/i, "")
      .split(/\||\{\{|\]\]/)[0]
      .trim();
    return /\.(svg|png|jpe?g|gif|webp)$/i.test(value) ? value : null;
  };
  return { logo: field("logo"), emblem: field("image") ?? field("seal") };
}

// Google's favicon service answers 404 with a generic globe when a site has
// none, and tiny files are 16px icons scaled up; both look worse than the
// app's monogram fallback, so only keep real, reasonably sized icons.
const MIN_FAVICON_BYTES = 600;

async function faviconFor(website: string | null): Promise<string | null> {
  if (!website) return null;
  let host: string;
  try {
    host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
  } catch {
    return null;
  }
  const url = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const bytes = (await res.arrayBuffer()).byteLength;
    return bytes >= MIN_FAVICON_BYTES ? url : null;
  } catch {
    return null;
  }
}

// Logos are vector or flat PNG artwork; a JPEG, or a file named like a
// photo, in a logo slot is almost always a mis-entered picture or a
// campus-specific variant.
const PHOTO_FILE_NAME = /building|campus|hall|view|panorama|aerial|photo|library|quad/i;
const looksLikeLogoFile = (file: string) =>
  !/\.jpe?g$/i.test(file) && !PHOTO_FILE_NAME.test(file);

/**
 * Best-effort logo + campus photo for a university.
 *
 * Logo, first match wins: the Wikipedia infobox "logo" (editor-curated, the
 * official wordmark), Wikidata "logo image" (P154), the infobox crest/seal,
 * Wikidata "seal image" (P158), a logo-named file on the article, then the
 * website favicon. Photo: Wikidata "image" (P18), then the first raster photo
 * on the article that isn't an emblem, map or portrait.
 */
async function resolveUniversityMedia(input: {
  name: string;
  wikipediaTitle: string | null;
  website: string | null;
}): Promise<{ logoUrl: string | null; imageUrl: string | null; website: string | null }> {
  const lookup = await wikidataIdFor(input.wikipediaTitle || input.name);
  const qid = lookup.qid;

  const entity = qid
    ? (await wikiJson<{
        entities?: Record<string, {
          claims?: Record<string, Array<{ rank?: string; mainsnak?: { datavalue?: { value?: unknown } } }>>;
          sitelinks?: { enwiki?: { title?: string } };
        }>;
      }>(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`))?.entities?.[qid]
    : null;
  const claim = (property: string): string[] =>
    (entity?.claims?.[property] ?? [])
      .filter((c) => c.rank !== "deprecated")
      .sort((a, b) => (a.rank === "preferred" ? -1 : 0) - (b.rank === "preferred" ? -1 : 0))
      .map((c) => c.mainsnak?.datavalue?.value)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

  const pageTitle = lookup.pageTitle ?? entity?.sitelinks?.enwiki?.title ?? null;
  const website = input.website || claim("P856")[0] || null;
  const infobox = pageTitle ? await infoboxImages(pageTitle) : { logo: null, emblem: null };

  const logoCandidates = [
    infobox.logo,
    ...claim("P154"),
    infobox.emblem,
    ...claim("P158"),
  ].filter((file): file is string => !!file && looksLikeLogoFile(file));

  let logoUrl: string | null = null;
  for (const file of Array.from(new Set(logoCandidates))) {
    logoUrl = await wikiFileUrl(file, 480);
    if (logoUrl) break;
  }

  let imageUrl: string | null = null;
  for (const file of claim("P18")) {
    imageUrl = await wikiFileUrl(file, 800);
    if (imageUrl) break;
  }

  if ((!logoUrl || !imageUrl) && pageTitle) {
    const media = await wikiJson<{ items?: Array<{ title?: string; type?: string }> }>(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
    );
    const files = (media?.items ?? [])
      .filter((item) => item.type === "image" && item.title)
      .map((item) => item.title as string);

    if (!logoUrl) {
      const logoFile =
        files.find((f) => LOGO_FILE.test(f) && looksLikeLogoFile(f)) ??
        files.find((f) => EMBLEM_FILE.test(f) && looksLikeLogoFile(f));
      if (logoFile) logoUrl = await wikiFileUrl(logoFile, 480);
    }
    if (!imageUrl) {
      const photoFile = files.find(
        (f) => /\.(jpe?g|png|webp)$/i.test(f) && !NOT_A_CAMPUS_PHOTO.test(f),
      );
      if (photoFile) imageUrl = await wikiFileUrl(photoFile, 800);
    }
  }

  return { logoUrl: logoUrl ?? (await faviconFor(website)), imageUrl, website };
}

// --------------------------------------------------------------------------
// persistence
// --------------------------------------------------------------------------

async function persistUniversityJourney(
  admin: SupabaseClient,
  ctx: {
    destinationCode: string;
    originCode: string;
    originName: string;
    destinationName: string;
    level: string;
    slug: string;
  },
  journey: GeneratedJourney,
): Promise<{ routeVisaCode: string; checklistCount: number; itemCount: number; universityId: string }> {
  const label = educationLabel(ctx.level);
  const code = routeVisaCode(ctx.destinationCode, ctx.originCode, ctx.level, ctx.slug);

  // 1. university row. The same university is generated once per
  //    (origin x level), so merge into what earlier runs stored instead of
  //    overwriting it.
  const { data: existingUni } = await admin
    .from("universities")
    .select("name, education_levels, metadata, level_details, logo_url, image_url, tagline, ranking_global, website, city")
    .eq("slug", ctx.slug)
    .maybeSingle();

  const profile = journey.university;
  const media =
    existingUni?.logo_url && existingUni?.image_url
      ? { logoUrl: existingUni.logo_url as string, imageUrl: existingUni.image_url as string }
      : await resolveUniversityMedia({
          name: profile.name,
          wikipediaTitle: profile.wikipediaTitle,
          website: profile.website ?? (existingUni?.website as string | null) ?? null,
        });

  const educationLevels = Array.from(
    new Set([...((existingUni?.education_levels as string[] | null) ?? []), ctx.level]),
  );
  const levelDetails = {
    ...((existingUni?.level_details as Record<string, unknown> | null) ?? {}),
    [ctx.level]: {
      tuitionMinUsd: profile.tuitionMinUsd,
      tuitionMaxUsd: profile.tuitionMaxUsd,
      scholarshipAvailable: profile.scholarshipAvailable,
      applicationDeadline: profile.applicationDeadline,
      updatedAt: new Date().toISOString(),
    },
  };

  const { data: uniRow, error: uniErr } = await admin
    .from("universities")
    .upsert(
      {
        slug: ctx.slug,
        // Catalog facts (asked for explicitly, e.g. the QS rank) win over the
        // journey model's incidental answers, so cards don't flip between runs.
        name: (existingUni?.name as string | undefined) ?? profile.name,
        country_code: ctx.destinationCode,
        city: existingUni?.city ?? profile.city ?? null,
        ranking_global: existingUni?.ranking_global ?? profile.rankingGlobal ?? null,
        website: existingUni?.website ?? profile.website ?? null,
        is_featured: true,
        is_active: true,
        education_levels: educationLevels,
        logo_url: existingUni?.logo_url ?? media.logoUrl,
        image_url: existingUni?.image_url ?? media.imageUrl,
        tagline: existingUni?.tagline ?? profile.tagline ?? null,
        level_details: levelDetails,
        metadata: {
          ...((existingUni?.metadata as Record<string, unknown> | null) ?? {}),
          applicationSystem: profile.applicationSystem,
          notes: profile.notes,
          wikipediaTitle: profile.wikipediaTitle,
          lastGeneratedRoute: code,
          lastGeneratedAt: new Date().toISOString(),
        },
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (uniErr || !uniRow) throw new Error(`university upsert failed: ${uniErr?.message}`);

  // 2. route visa type
  const { error: visaErr } = await admin.from("visa_types").upsert(
    {
      code,
      country_code: ctx.destinationCode,
      title: `${journey.university.name} · ${label} from ${ctx.originName}`,
      description: `AI-generated study journey for ${label} students moving from ${ctx.originName} to ${journey.university.name}, ${ctx.destinationName}.`,
      is_active: true,
      university_id: uniRow.id,
    },
    { onConflict: "code" },
  );
  if (visaErr) throw new Error(`visa_types upsert failed: ${visaErr.message}`);

  // 3. wipe previous checklists for this exact route
  const { data: existing, error: exErr } = await admin
    .from("checklists")
    .select("id")
    .eq("visa_type", code);
  if (exErr) throw new Error(`checklist lookup failed: ${exErr.message}`);
  const existingIds = (existing ?? []).map((r: { id: string }) => r.id);
  if (existingIds.length) {
    const { error: delItemsErr } = await admin
      .from("checklist_items")
      .delete()
      .in("checklist_id", existingIds);
    if (delItemsErr) throw new Error(`checklist_items delete failed: ${delItemsErr.message}`);
    const { error: delErr } = await admin.from("checklists").delete().eq("visa_type", code);
    if (delErr) throw new Error(`checklists delete failed: ${delErr.message}`);
  }

  // 4. insert checklists (sort_order is unique per route -> use it to map items back)
  const checklistRows = journey.checklists.map((c, i) => ({
    visa_type: code,
    country_code: ctx.destinationCode,
    title: c.title,
    sort_order: i + 1,
    subscription_tier: c.subscriptionTier,
  }));
  const { data: insertedChecklists, error: insErr } = await admin
    .from("checklists")
    .insert(checklistRows)
    .select("id, sort_order");
  if (insErr || !insertedChecklists) throw new Error(`checklists insert failed: ${insErr?.message}`);

  const idBySortOrder = new Map<number, string>(
    insertedChecklists.map((r: { id: string; sort_order: number }) => [r.sort_order, r.id]),
  );

  // 5. insert items
  const itemRows: Array<Record<string, unknown>> = [];
  journey.checklists.forEach((c, i) => {
    const checklistId = idBySortOrder.get(i + 1);
    if (!checklistId) return;
    c.items.forEach((it, j) => {
      itemRows.push({
        checklist_id: checklistId,
        label: it.label,
        field_type: it.fieldType,
        metadata: it.hint ? { hint: it.hint } : {},
        sort_order: j + 1,
      });
    });
  });
  if (itemRows.length) {
    const { error: itemErr } = await admin.from("checklist_items").insert(itemRows);
    if (itemErr) throw new Error(`checklist_items insert failed: ${itemErr.message}`);
  }

  return {
    routeVisaCode: code,
    checklistCount: checklistRows.length,
    itemCount: itemRows.length,
    universityId: uniRow.id,
  };
}

// --------------------------------------------------------------------------
// job helpers
// --------------------------------------------------------------------------

type JobUniversity = {
  slug: string;
  name: string;
  city: string | null;
  rankingGlobal: number | null;
  status: "pending" | "processing" | "done" | "failed";
  routeVisaCode?: string;
  checklistCount?: number;
  itemCount?: number;
  error?: string;
};

async function loadJob(admin: SupabaseClient, jobId: string) {
  const { data, error } = await admin
    .from("journey_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !data) throw new Error(`job ${jobId} not found: ${error?.message}`);
  return data as Record<string, unknown> & { universities: JobUniversity[] };
}

const selfInvoke = (payload: Record<string, unknown>) =>
  fetch(`${SUPABASE_URL}/functions/v1/generate-journey`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "x-internal-key": SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(payload),
  }).catch((e) => console.error("selfInvoke failed", e));

// --------------------------------------------------------------------------
// action: start
// --------------------------------------------------------------------------

async function handleStart(
  admin: SupabaseClient,
  body: Record<string, unknown>,
  userId: string | null,
): Promise<Response> {
  const destinationCountryCode = String(body.destinationCountryCode ?? "").trim().toUpperCase();
  const destinationCountryName = String(body.destinationCountryName ?? "").trim();
  const originCountryCode = String(body.originCountryCode ?? "").trim().toUpperCase();
  const originCountryName = String(body.originCountryName ?? "").trim();
  const educationLevel = String(body.educationLevel ?? "masters").trim();
  const universityLimit = Math.min(Math.max(Number(body.universityLimit) || 8, 1), 15);
  const requestedUniversities = Array.isArray(body.universityNames)
    ? (body.universityNames as unknown[])
        .map((n) => String(n).trim())
        .filter((n) => n.length > 0)
    : [];

  if (!destinationCountryCode || !destinationCountryName || !originCountryCode || !originCountryName) {
    return json({ error: "Missing destination or origin country details" }, 400);
  }
  if (destinationCountryCode === originCountryCode) {
    return json({ error: "Origin and destination cannot be the same country" }, 400);
  }

  // keep the country tables in sync (mirrors the previous admin console behaviour)
  await admin.from("destination_countries").upsert(
    { code: destinationCountryCode, name: destinationCountryName, is_active: true },
    { onConflict: "code" },
  );
  await admin.from("origin_countries").upsert(
    { code: originCountryCode, name: originCountryName, is_active: true },
    { onConflict: "code" },
  );

  const { data: job, error: jobErr } = await admin
    .from("journey_generation_jobs")
    .insert({
      status: "discovering",
      requested_by: userId,
      destination_country_code: destinationCountryCode,
      destination_country_name: destinationCountryName,
      origin_country_code: originCountryCode,
      origin_country_name: originCountryName,
      education_level: educationLevel,
      university_limit: universityLimit,
      requested_universities: requestedUniversities,
    })
    .select("id")
    .single();
  if (jobErr || !job) return json({ error: `Could not create job: ${jobErr?.message}` }, 500);

  const jobId = job.id as string;

  // Discovery is short; run it inline so the response carries the university list.
  let universities: JobUniversity[];
  try {
    const discovered: DiscoveredUniversity[] = requestedUniversities.length
      ? requestedUniversities.map((name) => ({ name, city: null, rankingGlobal: null }))
      : await discoverUniversities({
          destinationName: destinationCountryName,
          originName: originCountryName,
          level: educationLevel,
          limit: universityLimit,
        });

    const seen = new Set<string>();
    universities = discovered
      .map((u) => {
        const slug = slugify(`${u.name}-${destinationCountryCode}`);
        return { ...u, slug };
      })
      .filter((u) => u.slug && !seen.has(u.slug) && seen.add(u.slug))
      .map((u) => ({
        slug: u.slug,
        name: u.name,
        city: u.city,
        rankingGlobal: u.rankingGlobal,
        status: "pending" as const,
      }));
  } catch (e) {
    await admin
      .from("journey_generation_jobs")
      .update({ status: "failed", error: `Discovery failed: ${(e as Error).message}` })
      .eq("id", jobId);
    return json({ error: `University discovery failed: ${(e as Error).message}`, jobId }, 502);
  }

  if (universities.length === 0) {
    await admin
      .from("journey_generation_jobs")
      .update({ status: "failed", error: "No universities discovered" })
      .eq("id", jobId);
    return json({ error: "No universities discovered", jobId }, 502);
  }

  // Seed the universities catalogue immediately (journeys fill in as they finish).
  // Existing rows are left alone; the per-university step merges into them.
  await admin.from("universities").upsert(
    universities.map((u) => ({
      slug: u.slug,
      name: u.name,
      country_code: destinationCountryCode,
      city: u.city,
      ranking_global: u.rankingGlobal,
      is_featured: true,
      is_active: true,
      education_levels: [educationLevel],
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );

  await admin
    .from("journey_generation_jobs")
    .update({ status: "processing", universities, current_index: 0 })
    .eq("id", jobId);

  background(selfInvoke({ action: "process", jobId, index: 0 }));

  return json({ jobId, universities, status: "processing" });
}

// --------------------------------------------------------------------------
// action: process  (one university, then chain to the next)
// --------------------------------------------------------------------------

async function handleProcess(
  admin: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const jobId = String(body.jobId ?? "");
  let index = Number(body.index ?? 0);
  if (!jobId) return json({ error: "Missing jobId" }, 400);

  const job = await loadJob(admin, jobId);
  const universities = job.universities ?? [];

  // Skip anything already finished (idempotent re-entry / resume).
  while (index < universities.length && universities[index]?.status === "done") index++;

  if (index >= universities.length) {
    const failed = universities.filter((u) => u.status === "failed");
    const done = universities.filter((u) => u.status === "done");
    await admin
      .from("journey_generation_jobs")
      .update({
        status: failed.length === 0 ? "completed" : done.length === 0 ? "failed" : "partial",
        current_index: universities.length,
        summary: `${done.length}/${universities.length} universities generated${
          failed.length ? `, ${failed.length} failed` : ""
        }.`,
      })
      .eq("id", jobId);
    return json({ done: true, jobId });
  }

  // respond right away; do the heavy work in the background then chain.
  const response = json({ ok: true, jobId, index });

  background(
    (async () => {
      const current = { ...universities[index] };
      current.status = "processing";
      universities[index] = current;
      await admin
        .from("journey_generation_jobs")
        .update({ universities, current_index: index })
        .eq("id", jobId);

      try {
        const journey = await generateUniversityJourney({
          destinationName: String(job.destination_country_name),
          originName: String(job.origin_country_name),
          level: String(job.education_level),
          universityName: current.name,
          universityCity: current.city,
        });

        const persisted = await persistUniversityJourney(
          admin,
          {
            destinationCode: String(job.destination_country_code),
            originCode: String(job.origin_country_code),
            originName: String(job.origin_country_name),
            destinationName: String(job.destination_country_name),
            level: String(job.education_level),
            slug: current.slug,
          },
          journey,
        );

        current.status = "done";
        current.routeVisaCode = persisted.routeVisaCode;
        current.checklistCount = persisted.checklistCount;
        current.itemCount = persisted.itemCount;
        current.name = journey.university.name;
        current.city = journey.university.city;
        current.rankingGlobal = journey.university.rankingGlobal;
      } catch (e) {
        current.status = "failed";
        current.error = (e as Error).message;
        console.error(`university ${current.slug} failed`, e);
      }

      universities[index] = current;
      await admin
        .from("journey_generation_jobs")
        .update({ universities, current_index: index + 1 })
        .eq("id", jobId);

      await selfInvoke({ action: "process", jobId, index: index + 1 });
    })(),
  );

  return response;
}

// --------------------------------------------------------------------------
// action: resume  (restart a stalled job from the first unfinished university)
// --------------------------------------------------------------------------

async function handleResume(
  admin: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const jobId = String(body.jobId ?? "");
  if (!jobId) return json({ error: "Missing jobId" }, 400);

  const job = await loadJob(admin, jobId);
  const universities = job.universities ?? [];

  const resumeIndex = universities.findIndex((u) => u.status !== "done");
  if (resumeIndex === -1) {
    await admin
      .from("journey_generation_jobs")
      .update({ status: "completed", current_index: universities.length })
      .eq("id", jobId);
    return json({ done: true, jobId });
  }

  // A university stuck on "processing" was interrupted mid-run; re-queue it.
  universities.forEach((u) => {
    if (u.status === "processing") u.status = "pending";
  });

  await admin
    .from("journey_generation_jobs")
    .update({ status: "processing", universities, current_index: resumeIndex, error: null })
    .eq("id", jobId);

  background(selfInvoke({ action: "process", jobId, index: resumeIndex }));
  return json({ resumed: true, jobId, index: resumeIndex });
}

// --------------------------------------------------------------------------
// action: request  (signed-in student -> generate their missing routes)
// --------------------------------------------------------------------------

// Levels we can build a meaningful university journey for.
const GENERATABLE_LEVELS = new Set(Object.keys(EDUCATION_LEVEL_LABELS));
const MAX_ROUTES_PER_REQUEST = 5;
// A job that hasn't moved for this long is treated as dead and can be re-queued.
const STALE_JOB_MS = 30 * 60 * 1000;
const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CAPACITY_ERROR = /quota|No Gemini model|Gemini API (429|500|503)/i;
const MAX_FAILURES_PER_WINDOW = 3;

interface RequestJourneyRow {
  id: string;
  destination_country_code: string;
  origin_country_code: string;
  education_level: string;
  route_visa_code: string;
  university: { slug: string; name: string; city: string | null; ranking_global: number | null } | null;
}

/**
 * A student picked universities whose route hasn't been generated for their
 * (origin x level) yet. Queue one job per (destination x origin x level) group
 * covering only the missing routes. Generated routes are shared, so any later
 * student with the same combination gets them straight away.
 */
async function handleRequest(admin: SupabaseClient, userId: string): Promise<Response> {
  const { data: rows, error } = await admin
    .from("user_journeys")
    .select(
      "id, destination_country_code, origin_country_code, education_level, route_visa_code, university:universities(slug, name, city, ranking_global)",
    )
    .eq("user_id", userId);
  if (error) return json({ error: `Could not load journeys: ${error.message}` }, 500);

  const candidates = ((rows ?? []) as unknown as RequestJourneyRow[]).filter(
    (row) =>
      row.university &&
      GENERATABLE_LEVELS.has(row.education_level) &&
      row.destination_country_code !== row.origin_country_code,
  );

  const missing: RequestJourneyRow[] = [];
  for (const row of candidates) {
    const { count } = await admin
      .from("checklists")
      .select("id", { count: "exact", head: true })
      .eq("visa_type", row.route_visa_code);
    if (!count) missing.push(row);
    if (missing.length >= MAX_ROUTES_PER_REQUEST) break;
  }
  if (missing.length === 0) return json({ queued: [], jobs: [] });

  const groups = new Map<string, RequestJourneyRow[]>();
  for (const row of missing) {
    const key = `${row.destination_country_code}|${row.origin_country_code}|${row.education_level}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const queued: string[] = [];
  const jobs: string[] = [];
  const freshSince = new Date(Date.now() - STALE_JOB_MS).toISOString();

  for (const group of groups.values()) {
    const { destination_country_code: dest, origin_country_code: origin, education_level: level } =
      group[0];

    // Skip universities another live job is already generating for this combination.
    const { data: liveJobs } = await admin
      .from("journey_generation_jobs")
      .select("universities")
      .eq("destination_country_code", dest)
      .eq("origin_country_code", origin)
      .eq("education_level", level)
      .in("status", ["pending", "discovering", "processing"])
      .gte("updated_at", freshSince);
    const inFlight = new Set(
      (liveJobs ?? []).flatMap((job: { universities: JobUniversity[] }) =>
        (job.universities ?? [])
          .filter((u) => u.status === "pending" || u.status === "processing")
          .map((u) => u.slug),
      ),
    );

    // Don't keep re-queueing a route that fails every time; retry the next day.
    const { data: recentJobs } = await admin
      .from("journey_generation_jobs")
      .select("universities")
      .eq("destination_country_code", dest)
      .eq("origin_country_code", origin)
      .eq("education_level", level)
      .gte("created_at", new Date(Date.now() - FAILURE_WINDOW_MS).toISOString());
    // Quota/capacity errors say nothing about the route itself; don't count them.
    const failures = new Map<string, number>();
    for (const job of (recentJobs ?? []) as Array<{ universities: JobUniversity[] }>) {
      for (const u of job.universities ?? []) {
        if (u.status === "failed" && !CAPACITY_ERROR.test(u.error ?? "")) {
          failures.set(u.slug, (failures.get(u.slug) ?? 0) + 1);
        }
      }
    }

    const universities: JobUniversity[] = group
      .filter((row) => !inFlight.has(row.university!.slug))
      .filter((row) => (failures.get(row.university!.slug) ?? 0) < MAX_FAILURES_PER_WINDOW)
      .map((row) => ({
        slug: row.university!.slug,
        name: row.university!.name,
        city: row.university!.city,
        rankingGlobal: row.university!.ranking_global,
        status: "pending" as const,
      }));
    if (universities.length === 0) continue;

    const [{ data: destRow }, { data: originRow }] = await Promise.all([
      admin.from("destination_countries").select("name").eq("code", dest).maybeSingle(),
      admin.from("origin_countries").select("name").eq("code", origin).maybeSingle(),
    ]);

    const { data: job, error: jobErr } = await admin
      .from("journey_generation_jobs")
      .insert({
        status: "processing",
        requested_by: userId,
        destination_country_code: dest,
        destination_country_name: destRow?.name ?? dest,
        origin_country_code: origin,
        origin_country_name: originRow?.name ?? origin,
        education_level: level,
        university_limit: universities.length,
        requested_universities: universities.map((u) => u.name),
        universities,
        current_index: 0,
      })
      .select("id")
      .single();
    if (jobErr || !job) {
      console.error("request: could not create job", jobErr);
      continue;
    }

    jobs.push(job.id as string);
    queued.push(...universities.map((u) => routeVisaCode(dest, origin, level, u.slug)));
    background(selfInvoke({ action: "process", jobId: job.id, index: 0 }));
  }

  return json({ queued, jobs });
}

// --------------------------------------------------------------------------
// action: enrich  (admin: backfill logos/photos for existing universities)
// --------------------------------------------------------------------------

async function handleEnrich(
  admin: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const countryCode = String(body.countryCode ?? "").trim().toUpperCase();
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 50);
  // force: re-resolve logos for every row (e.g. after improving the resolver).
  const force = body.force === true;
  const offset = Math.max(Number(body.offset) || 0, 0);

  let query = admin
    .from("universities")
    .select("id, name, website, metadata, logo_url, image_url")
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (body.onlyFavicons === true) query = query.like("logo_url", "%/s2/favicons%");
  else if (!force) query = query.or("logo_url.is.null,image_url.is.null");
  if (countryCode) query = query.eq("country_code", countryCode);

  const { data: rows, error } = await query;
  if (error) return json({ error: `Could not load universities: ${error.message}` }, 500);

  const results: Array<{ id: string; name: string; logo: boolean; image: boolean }> = [];
  for (const row of rows ?? []) {
    const media = await resolveUniversityMedia({
      name: row.name,
      wikipediaTitle: (row.metadata as { wikipediaTitle?: string } | null)?.wikipediaTitle ?? null,
      website: row.website,
    });
    const update: Record<string, string | null> = {};
    if ((force || !row.logo_url) && media.logoUrl !== row.logo_url) {
      // On a forced pass a missing logo clears a bad one (the app then shows a monogram).
      if (media.logoUrl || force) update.logo_url = media.logoUrl;
    }
    if (!row.image_url && media.imageUrl) update.image_url = media.imageUrl;
    if (Object.keys(update).length) {
      await admin.from("universities").update(update).eq("id", row.id);
    }
    results.push({ id: row.id, name: row.name, logo: "logo_url" in update, image: !!update.image_url });
  }

  return json({
    updated: results.filter((r) => r.logo || r.image).length,
    processed: results.length,
    nextOffset: results.length === limit ? offset + limit : null,
    results,
  });
}

// --------------------------------------------------------------------------
// action: catalog  (admin: fill a country's university picker, no journeys)
// --------------------------------------------------------------------------

const CATALOG_LEVELS = ["bachelors", "masters"] as const;

interface CatalogUniversity {
  name: string;
  city: string | null;
  rankingGlobal: number | null;
  website: string | null;
  wikipediaTitle: string | null;
  tagline: string | null;
  levels: Record<string, {
    tuitionMinUsd: number | null;
    tuitionMaxUsd: number | null;
    scholarshipAvailable: boolean | null;
    applicationDeadline: string | null;
  }>;
}

async function discoverCatalog(input: {
  destinationName: string;
  limit: number;
}): Promise<CatalogUniversity[]> {
  const prompt = `List the ${input.limit} universities in ${input.destinationName} that international students most often apply to, most prominent first. Use web search to confirm current official names, cities, fees and deadlines.

For each university return:
- "name": official English name
- "city": main campus city
- "rankingGlobal": latest QS World University Ranking position (use the lower bound for banded ranks), or null
- "website": official website URL
- "wikipediaTitle": exact English Wikipedia article title, or null
- "tagline": one short phrase (max 60 characters) on what it is known for, e.g. "Strong in sustainability and life sciences"
- "levels": for "bachelors" and "masters", the typical yearly tuition range in US dollars for non-EU international students ("tuitionMinUsd", "tuitionMaxUsd"; 0 if tuition-free), whether scholarships or fee waivers are open to international students ("scholarshipAvailable"), and the main application deadline for the next intake after ${todayIso()} (today) as "YYYY-MM-DD" ("applicationDeadline", null if unknown)

Return ONLY a JSON array (no prose, no code fence):
[{ "name": string, "city": string | null, "rankingGlobal": number | null, "website": string | null, "wikipediaTitle": string | null, "tagline": string | null,
   "levels": { "bachelors": { "tuitionMinUsd": number | null, "tuitionMaxUsd": number | null, "scholarshipAvailable": boolean | null, "applicationDeadline": string | null }, "masters": { ... } } }]`;

  let parsed: Array<Record<string, unknown>>;
  try {
    parsed = extractJson<Array<Record<string, unknown>>>(await askModel(prompt, { maxTokens: 12000 }));
  } catch {
    // Grounded answers sometimes come back as prose; strict JSON mode fixes that.
    parsed = extractJson<Array<Record<string, unknown>>>(
      await askModel(prompt, { maxTokens: 12000, grounding: false }),
    );
  }
  if (!Array.isArray(parsed)) throw new Error("catalog discovery returned no list");

  return parsed
    .filter((u) => u && typeof u.name === "string" && (u.name as string).trim())
    .slice(0, input.limit)
    .map((u) => {
      const rawLevels = (u.levels ?? {}) as Record<string, Record<string, unknown>>;
      const levels: CatalogUniversity["levels"] = {};
      for (const level of CATALOG_LEVELS) {
        const l = rawLevels[level];
        if (!l) continue;
        let min = toWholeNumber(l.tuitionMinUsd);
        let max = toWholeNumber(l.tuitionMaxUsd);
        if (min !== null && max !== null && min > max) [min, max] = [max, min];
        levels[level] = {
          tuitionMinUsd: min,
          tuitionMaxUsd: max,
          scholarshipAvailable: typeof l.scholarshipAvailable === "boolean" ? l.scholarshipAvailable : null,
          applicationDeadline: toUpcomingDeadline(l.applicationDeadline),
        };
      }
      return {
        name: (u.name as string).trim(),
        city: trimmedOrNull(u.city, 120),
        rankingGlobal: toWholeNumber(u.rankingGlobal) || null,
        website: trimmedOrNull(u.website, 300),
        wikipediaTitle: trimmedOrNull(u.wikipediaTitle, 200),
        tagline: trimmedOrNull(u.tagline, 80),
        levels,
      };
    });
}

/**
 * Discover a destination's universities and store their picker profile
 * (ranking, tagline, per-level fees/deadlines, logo, photo). Journeys are not
 * generated here; students trigger those on demand via "request". Existing
 * rows only get their missing fields filled.
 */
async function handleCatalog(
  admin: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const destinationCountryCode = String(body.destinationCountryCode ?? "").trim().toUpperCase();
  const limit = Math.min(Math.max(Number(body.limit) || 12, 1), 20);
  if (!destinationCountryCode) return json({ error: "Missing destinationCountryCode" }, 400);

  const { data: country } = await admin
    .from("destination_countries")
    .select("name")
    .eq("code", destinationCountryCode)
    .maybeSingle();
  const destinationName = String(body.destinationCountryName ?? country?.name ?? "").trim();
  if (!destinationName) return json({ error: "Unknown destination country" }, 400);

  let discovered: CatalogUniversity[];
  try {
    discovered = await discoverCatalog({ destinationName, limit });
  } catch (e) {
    return json({ error: `Catalog discovery failed: ${(e as Error).message}` }, 502);
  }

  const seen = new Set<string>();
  const entries = discovered
    .map((u) => ({ ...u, slug: slugify(`${u.name}-${destinationCountryCode}`) }))
    .filter((u) => u.slug && !seen.has(u.slug) && seen.add(u.slug));

  const { data: existingRows } = await admin
    .from("universities")
    .select("id, slug, city, ranking_global, website, tagline, level_details, education_levels, metadata")
    .in("slug", entries.map((u) => u.slug));
  const existingBySlug = new Map(
    (existingRows ?? []).map((row: Record<string, unknown>) => [row.slug as string, row]),
  );

  const saved: Array<{ id: string; slug: string; name: string; website: string | null; wikipediaTitle: string | null }> = [];
  for (const u of entries) {
    const existing = existingBySlug.get(u.slug) as Record<string, unknown> | undefined;
    const existingLevels = (existing?.level_details as Record<string, unknown> | null) ?? {};
    const levelDetails: Record<string, unknown> = { ...existingLevels };
    for (const [level, facts] of Object.entries(u.levels)) {
      // Journey generation writes route-specific facts; never overwrite those.
      if (!existingLevels[level]) levelDetails[level] = { ...facts, source: "catalog" };
    }

    const row = {
      slug: u.slug,
      name: u.name,
      country_code: destinationCountryCode,
      city: (existing?.city as string | null) ?? u.city,
      ranking_global: (existing?.ranking_global as number | null) ?? u.rankingGlobal,
      website: (existing?.website as string | null) ?? u.website,
      tagline: (existing?.tagline as string | null) ?? u.tagline,
      level_details: levelDetails,
      education_levels: Array.from(
        new Set([...((existing?.education_levels as string[] | null) ?? []), ...Object.keys(u.levels)]),
      ),
      metadata: {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        wikipediaTitle: u.wikipediaTitle,
      },
      is_featured: true,
      is_active: true,
    };

    const { data, error } = await admin
      .from("universities")
      .upsert(row, { onConflict: "slug" })
      .select("id")
      .single();
    if (error || !data) {
      console.error(`catalog: could not save ${u.slug}`, error);
      continue;
    }
    saved.push({ id: data.id, slug: u.slug, name: u.name, website: row.website, wikipediaTitle: u.wikipediaTitle });
  }

  // Logos and photos take a few seconds each; fill them in after responding.
  background(
    (async () => {
      for (const u of saved) {
        const { data: current } = await admin
          .from("universities")
          .select("logo_url, image_url, website")
          .eq("id", u.id)
          .single();
        if (current?.logo_url && current?.image_url) continue;
        const media = await resolveUniversityMedia({
          name: u.name,
          wikipediaTitle: u.wikipediaTitle,
          website: u.website,
        });
        const update: Record<string, string> = {};
        if (!current?.logo_url && media.logoUrl) update.logo_url = media.logoUrl;
        if (!current?.image_url && media.imageUrl) update.image_url = media.imageUrl;
        if (!current?.website && media.website) update.website = media.website;
        if (Object.keys(update).length) await admin.from("universities").update(update).eq("id", u.id);
      }
    })(),
  );

  return json({
    destinationCountryCode,
    saved: saved.map((u) => ({ slug: u.slug, name: u.name })),
    media: "resolving in background",
  });
}

// --------------------------------------------------------------------------
// entrypoint
// --------------------------------------------------------------------------

async function verifyUser(req: Request): Promise<{ userId: string; email: string } | Response> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Missing authorization token" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return json({ error: "Unauthorized" }, 401);

  return { userId: data.user.id, email: (data.user.email ?? "").toLowerCase() };
}

const isInternalCall = (req: Request) =>
  !!SERVICE_ROLE_KEY && (req.headers.get("x-internal-key") ?? "") === SERVICE_ROLE_KEY;

async function verifyAdmin(req: Request): Promise<{ userId: string | null } | Response> {
  // Server-side scripts (CLI backfills) authenticate with the service role key.
  if (isInternalCall(req)) return { userId: null };
  const gate = await verifyUser(req);
  if (gate instanceof Response) return gate;
  if (!gate.email.endsWith(ADMIN_EMAIL_DOMAIN)) return json({ error: "Admin access required" }, 403);
  return { userId: gate.userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Missing Supabase environment configuration" }, 500);
  }
  if (!GEMINI_API_KEY) {
    return json({ error: "Missing GEMINI_API_KEY secret" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const action = String(body.action ?? "start");

  try {
    if (action === "start") {
      const gate = await verifyAdmin(req);
      if (gate instanceof Response) return gate;
      return await handleStart(admin, body, gate.userId);
    }
    if (action === "process") {
      if (!isInternalCall(req)) {
        return json({ error: "Forbidden" }, 403);
      }
      return await handleProcess(admin, body);
    }
    if (action === "resume") {
      const gate = await verifyAdmin(req);
      if (gate instanceof Response) return gate;
      return await handleResume(admin, body);
    }
    if (action === "request") {
      const gate = await verifyUser(req);
      if (gate instanceof Response) return gate;
      return await handleRequest(admin, gate.userId);
    }
    if (action === "catalog") {
      const gate = await verifyAdmin(req);
      if (gate instanceof Response) return gate;
      return await handleCatalog(admin, body);
    }
    if (action === "enrich") {
      const gate = await verifyAdmin(req);
      if (gate instanceof Response) return gate;
      return await handleEnrich(admin, body);
    }
    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("generate-journey error", e);
    return json({ error: (e as Error).message ?? "Unexpected error" }, 500);
  }
});
