import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl, sanitizeHtml } from "@/lib/security/html";
import { CMS_BANNER_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { bannerId } = await params;
  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const patch: Record<string, unknown> = {};
  if (typeof body?.name === "string") patch.name = body.name.trim();
  if (typeof body?.position === "string") patch.position = body.position;
  if (typeof body?.type === "string") patch.type = body.type;
  if ("image_url" in (body || {})) patch.image_url = sanitizeExternalUrl(body.image_url, true);
  if ("html_content" in (body || {})) patch.html_content = typeof body?.html_content === "string" ? sanitizeHtml(body.html_content) : null;
  if ("link_url" in (body || {})) patch.link_url = sanitizeExternalUrl(body.link_url, true);
  if (Array.isArray(body?.target_categories)) patch.target_categories = body.target_categories.map(String);
  if (typeof body?.target_device === "string") patch.target_device = body.target_device;
  if (body?.weight !== undefined) patch.weight = Number(body.weight || 1);
  if ("advertiser_id" in (body || {})) patch.advertiser_id = typeof body?.advertiser_id === "string" && body.advertiser_id ? body.advertiser_id : null;
  if ("starts_at" in (body || {})) patch.starts_at = typeof body?.starts_at === "string" && body.starts_at ? body.starts_at : null;
  if ("ends_at" in (body || {})) patch.ends_at = typeof body?.ends_at === "string" && body.ends_at ? body.ends_at : null;
  if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  const { data, error } = await access.sessionClient
    .from("banners")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", bannerId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to update banner" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "banner.update",
    entityType: "banner",
    entityId: bannerId,
    details: { updatedKeys: Object.keys(patch) },
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ banner: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { bannerId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.sessionClient.from("banners").delete().eq("tenant_id", tenantId).eq("id", bannerId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "banner.delete",
    entityType: "banner",
    entityId: bannerId,
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
