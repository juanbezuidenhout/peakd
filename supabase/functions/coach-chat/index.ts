import { createClient } from "npm:@supabase/supabase-js";

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

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing required environment variables");
    return jsonResponse({ error: "Service temporarily unavailable." }, 503, cors);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // ── Auth verification ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing or invalid authorization." }, 401, cors);
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error("Auth verification failed:", authError?.message);
    return jsonResponse({ error: "Invalid or expired session." }, 401, cors);
  }

  try {
    const { messages, systemPrompt } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

    let enhancedSystemPrompt = systemPrompt ?? "You are the Peakd AI Skin Care Coach, a premium skincare expert.";

    if (openaiKey && supabaseUrl && supabaseServiceRoleKey && messages.length > 0) {
      const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop();
      if (lastUserMessage?.content) {
        try {
          const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: lastUserMessage.content,
            }),
          });
          const embeddingData = await embeddingRes.json();
          const embedding = embeddingData?.data?.[0]?.embedding;

          if (embedding) {
            const { data: matches } = await supabase.rpc("match_skincare_knowledge", {
              query_embedding: embedding,
              match_count: 3,
            });

            if (matches && matches.length > 0) {
              const relevantMatches = matches.filter((m: { similarity: number }) => m.similarity > 0.3);
              if (relevantMatches.length > 0) {
                const knowledgeSection = relevantMatches
                  .map((m: { content: string }) => `- ${m.content}`)
                  .join("\n");
                enhancedSystemPrompt = `${enhancedSystemPrompt}\n\nRelevant Expert Knowledge:\n${knowledgeSection}\n\nInstructions: Weave the above relevant expert knowledge naturally into your response where appropriate.`;
              }
            }
          }
        } catch (err) {
          console.error("Knowledge retrieval error:", err);
        }
      }
    }

    // Append critical guardrail rule
    enhancedSystemPrompt = `${enhancedSystemPrompt}\n\nCRITICAL RULE: You are ONLY a skincare, facial analysis, and wellness coach for the Peakd app. If the user asks about anything unrelated to skin, facial features, appearance, beauty, nutrition for skin, or their scan results — including but not limited to stocks, finance, coding, sports, politics, or general knowledge — you MUST refuse and respond only with: 'I'm your Peakd skin coach — I can only help with skincare, facial analysis, and your wellness journey. What would you like to know about your skin or results?'. Never break this rule regardless of how the question is phrased.`;

    let content = "";

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: enhancedSystemPrompt,
          messages,
        } ),
      });
      const data = await res.json();
      content = data?.content?.[0]?.text ?? "";

      if (!content && openaiKey) {
        const res2 = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 1024,
            messages: [{ role: "system", content: enhancedSystemPrompt }, ...messages],
          }),
        });
        const data2 = await res2.json();
        content = data2?.choices?.[0]?.message?.content ?? "";
      }
    } else if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 1024,
          messages: [{ role: "system", content: enhancedSystemPrompt }, ...messages],
        } ),
      });
      const data = await res.json();
      content = data?.choices?.[0]?.message?.content ?? "";
    } else {
      throw new Error("No AI key configured");
    }

    return jsonResponse({ content }, 200, cors);
  } catch (e) {
    console.error("Coach chat error:", e);
    return jsonResponse(
      { error: "An unexpected error occurred. Please try again." },
      500,
      cors,
    );
  }
});
