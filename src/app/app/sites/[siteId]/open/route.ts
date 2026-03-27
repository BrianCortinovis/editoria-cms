import { NextResponse } from "next/server";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const serviceClient = await createServiceRoleClient();
  const { data: membership, error: membershipError } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (membershipError?.message?.includes("schema cache") || membershipError?.message?.includes("public.tenant_memberships")) {
    const { data: legacyMembership } = await serviceClient
      .from("user_tenants")
      .select("tenant_id")
      .eq("tenant_id", siteId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!legacyMembership) {
      return NextResponse.redirect(new URL("/app/sites", request.url));
    }

    return NextResponse.redirect(new URL(`/dashboard/cms?tenant=${legacyMembership.tenant_id}`, request.url));
  }

  if (!membership) {
    const { data: legacyMembership } = await serviceClient
      .from("user_tenants")
      .select("tenant_id")
      .eq("tenant_id", siteId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!legacyMembership) {
      return NextResponse.redirect(new URL("/app/sites", request.url));
    }

    return NextResponse.redirect(new URL(`/dashboard/cms?tenant=${legacyMembership.tenant_id}`, request.url));
  }

  await serviceClient
    .from("tenant_memberships")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", membership.id);

  const destination = new URL(`/dashboard/cms?tenant=${membership.tenant_id}`, request.url);
  return NextResponse.redirect(destination);
}
