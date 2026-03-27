import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { sanitizeExternalUrl } from "@/lib/security/html";
import { CMS_EDITOR_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_VIEW_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { data, error } = await access.sessionClient
    .from("breaking_news")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId || typeof body?.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "tenant_id and text required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const payload = {
    tenant_id: tenantId,
    text: body.text.trim(),
    link_url: sanitizeExternalUrl(body.link_url, true),
    priority: Number(body.priority || 0),
    created_by: access.user.id,
    expires_at: typeof body.expires_at === "string" && body.expires_at ? body.expires_at : null,
    is_active: body?.is_active === undefined ? true : Boolean(body.is_active),
  };

  const { data, error } = await access.sessionClient
    .from("breaking_news")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to create breaking news" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "breaking_news.create",
    entityType: "breaking_news",
    entityId: data.id,
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ item: data });
}
