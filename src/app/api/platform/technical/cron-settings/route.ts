import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { getCronSettingsForTenant, getCronSettingsMap } from "@/lib/cron/settings";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const MANAGE_ROLES = new Set(["super_admin", "chief_editor"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await sessionClient
    .from("user_tenants")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settingsMap = await getCronSettingsMap([tenantId]);
  return NextResponse.json({
    tenant_id: tenantId,
    settings: getCronSettingsForTenant(settingsMap, tenantId),
    canManage: MANAGE_ROLES.has(membership.role),
  });
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  const publishMaintenanceEnabled = typeof body?.publishMaintenanceEnabled === "boolean" ? body.publishMaintenanceEnabled : null;
  const seoAnalysisEnabled = typeof body?.seoAnalysisEnabled === "boolean" ? body.seoAnalysisEnabled : null;

  if (!tenantId || publishMaintenanceEnabled === null || seoAnalysisEnabled === null) {
    return NextResponse.json(
      { error: "tenant_id, publishMaintenanceEnabled e seoAnalysisEnabled obbligatori" },
      { status: 400 }
    );
  }

  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await sessionClient
    .from("user_tenants")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!membership || !MANAGE_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = await createServiceRoleClient();
  const { data: site } = await serviceClient
    .from("sites")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!site) {
    return NextResponse.json({ error: "Site not found for tenant" }, { status: 404 });
  }

  const { data: currentSettings } = await serviceClient
    .from("site_settings_platform")
    .select("feature_flags, default_locale, timezone, onboarding_checklist, notification_settings, billing_state")
    .eq("site_id", site.id)
    .maybeSingle();

  const featureFlags =
    currentSettings?.feature_flags && typeof currentSettings.feature_flags === "object"
      ? (currentSettings.feature_flags as Record<string, unknown>)
      : {};

  const nextFeatureFlags = {
    ...featureFlags,
    cron: {
      ...(featureFlags.cron && typeof featureFlags.cron === "object" ? (featureFlags.cron as Record<string, unknown>) : {}),
      publishMaintenanceEnabled,
      seoAnalysisEnabled,
    },
  };

  const { error } = await serviceClient.from("site_settings_platform").upsert(
    {
      site_id: site.id,
      tenant_id: tenantId,
      default_locale: currentSettings?.default_locale || "it",
      timezone: currentSettings?.timezone || "Europe/Rome",
      onboarding_checklist: currentSettings?.onboarding_checklist || {},
      feature_flags: nextFeatureFlags,
      notification_settings: currentSettings?.notification_settings || {},
      billing_state: currentSettings?.billing_state || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "site_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tenant_id: tenantId,
    settings: {
      publishMaintenanceEnabled,
      seoAnalysisEnabled,
    },
  });
}
