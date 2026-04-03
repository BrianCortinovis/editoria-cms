import { createServiceRoleClient } from "@/lib/supabase/server";

type ServiceClient = Awaited<ReturnType<typeof createServiceRoleClient>>;

export interface SiteStorageQuotaRow {
  siteId: string;
  tenantId: string;
  mediaProvider: "supabase" | "cloudflare_r2" | "customer_vps_local";
  publishedMediaProvider: "supabase" | "cloudflare_r2" | "customer_vps_local";
  softLimitBytes: number;
  hardLimitBytes: number;
  monthlyEgressLimitBytes: number | null;
  uploadBlocked: boolean;
  publishBlocked: boolean;
  config: Record<string, unknown>;
}

export interface SiteUsageSnapshotRow {
  siteId: string;
  tenantId: string;
  measuredAt: string;
  mediaLibraryBytes: number;
  mediaObjectCount: number;
  publishedMediaBytes: number;
  publishedObjectCount: number;
  estimatedMonthlyEgressBytes: number;
  articleCount: number;
  pageCount: number;
  formCount: number;
  source: string;
}

function isMissingRelation(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return message.includes("schema cache") || message.includes("Could not find the table");
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "string" ? Number(value) : typeof value === "number" ? value : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getSiteStorageQuotaByTenantId(
  tenantId: string,
  serviceClient?: ServiceClient,
): Promise<SiteStorageQuotaRow | null> {
  const client = serviceClient || (await createServiceRoleClient());
  const siteRes = await client.from("sites").select("id, tenant_id").eq("tenant_id", tenantId).is("deleted_at", null).maybeSingle();
  if (siteRes.error || !siteRes.data) {
    return null;
  }

  const quotaRes = await client.from("site_storage_quotas").select("*").eq("site_id", siteRes.data.id).maybeSingle();
  if (quotaRes.error && !isMissingRelation(quotaRes.error)) {
    throw quotaRes.error;
  }
  if (!quotaRes.data) {
    return null;
  }

  return {
    siteId: quotaRes.data.site_id,
    tenantId: quotaRes.data.tenant_id,
    mediaProvider: quotaRes.data.media_provider,
    publishedMediaProvider: quotaRes.data.published_media_provider,
    softLimitBytes: toSafeNumber(quotaRes.data.soft_limit_bytes),
    hardLimitBytes: toSafeNumber(quotaRes.data.hard_limit_bytes),
    monthlyEgressLimitBytes: quotaRes.data.monthly_egress_limit_bytes === null ? null : toSafeNumber(quotaRes.data.monthly_egress_limit_bytes),
    uploadBlocked: Boolean(quotaRes.data.upload_blocked),
    publishBlocked: Boolean(quotaRes.data.publish_blocked),
    config: typeof quotaRes.data.config === "object" && quotaRes.data.config ? quotaRes.data.config as Record<string, unknown> : {},
  };
}

export async function getObservedTenantMediaUsageBytes(
  tenantId: string,
  serviceClient?: ServiceClient,
) {
  const client = serviceClient || (await createServiceRoleClient());
  const mediaRes = await client.from("media").select("size_bytes").eq("tenant_id", tenantId);
  if (mediaRes.error) {
    throw mediaRes.error;
  }
  const bytes = (mediaRes.data || []).reduce((sum, item) => sum + toSafeNumber(item.size_bytes), 0);
  return {
    bytes,
    objectCount: (mediaRes.data || []).length,
  };
}

export async function assertSiteUploadAllowed(
  tenantId: string,
  incomingBytes: number,
  quotaServiceClient?: ServiceClient,
  usageServiceClient?: ServiceClient,
) {
  const quotaClient = quotaServiceClient || (await createServiceRoleClient());
  const usageClient = usageServiceClient || quotaClient;
  const quota = await getSiteStorageQuotaByTenantId(tenantId, quotaClient);
  if (!quota) {
    return {
      allowed: true,
      quota: null,
      usageBytes: 0,
    };
  }

  const observed = await getObservedTenantMediaUsageBytes(tenantId, usageClient);
  const nextBytes = observed.bytes + incomingBytes;
  const exceedsHard = quota.hardLimitBytes > 0 && nextBytes > quota.hardLimitBytes;

  return {
    allowed: !quota.uploadBlocked && !exceedsHard,
    quota,
    usageBytes: observed.bytes,
    nextBytes,
    exceedsHard,
  };
}

export async function recalculateSiteStorageUsage(siteId: string, source = "manual_recalc") {
  const serviceClient = await createServiceRoleClient();
  const siteRes = await serviceClient
    .from("sites")
    .select("id, tenant_id")
    .eq("id", siteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (siteRes.error || !siteRes.data) {
    throw new Error(siteRes.error?.message || "Site not found");
  }

  const tenantId = siteRes.data.tenant_id;

  const [mediaRes, articlesRes, pagesRes, formsRes] = await Promise.all([
    serviceClient.from("media").select("size_bytes").eq("tenant_id", tenantId),
    serviceClient.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("site_pages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    serviceClient.from("site_forms").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);

  if (mediaRes.error) throw mediaRes.error;
  if (articlesRes.error) throw articlesRes.error;
  if (pagesRes.error) throw pagesRes.error;
  if (formsRes.error && !isMissingRelation(formsRes.error)) throw formsRes.error;

  const mediaLibraryBytes = (mediaRes.data || []).reduce((sum, item) => sum + toSafeNumber(item.size_bytes), 0);
  const mediaObjectCount = (mediaRes.data || []).length;

  const snapshotPayload = {
    site_id: siteId,
    tenant_id: tenantId,
    source,
    media_library_bytes: mediaLibraryBytes,
    media_object_count: mediaObjectCount,
    published_media_bytes: 0,
    published_object_count: 0,
    estimated_monthly_egress_bytes: 0,
    article_count: articlesRes.count || 0,
    page_count: pagesRes.count || 0,
    form_count: isMissingRelation(formsRes.error) ? 0 : (formsRes.count || 0),
    metadata: {},
  };

  const { data, error } = await serviceClient
    .from("site_usage_snapshots")
    .insert(snapshotPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to create usage snapshot");
  }

  return {
    siteId,
    tenantId,
    measuredAt: data.measured_at,
    mediaLibraryBytes: toSafeNumber(data.media_library_bytes),
    mediaObjectCount: toSafeNumber(data.media_object_count),
    publishedMediaBytes: toSafeNumber(data.published_media_bytes),
    publishedObjectCount: toSafeNumber(data.published_object_count),
    estimatedMonthlyEgressBytes: toSafeNumber(data.estimated_monthly_egress_bytes),
    articleCount: toSafeNumber(data.article_count),
    pageCount: toSafeNumber(data.page_count),
    formCount: toSafeNumber(data.form_count),
    source: data.source,
  } satisfies SiteUsageSnapshotRow;
}
