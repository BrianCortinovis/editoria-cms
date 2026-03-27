import { redirect } from "next/navigation";
import { requirePlatformUser } from "@/lib/platform/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

function isMissingRelation(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return message.includes("schema cache") || message.includes("Could not find the table");
}

export interface SuperadminSummary {
  totalUsers: number;
  totalSites: number;
  totalTenants: number;
  sharedSites: number;
  dedicatedSites: number;
  customerVpsTargets: number;
  activeDomains: number;
  activeSubscriptions: number;
  cloudflareMediaSites: number;
  vpsMediaSites: number;
  blockedUploadSites: number;
}

export interface SuperadminSiteRow {
  siteId: string;
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  planCode: string | null;
  subscriptionStatus: string | null;
  stackKind: string | null;
  deployTargetKind: string | null;
  deployTargetLabel: string | null;
  publicBaseUrl: string | null;
  mediaProvider: string | null;
  publishedMediaProvider: string | null;
  primaryDomain: string | null;
  memberCount: number;
  lastPublishAt: string | null;
  storageSoftLimitBytes: number | null;
  storageHardLimitBytes: number | null;
  storageUsedBytes: number;
  mediaObjectCount: number;
  storageUsagePercent: number | null;
  monthlyEgressLimitBytes: number | null;
  uploadBlocked: boolean;
  publishBlocked: boolean;
  estimatedMonthlyEgressBytes: number;
  lastUsageMeasuredAt: string | null;
  createdAt: string;
}

export interface SuperadminDomainRow {
  id: string;
  hostname: string;
  status: string;
  kind: string;
  isPrimary: boolean;
  siteId: string;
  tenantId: string;
  siteName: string | null;
  createdAt: string;
  removedAt: string | null;
}

export interface SuperadminPublishJobRow {
  id: string;
  siteId: string;
  tenantId: string;
  siteName: string | null;
  jobType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
  releaseVersion: string | null;
}

