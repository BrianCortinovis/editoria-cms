import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl } from "@/lib/security/html";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { eventId } = await params;
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
  if (typeof body?.title === "string") patch.title = body.title.trim();
  if ("description" in (body || {})) patch.description = typeof body?.description === "string" ? body.description : null;
  if ("location" in (body || {})) patch.location = typeof body?.location === "string" ? body.location : null;
  if ("image_url" in (body || {})) patch.image_url = sanitizeExternalUrl(body.image_url, true);
  if ("category" in (body || {})) patch.category = typeof body?.category === "string" ? body.category : null;
  if ("price" in (body || {})) patch.price = typeof body?.price === "string" ? body.price : null;
  if ("ticket_url" in (body || {})) patch.ticket_url = sanitizeExternalUrl(body.ticket_url, true);
  if (typeof body?.starts_at === "string") patch.starts_at = body.starts_at;
  if ("ends_at" in (body || {})) patch.ends_at = typeof body?.ends_at === "string" && body.ends_at ? body.ends_at : null;
  if (body?.is_recurring !== undefined) patch.is_recurring = Boolean(body.is_recurring);
  if ("recurrence_rule" in (body || {})) patch.recurrence_rule = typeof body?.recurrence_rule === "string" && body.recurrence_rule ? body.recurrence_rule : null;

  const { data, error } = await access.tenantClient
    .from("events")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("event.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update event" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "event.update",
    entityType: "event",
    entityId: eventId,
    details: { updatedKeys: Object.keys(patch) },
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ event: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.tenantClient.from("events").delete().eq("tenant_id", tenantId).eq("id", eventId);
  if (error) {
    console.error("event.delete failed:", error.message);
    return NextResponse.json({ error: "Unable to delete event" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "event.delete",
    entityType: "event",
    entityId: eventId,
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
