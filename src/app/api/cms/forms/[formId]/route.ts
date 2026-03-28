import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { z } from "zod";

const formFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
  required: z.boolean().optional(),
}).passthrough();

const formPatchSchema = z.object({
  tenant_id: z.string().uuid("tenant_id must be a valid UUID"),
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  fields: z.array(formFieldSchema).optional(),
  recipient_emails: z.array(z.string().email("invalid email")).optional(),
  success_message: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
}).passthrough();

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
  const parsed = formPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const tenantId = parsed.data.tenant_id;

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.slug !== undefined) patch.slug = parsed.data.slug;
  if ("description" in parsed.data) patch.description = parsed.data.description || null;
  if (parsed.data.fields !== undefined) patch.fields = parsed.data.fields;
  if (parsed.data.recipient_emails !== undefined) patch.recipient_emails = parsed.data.recipient_emails;
  if ("success_message" in parsed.data) patch.success_message = parsed.data.success_message || null;
  if (parsed.data.is_active !== undefined) patch.is_active = parsed.data.is_active;

  const { data, error } = await access.sessionClient
    .from("site_forms")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", formId)
    .select("id, name, slug, description, fields, recipient_emails, success_message, is_active")
    .single();

  if (error || !data) {
    console.error("form.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update form" }, { status: 500 });
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
