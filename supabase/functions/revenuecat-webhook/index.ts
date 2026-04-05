import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL" )!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "SUBSCRIPTION_EXTENDED",
  "NON_RENEWING_PURCHASE",
]);

const INACTIVE_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
]);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const processEvent = async () => {
    try {
      const event = payload.event;
      if (!event) return;

      const eventType: string = event.type;
      const appUserId: string = event.app_user_id;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(appUserId)) return;

      if (ACTIVE_EVENTS.has(eventType)) {
        await supabase.from("subscriptions").upsert(
          {
            user_id: appUserId,
            revenuecat_app_user_id: appUserId,
            entitlement_id: "pro",
            status: "active",
            product_id: event.product_id ?? null,
            expires_date: event.expiration_at_ms
              ? new Date(event.expiration_at_ms).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "revenuecat_app_user_id" }
        );
      } else if (INACTIVE_EVENTS.has(eventType)) {
        await supabase
          .from("subscriptions")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("revenuecat_app_user_id", appUserId);
      }
    } catch (err) {
      console.error("Webhook error:", err);
    }
  };

  processEvent();
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
