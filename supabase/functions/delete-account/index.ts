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
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    return jsonResponse(
      { error: "Service temporarily unavailable." },
      503,
      cors,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Auth verification ───────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(
      { error: "Missing or invalid authorization." },
      401,
      cors,
    );
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

  // ── Delete user data from all tables ────────────────────────────────────
  // Order doesn't matter because there are no FK constraints between these
  // user-data tables; we run them in parallel for speed.
  const tables = ["scans", "subscriptions", "feature_requests"];

  const deleteResults = await Promise.allSettled(
    tables.map((table) =>
      supabase.from(table).delete().eq("user_id", user.id)
    ),
  );

  for (let i = 0; i < deleteResults.length; i++) {
    const result = deleteResults[i];
    if (result.status === "rejected") {
      console.error(`Failed to delete from ${tables[i]}:`, result.reason);
    } else if (result.value.error) {
      console.error(
        `Failed to delete from ${tables[i]}:`,
        result.value.error.message,
      );
    }
  }

  // ── Delete the auth account ─────────────────────────────────────────────
  const { error: deleteUserError } =
    await supabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error("Failed to delete auth user:", deleteUserError.message);
    return jsonResponse(
      { error: "Failed to delete account. Please try again or contact support." },
      500,
      cors,
    );
  }

  return jsonResponse({ success: true }, 200, cors);
});
