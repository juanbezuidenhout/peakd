// supabase/functions/embed/index.ts
// Lightweight edge function that generates embeddings for RAG queries
// Uses the same BAAI/bge-large-en-v1.5 model as the knowledge base build script

import { pipeline } from "npm:@xenova/transformers";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache the pipeline across warm invocations
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/bge-large-en-v1.5");
  }
  return embedder;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    if (!input || typeof input !== "string") {
      return new Response(JSON.stringify({ error: "Missing input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pipe = await getEmbedder();
    const output = await pipe(input, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data as Float32Array);

    return new Response(JSON.stringify({ embedding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("embed error:", error);
    return new Response(JSON.stringify({ error: "Embedding failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
