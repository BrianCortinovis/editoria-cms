import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_EDITOR_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

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
    return NextResponse.json({ error: formsRes.error.message }, { status: 500 });
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
      return NextResponse.json({ error: submissionsRes.error.message }, { status: 500 });
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
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId || typeof body?.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "tenant_id and name required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const payload = {
    tenant_id: tenantId,
    name: body.name.trim(),
    slug: typeof body.slug === "string" ? body.slug : "",
    description: typeof body.description === "string" && body.description ? body.description : null,
    fields: Array.isArray(body.fields) ? body.fields : [],
    recipient_emails: Array.isArray(body.recipient_emails) ? body.recipient_emails.map(String) : [],
    success_message: typeof body.success_message === "string" && body.success_message ? body.success_message : null,
    is_active: Boolean(body.is_active),
  };

  const { data, error } = await access.sessionClient
    .from("site_forms")
    .insert(payload)
    .select("id, name, slug, description, fields, recipient_emails, success_message, is_active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to create form" }, { status: 500 });
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
