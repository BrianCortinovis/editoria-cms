import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ formId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { formId } = await params;
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
  if (typeof body?.name === "string") patch.name = body.name.trim();
  if (typeof body?.slug === "string") patch.slug = body.slug;
  if ("description" in (body || {})) patch.description = typeof body?.description === "string" && body.description ? body.description : null;
  if (Array.isArray(body?.fields)) patch.fields = body.fields;
  if (Array.isArray(body?.recipient_emails)) patch.recipient_emails = body.recipient_emails.map(String);
  if ("success_message" in (body || {})) patch.success_message = typeof body?.success_message === "string" && body.success_message ? body.success_message : null;
  if (body?.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  const { data, error } = await access.sessionClient
    .from("site_forms")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", formId)
    .select("id, name, slug, description, fields, recipient_emails, success_message, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to update form" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "form.update",
    entityType: "site_form",
    entityId: formId,
    details: { updatedKeys: Object.keys(patch) },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ form: data });
}
