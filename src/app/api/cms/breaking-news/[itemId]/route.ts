import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl } from "@/lib/security/html";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const patch: Record<string, unknown> = {};
  if (typeof body?.text === "string") patch.text = body.text.trim();
  if ("link_url" in (body || {})) patch.link_url = sanitizeExternalUrl(body.link_url, true);
  if (body?.priority !== undefined) patch.priority = Number(body.priority || 0);
  if ("expires_at" in (body || {})) patch.expires_at = typeof body?.expires_at === "string" && body.expires_at ? body.expires_at : null;
  if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  const { data, error } = await access.tenantClient
    .from("breaking_news")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("breaking_news.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update breaking news" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "breaking_news.update",
    entityType: "breaking_news",
    entityId: itemId,
    details: { updatedKeys: Object.keys(patch) },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ item: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { itemId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.tenantClient
    .from("breaking_news")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", itemId);

  if (error) {
    console.error("breaking_news.delete failed:", error.message);
    return NextResponse.json({ error: "Unable to delete breaking news" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "breaking_news.delete",
    entityType: "breaking_news",
    entityId: itemId,
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