export interface SuperadminOverview {
  summary: SuperadminSummary;
  sites: SuperadminSiteRow[];
  domains: SuperadminDomainRow[];
  publishJobs: SuperadminPublishJobRow[];
  recentAuditLogs: Tables<"audit_logs">[];
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function requireSuperAdmin() {
  const current = await requirePlatformUser();
  const serviceClient = await createServiceRoleClient();
  const isSuperAdmin = await isUserSuperAdmin(current.user.id);

  if (!isSuperAdmin) {
    redirect("/app");
  }

  return { ...current, serviceClient };
}

export async function isUserSuperAdmin(userId: string) {
  const serviceClient = await createServiceRoleClient();
  const { count, error } = await serviceClient
    .from("user_tenants")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("role", "super_admin");

  return !error && Boolean(count);
}

export async function getSuperadminOverview(): Promise<SuperadminOverview> {
  const { serviceClient } = await requireSuperAdmin();

  const [
    users,
    sites,
    allSitesResponse,
    tenants,
    infraRows,
    domains,
    subscriptions,
    auditLogs,
    publishJobsResponse,
    releasesResponse,
    storageQuotasResponse,
    usageSnapshotsResponse,
  ] = await Promise.all([
    serviceClient.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    serviceClient.from("sites").select("id", { count: "exact", head: true }).is("deleted_at", null),
    serviceClient.from("sites").select("id, tenant_id, name, slug, status, created_at").is("deleted_at", null).order("created_at", { ascending: false }),
    serviceClient.from("tenants").select("id", { count: "exact", head: true }),
    serviceClient.from("site_infrastructure").select("*"),
    serviceClient.from("site_domains").select("*").is("removed_at", null).order("created_at", { ascending: false }),
    serviceClient.from("subscriptions").select("id, site_id, status, plan_code"),
    serviceClient.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
    serviceClient.from("publish_jobs").select("*").order("created_at", { ascending: false }).limit(12),
    serviceClient.from("publish_releases").select("id, version_label, site_id").order("created_at", { ascending: false }).limit(24),
    serviceClient.from("site_storage_quotas").select("*"),
    serviceClient.from("site_usage_snapshots").select("*").order("measured_at", { ascending: false }).limit(100),
  ]);

  const infrastructure = isMissingRelation(infraRows.error) ? [] : (infraRows.data || []);
  const publishJobs = isMissingRelation(publishJobsResponse.error) ? [] : (publishJobsResponse.data || []);
  const publishReleases = isMissingRelation(releasesResponse.error) ? [] : (releasesResponse.data || []);
  const storageQuotas = isMissingRelation(storageQuotasResponse.error) ? [] : (storageQuotasResponse.data || []);
  const usageSnapshots = isMissingRelation(usageSnapshotsResponse.error) ? [] : (usageSnapshotsResponse.data || []);
  const allDomains = domains.data || [];
  const allSubscriptions = subscriptions.data || [];
  const allSites = allSitesResponse.data || [];

  const siteIds = new Set<string>();
  for (const site of allSites) siteIds.add(site.id);
  for (const infra of infrastructure) siteIds.add(infra.site_id);
  for (const domain of allDomains) siteIds.add(domain.site_id);
  for (const job of publishJobs) siteIds.add(job.site_id);

  const siteIdList = Array.from(siteIds);
  const membershipCountsResponse = await (siteIdList.length > 0
    ? serviceClient.from("tenant_memberships").select("site_id").in("site_id", siteIdList).is("revoked_at", null)
    : Promise.resolve({ data: [], error: null }));

  const siteById = new Map(allSites.map((site) => [site.id, site]));
  const memberCountBySite = new Map<string, number>();
  for (const membership of membershipCountsResponse.data || []) {
    memberCountBySite.set(membership.site_id, (memberCountBySite.get(membership.site_id) || 0) + 1);
  }

  const primaryDomainBySite = new Map<string, string>();
  for (const domain of allDomains) {
    const hasCurrent = primaryDomainBySite.has(domain.site_id);
    if (!hasCurrent && (domain.is_primary || domain.kind === "platform_subdomain")) {
      primaryDomainBySite.set(domain.site_id, domain.hostname);
    }
  }

  const subscriptionsBySiteId = new Map<string, Tables<"subscriptions">>();
  for (const subscription of allSubscriptions) {
    subscriptionsBySiteId.set((subscription as Tables<"subscriptions">).site_id, subscription as Tables<"subscriptions">);
  }

  const infraBySite = new Map(infrastructure.map((item) => [item.site_id, item]));
  const releaseVersionById = new Map(publishReleases.map((release) => [release.id, release.version_label]));
  const quotaBySite = new Map(storageQuotas.map((item) => [item.site_id, item]));
  const latestUsageBySite = new Map<string, typeof usageSnapshots[number]>();
  for (const snapshot of usageSnapshots) {
    if (!latestUsageBySite.has(snapshot.site_id)) {
      latestUsageBySite.set(snapshot.site_id, snapshot);
    }
  }

  const sitesDirectory: SuperadminSiteRow[] = allSites
    .map((site) => {
      const inferredDomain = primaryDomainBySite.get(site.id) ?? null;
      const infra = infraBySite.get(site.id) || {
        stack_kind: "shared",
        deploy_target_kind: "vercel_managed",
        deploy_target_label: "Managed Vercel Runtime",
        public_base_url: inferredDomain
          ? inferredDomain.endsWith(".localhost") || inferredDomain === "localhost"
            ? `http://${inferredDomain}`
            : `https://${inferredDomain}`
          : null,
        last_publish_at: null,
      };
      const subscription = subscriptionsBySiteId.get(site.id);
      const quota = quotaBySite.get(site.id);
      const usage = latestUsageBySite.get(site.id);
      const storageUsedBytes = toSafeNumber(usage?.media_library_bytes);
      const storageHardLimitBytes = quota ? toSafeNumber(quota.hard_limit_bytes) : null;
      const storageUsagePercent =
        storageHardLimitBytes && storageHardLimitBytes > 0
          ? Math.min(999, Math.round((storageUsedBytes / storageHardLimitBytes) * 100))
          : null;
      return {
        siteId: site.id,
        tenantId: site.tenant_id,
        name: site.name,
        slug: site.slug,
        status: site.status,
        planCode: subscription?.plan_code ?? null,
        subscriptionStatus: subscription?.status ?? null,
        stackKind: infra?.stack_kind ?? null,
        deployTargetKind: infra?.deploy_target_kind ?? null,
        deployTargetLabel: infra?.deploy_target_label ?? null,
        publicBaseUrl: infra?.public_base_url ?? null,
        mediaProvider: quota?.media_provider ?? null,
        publishedMediaProvider: quota?.published_media_provider ?? null,
        primaryDomain: inferredDomain,
        memberCount: memberCountBySite.get(site.id) ?? 0,
        lastPublishAt: infra?.last_publish_at ?? null,
        storageSoftLimitBytes: quota ? toSafeNumber(quota.soft_limit_bytes) : null,
        storageHardLimitBytes,
        storageUsedBytes,
        mediaObjectCount: toSafeNumber(usage?.media_object_count),
        storageUsagePercent,
        monthlyEgressLimitBytes: quota?.monthly_egress_limit_bytes === null || quota?.monthly_egress_limit_bytes === undefined
          ? null
          : toSafeNumber(quota.monthly_egress_limit_bytes),
        uploadBlocked: Boolean(quota?.upload_blocked),
        publishBlocked: Boolean(quota?.publish_blocked),
        estimatedMonthlyEgressBytes: toSafeNumber(usage?.estimated_monthly_egress_bytes),
        lastUsageMeasuredAt: usage?.measured_at ?? null,
        createdAt: site.created_at,
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const domainRows: SuperadminDomainRow[] = allDomains
    .map((domain) => ({
      id: domain.id,
      hostname: domain.hostname,
      status: domain.status,
      kind: domain.kind,
      isPrimary: domain.is_primary,
      siteId: domain.site_id,
      tenantId: domain.tenant_id,
      siteName: siteById.get(domain.site_id)?.name ?? null,
      createdAt: domain.created_at,
      removedAt: domain.removed_at,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const publishJobRows: SuperadminPublishJobRow[] = publishJobs.map((job) => ({
    id: job.id,
    siteId: job.site_id,
    tenantId: job.tenant_id,
    siteName: siteById.get(job.site_id)?.name ?? null,
    jobType: job.job_type,
    status: job.status,
    startedAt: job.started_at,
    finishedAt: job.finished_at,
    createdAt: job.created_at,
    errorMessage: job.error_message,
    releaseVersion: job.release_id ? releaseVersionById.get(job.release_id) ?? null : null,
  }));

  return {
    summary: {
      totalUsers: users.count ?? 0,
      totalSites: sites.count ?? allSites.length,
      totalTenants: tenants.count ?? 0,
      sharedSites: infrastructure.length > 0 ? infrastructure.filter((item) => item.stack_kind === "shared").length : allSites.length,
      dedicatedSites: infrastructure.filter((item) => item.stack_kind === "dedicated").length,
      customerVpsTargets: infrastructure.filter((item) => item.deploy_target_kind === "customer_vps").length,
      activeDomains: allDomains.filter((domain) => domain.status === "active").length,
      activeSubscriptions: allSubscriptions.filter((subscription) => subscription.status === "active").length,
      cloudflareMediaSites: storageQuotas.filter((item) => item.published_media_provider === "cloudflare_r2").length,
      vpsMediaSites: storageQuotas.filter((item) => item.published_media_provider === "customer_vps_local").length,
      blockedUploadSites: storageQuotas.filter((item) => item.upload_blocked).length,
    },
    sites: sitesDirectory,
    domains: domainRows,
    publishJobs: publishJobRows,
    recentAuditLogs: auditLogs.data || [],
  };
}
