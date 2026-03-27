import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import {
  assertCmsRateLimit,
  CMS_EDITOR_ROLES,
  CMS_MEDIA_DELETE_ROLES,
  requireTenantAccess,
} from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { mediaId } = await params;
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
  if (typeof body?.alt_text === "string") patch.alt_text = body.alt_text.trim() || null;
  if (typeof body?.folder === "string") patch.folder = body.folder.trim() || null;

  const { data, error } = await access.sessionClient
    .from("media")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", mediaId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to update media" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "media.update",
    entityType: "media",
    entityId: mediaId,
    details: { updatedKeys: Object.keys(patch) },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ media: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const rateLimitError = await assertCmsRateLimit(request, "cms-media-delete", 30, 10 * 60 * 1000);
  if (rateLimitError) {
    return rateLimitError;
  }

  const { mediaId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_MEDIA_DELETE_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { data: media, error: mediaError } = await access.sessionClient
    .from("media")
    .select("id, filename, original_filename")
    .eq("tenant_id", tenantId)
    .eq("id", mediaId)
    .single();

  if (mediaError || !media) {
    return NextResponse.json({ error: mediaError?.message || "Media not found" }, { status: 404 });
  }

  await access.serviceClient.storage.from("media").remove([String(media.filename)]);

  const { error } = await access.sessionClient
    .from("media")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", mediaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "media.delete",
    entityType: "media",
    entityId: mediaId,
    details: { filename: media.original_filename },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
