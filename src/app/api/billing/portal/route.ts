import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import {
  createCustomerPortalSession,
  isStripeConfigured,
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
  const siteId = body?.siteId as string | undefined;

  if (!siteId) {
    return NextResponse.json(
      { error: "siteId required" },
      { status: 400 },
    );
  }

  // Use service role to look up subscription (RLS may not expose it to user)
  const serviceClient = await createServiceRoleClient();
  const { data: subscription, error } = await serviceClient
    .from("subscriptions")
    .select("external_customer_id")
    .eq("site_id", siteId)
    .eq("provider", "stripe")
    .not("external_customer_id", "is", null)
    .maybeSingle();

  if (error || !subscription?.external_customer_id) {
    return NextResponse.json(
      { error: "No Stripe subscription found for this site" },
      { status: 404 },
    );
  }

  // Verify the user has access to this site
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!membership) {
    const { data: legacyMembership } = await supabase
      .from("user_tenants")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!legacyMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;

  try {
    const portalUrl = await createCustomerPortalSession(
      subscription.external_customer_id,
      `${origin}/dashboard/impostazioni`,
    );

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    console.error("Portal session creation failed:", err);
    const message =
      err instanceof Error ? err.message : "Portal session creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
