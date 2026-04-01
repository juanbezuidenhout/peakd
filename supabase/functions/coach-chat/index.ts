import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let enhancedSystemPrompt = systemPrompt ?? "You are the Peakd AI Coach, a premium skincare expert.";

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
            const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
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

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
