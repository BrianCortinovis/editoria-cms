import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { recalculateSiteStorageUsage } from "@/lib/superadmin/storage";

function normalizeLimit(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const { siteId } = (await params) as { siteId: string };
  const body = await request.json().catch(() => null);

  const siteRes = await access.serviceClient
    .from("sites")
    .select("id, tenant_id")
    .eq("id", siteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (siteRes.error || !siteRes.data) {
    return NextResponse.json({ error: siteRes.error?.message || "Site not found" }, { status: 404 });
  }

  const payload = {
    site_id: siteId,
    tenant_id: siteRes.data.tenant_id,
    media_provider: typeof body?.mediaProvider === "string" ? body.mediaProvider : "supabase",
    published_media_provider: typeof body?.publishedMediaProvider === "string" ? body.publishedMediaProvider : "supabase",
    soft_limit_bytes: normalizeLimit(body?.softLimitBytes) ?? 1073741824,
    hard_limit_bytes: normalizeLimit(body?.hardLimitBytes) ?? 1610612736,
    monthly_egress_limit_bytes: normalizeLimit(body?.monthlyEgressLimitBytes),
    upload_blocked: Boolean(body?.uploadBlocked),
    publish_blocked: Boolean(body?.publishBlocked),
    config: typeof body?.config === "object" && body.config ? body.config : {},
  };

  const { data, error } = await access.serviceClient
    .from("site_storage_quotas")
    .upsert(payload, { onConflict: "site_id" })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to save storage policy" }, { status: 500 });
  }

  await access.serviceClient.from("audit_logs").insert({
    tenant_id: null,
    actor_user_id: access.user.id,
    action: "platform.storage_quota_updated",
    resource_type: "site_storage_quota",
    resource_id: siteId,
    metadata: { changes: payload },
  }).maybeSingle();

  return NextResponse.json({ quota: data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const { siteId } = (await params) as { siteId: string };
  const snapshot = await recalculateSiteStorageUsage(siteId, "admin_manual_refresh").catch(() => null);
  if (!snapshot) {
    return NextResponse.json({ error: "Unable to recalculate usage" }, { status: 500 });
  }

  await access.serviceClient.from("audit_logs").insert({
    tenant_id: null,
    actor_user_id: access.user.id,
    action: "platform.storage_recalculated",
    resource_type: "site_storage_quota",
    resource_id: siteId,
    metadata: {},
  }).maybeSingle();

  return NextResponse.json({ snapshot });
}
