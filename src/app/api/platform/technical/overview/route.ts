import { NextResponse } from "next/server";
import { getCronSettingsForTenant, getCronSettingsMap } from "@/lib/cron/settings";
import { hasCmsRole } from "@/lib/cms/roles";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getDomainProviderMode, getPlatformBaseDomain } from "@/lib/platform/constants";
import { getObservedTenantMediaUsageBytes, getSiteStorageQuotaByTenantId } from "@/lib/superadmin/storage";

const TECHNICAL_OVERVIEW_ROLES = new Set(["admin", "super_admin", "chief_editor"]);

function getProjectRef() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const match = rawUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] || null;
}

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

  if (!membership || !hasCmsRole(membership.role, TECHNICAL_OVERVIEW_ROLES)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = await createServiceRoleClient();
  const cronSettingsMap = await getCronSettingsMap([tenantId]);
  const cronSettings = getCronSettingsForTenant(cronSettingsMap, tenantId);
  const projectRef = getProjectRef();
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "") || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const tenant = await serviceClient.from("tenants").select("id, name, slug, domain").eq("id", tenantId).maybeSingle();
  const tenantSlug = tenant.data?.slug || null;

  const [
    site,
    members,
    domains,
    pages,
    articles,
    media,
    events,
    banners,
    mediaBucket,
    mediaObjects,
    subscription,
    recentCronLogs,
    observedMediaUsage,
    storageQuota,
  ] = await Promise.all([
    serviceClient.from("sites").select("id, status, default_subdomain").eq("tenant_id", tenantId).maybeSingle(),
    serviceClient.from("tenant_memberships").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).is("revoked_at", null),
    serviceClient.from("site_domains").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).is("removed_at", null),
    serviceClient.from("site_pages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("media").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("banners").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("storage.buckets").select("id").eq("id", "media").maybeSingle(),
    tenantSlug
      ? serviceClient.from("storage.objects").select("id", { count: "exact", head: true }).eq("bucket_id", "media").ilike("name", `${tenantSlug}/%`)
      : Promise.resolve({ count: 0 } as { count: number | null }),
    serviceClient.from("subscriptions").select("plan_code, status").eq("tenant_id", tenantId).maybeSingle(),
    serviceClient
      .from("audit_logs")
      .select("id, action, tenant_id, site_id, metadata, created_at")
      .in("action", ["cron.publish_maintenance", "cron.publish_maintenance.tenant", "cron.seo_analysis"])
      .order("created_at", { ascending: false })
      .limit(20),
    getObservedTenantMediaUsageBytes(tenantId, serviceClient),
    getSiteStorageQuotaByTenantId(tenantId, serviceClient),
  ]);

  const globalMaintenance =
    recentCronLogs.data?.find((entry) => entry.action === "cron.publish_maintenance") || null;
  const tenantMaintenance =
    recentCronLogs.data?.find(
      (entry) => entry.action === "cron.publish_maintenance.tenant" && entry.tenant_id === tenantId
    ) || null;
  const seoCron = recentCronLogs.data?.find((entry) => entry.action === "cron.seo_analysis") || null;

  return NextResponse.json({
    projectRef,
    supabaseHost,
    appUrl,
    tenant: tenant.data || null,
    site: site.data || null,
    membershipRole: membership.role,
    platformBaseDomain: getPlatformBaseDomain(),
    domainProvider: getDomainProviderMode(),
    stats: {
      members: members.count ?? 0,
      domains: domains.count ?? 0,
      pages: pages.count ?? 0,
      articles: articles.count ?? 0,
      media: media.count ?? 0,
      events: events.count ?? 0,
      banners: banners.count ?? 0,
    },
    storage: {
      bucketCount: mediaBucket.data ? 1 : 0,
      mediaObjectCount: mediaObjects.count ?? 0,
      mediaLibraryBytes: observedMediaUsage.bytes,
      mediaLibraryObjectCount: observedMediaUsage.objectCount,
      quota: storageQuota
        ? {
            mediaProvider: storageQuota.mediaProvider,
            publishedMediaProvider: storageQuota.publishedMediaProvider,
            softLimitBytes: storageQuota.softLimitBytes,
            hardLimitBytes: storageQuota.hardLimitBytes,
            monthlyEgressLimitBytes: storageQuota.monthlyEgressLimitBytes,
            uploadBlocked: storageQuota.uploadBlocked,
            publishBlocked: storageQuota.publishBlocked,
          }
        : null,
    },
    subscription: subscription.data || null,
    cron: {
      publishMaintenance: globalMaintenance
        ? {
            createdAt: globalMaintenance.created_at,
            metadata: globalMaintenance.metadata,
          }
        : null,
      tenantMaintenance: tenantMaintenance
        ? {
            createdAt: tenantMaintenance.created_at,
            metadata: tenantMaintenance.metadata,
          }
        : null,
      seoAnalysis: seoCron
        ? {
            createdAt: seoCron.created_at,
            metadata: seoCron.metadata,
          }
        : null,
      settings: cronSettings,
    },
    billing: {
      available: false,
      note: "Billing API not configured in the application environment. Showing observable consumption and schema status.",
    },
  });
}
