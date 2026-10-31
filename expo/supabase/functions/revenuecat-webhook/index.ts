import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Keeps profiles.subscription_tier in sync with RevenueCat. Two plans: Free and
// Pro. Entitlements and products from the old Basic/Standard/Premium plans
// still grant Pro, so existing subscribers keep their access. Pro is stored as
// "premium": the column's check constraint predates the Pro plan, and the app
// treats every paid value as Pro.

const MUTATING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "EXPIRATION",
])

const PAID_ENTITLEMENTS = ["pro", "premium", "standard", "basic"]
const PAID_PRODUCT = /pro|premium|standard|basic/i

type Tier = "free" | "premium"

function resolveTier(event: any): Tier {
  // EXPIRATION lists the entitlements that just ended; access is gone.
  if (event.type === "EXPIRATION") return "free"

  if (event.type === "PRODUCT_CHANGE" && typeof event.new_product_id === "string") {
    return PAID_PRODUCT.test(event.new_product_id) ? "premium" : "free"
  }

  const entitlements: string[] = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids
    : typeof event.entitlement_id === "string"
      ? [event.entitlement_id]
      : []
  if (entitlements.some((id) => PAID_ENTITLEMENTS.includes(id))) return "premium"

  // Purchases made before entitlements were attached still carry the product.
  if (typeof event.product_id === "string" && PAID_PRODUCT.test(event.product_id)) return "premium"

  return "free"
}

// Shared secret RevenueCat sends in the Authorization header (Integrations ->
// Webhooks -> Authorization header value). Set REVENUECAT_WEBHOOK_AUTH in
// Supabase to the same value to reject forged events; while it is unset every
// call is accepted. (The older REVENUECAT_WEBHOOK_SECRET was never configured in
// RevenueCat, so enforcing it would drop real renewals.)
const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? ""

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("ok", { status: 200 })
    }

    if (WEBHOOK_SECRET) {
      // Accept the secret whether either side includes a "Bearer " prefix.
      const strip = (value: string) => value.replace(/^Bearer\s+/i, "").trim()
      if (strip(req.headers.get("Authorization") ?? "") !== strip(WEBHOOK_SECRET)) {
        return new Response("unauthorized", { status: 401 })
      }
    }

    const body = await req.json()
    const event = body?.event ?? body

    const eventType = event?.type
    const appUserId = event?.app_user_id

    if (!eventType || eventType === "TEST") {
      return new Response("ignored", { status: 200 })
    }

    if (!MUTATING_EVENTS.has(eventType)) {
      return new Response("ignored", { status: 200 })
    }

    if (!appUserId) {
      return new Response("ignored", { status: 200 })
    }

    const tier = resolveTier(event)

    const expiresAt =
      tier === "premium" && typeof event.expiration_at_ms === "number"
        ? new Date(event.expiration_at_ms)
        : null

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data, error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
      })
      .eq("revenuecat_app_user_id", appUserId)
      .select("id")

    if (error) {
      console.error("DB error:", error)
      return new Response("db error", { status: 500 })
    }

    if (!data || data.length === 0) {
      return new Response("no-op", { status: 200 })
    }

    return new Response("ok", { status: 200 })
  } catch (err) {
    console.error("Webhook crash:", err)
    return new Response("error", { status: 500 })
  }
})
