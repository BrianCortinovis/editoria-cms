import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import {
  createCheckoutSession,
  isStripeConfigured,
  PLAN_PRICES,
} from "@/lib/billing/stripe-service";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Billing not configured" },
      { status: 503 },
    );
  }

  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "JSON body required" },
      { status: 400 },
    );
  }

  const { siteId, planCode, interval } = body as {
    siteId?: string;
    planCode?: string;
    interval?: string;
  };

  if (!siteId || typeof siteId !== "string") {
    return NextResponse.json(
      { error: "siteId required" },
      { status: 400 },
    );
  }

  if (!planCode || !PLAN_PRICES[planCode] || planCode === "free") {
    return NextResponse.json(
      { error: "Invalid plan. Allowed values: base, medium, enterprise" },
      { status: 400 },
    );
  }

  const billingInterval =
    interval === "year" ? ("year" as const) : ("month" as const);

  // Verify the user has access to this site via tenant_memberships or user_tenants
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!membership) {
    // Fallback: check legacy user_tenants
    const { data: legacyMembership } = await supabase
      .from("user_tenants")
      .select("role, tenants!inner(id)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!legacyMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Look up the site to get tenant_id
  const { data: site } = await supabase
    .from("sites")
    .select("id, tenant_id")
    .eq("id", siteId)
    .maybeSingle();

  const tenantId = site?.tenant_id || siteId;

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  try {
    const checkoutUrl = await createCheckoutSession({
      siteId,
      tenantId,
      userId: user.id,
      userEmail: user.email || "",
      planCode,
      interval: billingInterval,
      successUrl: `${origin}/app/profile/site?billing=success`,
      cancelUrl: `${origin}/app/profile/site?billing=cancel`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Checkout session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
