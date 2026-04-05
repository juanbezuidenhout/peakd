import { createClient } from "npm:@supabase/supabase-js";

// ---------------------------------------------------------------------------
// CORS – restrict to the Peakd iOS bundle; native apps won't send an Origin
// header, so this mainly blocks browser-based abuse.
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "capacitor://com.peakdapp.ios",
  "http://localhost",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const VALID_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];

const RATE_BURST_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_BURST_MAX = 5;

const MONTHLY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MONTHLY_MAX_FREE = 3;
const MONTHLY_MAX_PRO = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function estimateBase64Bytes(b64: string): number {
  const padding = (b64.match(/=+$/) || [""])[0].length;
  return Math.floor((b64.length * 3) / 4) - padding;
}

// ---------------------------------------------------------------------------
// Face analysis prompt — returns the FaceAnalysisResult JSON shape expected
// by the client.
// ---------------------------------------------------------------------------
function buildSystemPrompt(userContext: Record<string, unknown>): string {
  const contextLines: string[] = [];
  if (userContext.userName) contextLines.push(`Name: ${userContext.userName}`);
  if (userContext.userAge) contextLines.push(`Age: ${userContext.userAge}`);
  if (userContext.aesthetic)
    contextLines.push(`Preferred aesthetic: ${userContext.aesthetic}`);
  if (Array.isArray(userContext.glowLevels) && userContext.glowLevels.length)
    contextLines.push(`Self-reported glow levels: ${userContext.glowLevels.join(", ")}`);

  const userSection = contextLines.length
    ? `\nUser context:\n${contextLines.join("\n")}\n`
    : "";

  return `You are Peakd, an expert AI beauty and facial analysis coach.
Analyze the provided selfie(s) and return a JSON object matching this exact schema:

{
  "glowScore": <number 1.0–10.0, one decimal>,
  "featureScores": {
    "skinQuality":     { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "facialStructure": { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "eyes":            { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "nose":            { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "lipsAndMouth":    { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "eyebrows":        { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "hair":            { "score": <1.0–10.0>, "summary": "<1 sentence>" },
    "overallHarmony":  { "score": <1.0–10.0>, "summary": "<1 sentence>" }
  },
  "archetype": { "name": "<2–3 word label>", "description": "<1 sentence>" },
  "topStrength":    { "feature": "<feature name>", "insight": "<1 sentence>" },
  "topOpportunity": { "feature": "<feature name>", "insight": "<1 sentence>" },
  "recommendations": [
    {
      "title": "<short title>",
      "feature": "<related feature>",
      "currentScore": <number>,
      "potentialGain": "<e.g. +5–10>",
      "action": "<specific actionable advice>",
      "category": "<natural | soft-maxxing | hard-maxxing | experimental>",
      "timeframe": "<e.g. 2–4 weeks>"
    }
  ],
  "personalNote": "<warm, empowering 1–2 sentence note>",
  "uniqueDetail": "<one truly unique observation about this face>",
  "first_observation": "<the very first thing you notice>",
  "eyes_insight": "<specific insight about the eyes>",
  "skin_insight": "<specific insight about the skin>",
  "structure_insight": "<insight about facial bone structure>",
  "strongest_feature": "<the single strongest feature>",
  "strongest_feature_insight": "<why it stands out>"
}

Scoring calibration (1.0–10.0 scale):
- 9.0+ is supermodel-tier — essentially never given. Reserve for flawless bone structure, skin, and harmony.
- 7.5–8.9 is genuinely attractive — only give this when the person is clearly above average with strong features.
- 5.0–7.4 is where the vast majority of people should land. A 6.5 is a normal, decent-looking person. Do not inflate past this range to be polite.
- 3.5–4.9 is below average — noticeable flaws, poor skin, weak structure, or clear neglect.
- Below 3.5 is reserved for severe cases.

Scoring philosophy: Err on the side of being strict. A slightly lower score that motivates real improvement is far more valuable than a flattering score that breeds complacency. The user is here because they want honest feedback, not validation. If a feature is average, score it average (5.0–6.0), not "pretty good" (7.0+). The improvement plan only has value when the starting score is truthful.

Rules:
- Return ONLY valid JSON, no markdown fences.
- Provide 3–5 recommendations. Each recommendation should point out something specific the user can actually fix.
- Be direct and honest. Name the specific flaws you see — vague praise is useless.
- Reference actual visual details from the photo, not generic filler.
- The "topOpportunity" should sting a little — it's the thing holding them back the most.
${userSection}`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  // ── Environment ─────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey || !anthropicKey) {
    console.error("Missing required environment variables");
    return jsonResponse(
      { error: "Service temporarily unavailable." },
      503,
      cors,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── 1. Auth verification (optional — allows unauthenticated first scans) ─
  let user: { id: string; user_metadata?: Record<string, unknown> } | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (!authError && authUser) {
      user = authUser;
    }
  }

  // ── 2. Input validation ─────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400, cors);
  }

  const {
    imageBase64,
    mediaType,
    sideImageBase64,
    sideMediaType,
    ...userContext
  } = body as {
    imageBase64?: string;
    mediaType?: string;
    sideImageBase64?: string;
    sideMediaType?: string;
    [key: string]: unknown;
  };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return jsonResponse(
      { error: "Missing required field: imageBase64." },
      400,
      cors,
    );
  }

  if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
    return jsonResponse(
      { error: "Image exceeds the maximum allowed size (10 MB)." },
      413,
      cors,
    );
  }

  if (mediaType && !VALID_MEDIA_TYPES.includes(mediaType as string)) {
    return jsonResponse({ error: "Unsupported image format." }, 400, cors);
  }

  if (sideImageBase64 && typeof sideImageBase64 === "string") {
    if (estimateBase64Bytes(sideImageBase64) > MAX_IMAGE_BYTES) {
      return jsonResponse(
        { error: "Side image exceeds the maximum allowed size (10 MB)." },
        413,
        cors,
      );
    }
    if (sideMediaType && !VALID_MEDIA_TYPES.includes(sideMediaType as string)) {
      return jsonResponse(
        { error: "Unsupported side image format." },
        400,
        cors,
      );
    }
  }

  // ── 3. Rate limiting (authenticated users only) ─────────────────────────
  if (user) {
    try {
      const now = Date.now();

      // Burst check – max N requests per hour
      const hourAgo = new Date(now - RATE_BURST_WINDOW_MS).toISOString();
      const { count: burstCount, error: burstErr } = await supabase
        .from("scan_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", hourAgo);

      if (burstErr) {
        console.error("Burst rate-limit query failed:", burstErr.message);
      } else if ((burstCount ?? 0) >= RATE_BURST_MAX) {
        return jsonResponse(
          { error: "Too many requests. Please try again later." },
          429,
          cors,
        );
      }

      // Monthly tier check
      const monthAgo = new Date(now - MONTHLY_WINDOW_MS).toISOString();
      const { count: monthlyCount, error: monthlyErr } = await supabase
        .from("scan_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthAgo);

      if (monthlyErr) {
        console.error("Monthly rate-limit query failed:", monthlyErr.message);
      } else {
        const isPro = user.user_metadata?.is_pro === true;
        const cap = isPro ? MONTHLY_MAX_PRO : MONTHLY_MAX_FREE;

        if ((monthlyCount ?? 0) >= cap) {
          return jsonResponse(
            {
              error: isPro
                ? "Monthly scan limit reached. Please try again next month."
                : "Free scan limit reached. Upgrade to Pro for more scans.",
            },
            429,
            cors,
          );
        }
      }

      // Record this request
      const { error: insertErr } = await supabase
        .from("scan_rate_limits")
        .insert({ user_id: user.id });

      if (insertErr) {
        console.error("Failed to record rate-limit entry:", insertErr.message);
      }
    } catch (rlError) {
      // Fail-open so a DB hiccup doesn't block all users, but always log.
      console.error("Rate limiting error:", rlError);
    }
  }

  // ── 4. Call Anthropic API ───────────────────────────────────────────────
  try {
    const imageContent: Array<Record<string, unknown>> = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: (mediaType as string) || "image/jpeg",
          data: imageBase64,
        },
      },
    ];

    if (sideImageBase64 && typeof sideImageBase64 === "string") {
      imageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: (sideMediaType as string) || "image/jpeg",
          data: sideImageBase64,
        },
      });
    }

    imageContent.push({
      type: "text",
      text: "Analyze this selfie and return the JSON object as specified.",
    });

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: buildSystemPrompt(userContext),
        messages: [{ role: "user", content: imageContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error(
        `Anthropic API error ${anthropicRes.status}:`,
        errBody,
      );
      return jsonResponse(
        { error: "Analysis service is temporarily unavailable." },
        502,
        cors,
      );
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData?.content?.[0]?.text ?? "";

    if (!rawText) {
      console.error("Empty response from Anthropic (stop_reason:", anthropicData?.stop_reason, ")");
      return jsonResponse(
        { error: "Analysis returned an empty result. Please try again." },
        502,
        cors,
      );
    }

    // Strip possible markdown fences the model might add despite instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Anthropic JSON:", parseErr, "Raw:", rawText.slice(0, 500));
      return jsonResponse(
        { error: "Analysis produced an invalid result. Please try again." },
        502,
        cors,
      );
    }

    // ── Persist scan (best-effort, authenticated users only) ───────────
    let scanId: string | null = null;
    if (user) {
      try {
        const { data: scanRow, error: scanErr } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            analysis,
          })
          .select("id")
          .single();

        if (scanErr) {
          console.error("Failed to persist scan:", scanErr.message);
        } else {
          scanId = scanRow?.id ?? null;
        }
      } catch (dbErr) {
        console.error("Scan persistence error:", dbErr);
      }
    }

    return jsonResponse(
      { success: true, scanId, analysis },
      200,
      cors,
    );
  } catch (err) {
    // ── 5. Safe error handling – never leak internals ───────────────────
    console.error("Unhandled analysis error:", err);
    return jsonResponse(
      { error: "An unexpected error occurred. Please try again." },
      500,
      cors,
    );
  }
});
