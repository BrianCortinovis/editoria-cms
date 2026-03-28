import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_EDITOR_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { z } from "zod";

const formFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
  required: z.boolean().optional(),
}).passthrough();

const formCreateSchema = z.object({
  tenant_id: z.string().uuid("tenant_id must be a valid UUID"),
  name: z.string().min(1, "name is required").transform((v) => v.trim()),
  slug: z.string().optional().default(""),
  description: z.string().nullable().optional(),
  fields: z.array(formFieldSchema).optional().default([]),
  recipient_emails: z.array(z.string().email("invalid email")).optional().default([]),
  success_message: z.string().nullable().optional(),
  is_active: z.boolean().optional().default(false),
}).passthrough();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const formId = searchParams.get("form_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_VIEW_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const formsRes = await access.sessionClient
    .from("site_forms")
    .select("id, name, slug, description, fields, recipient_emails, success_message, is_active")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (formsRes.error) {
    console.error("forms.list failed:", formsRes.error.message);
    return NextResponse.json({ error: "Unable to load forms" }, { status: 500 });
  }

  let submissions: unknown[] = [];
  if (formId) {
    const submissionsRes = await access.sessionClient
      .from("form_submissions")
      .select("id, submitter_name, submitter_email, status, created_at")
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (submissionsRes.error) {
      console.error("form_submissions.list failed:", submissionsRes.error.message);
      return NextResponse.json({ error: "Unable to load submissions" }, { status: 500 });
    }

    submissions = submissionsRes.data || [];
  }

  return NextResponse.json({
    forms: formsRes.data || [],
    submissions,
  });
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const parsed = formCreateSchema.safeParse(body);
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

  const payload = {
    tenant_id: tenantId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    fields: parsed.data.fields,
    recipient_emails: parsed.data.recipient_emails,
    success_message: parsed.data.success_message || null,
    is_active: parsed.data.is_active,
  };

  const { data, error } = await access.sessionClient
    .from("site_forms")
    .insert(payload)
    .select("id, name, slug, description, fields, recipient_emails, success_message, is_active")
    .single();

  if (error || !data) {
    console.error("form.create failed:", error?.message);
    return NextResponse.json({ error: "Unable to create form" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "form.create",
    entityType: "site_form",
    entityId: data.id,
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ form: data });
}
