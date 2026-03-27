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
    .from("events")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data || [] });
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  if (!tenantId || typeof body?.title !== "string" || !body.title.trim() || typeof body?.starts_at !== "string") {
    return NextResponse.json({ error: "tenant_id, title and starts_at required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const payload = {
    tenant_id: tenantId,
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : null,
    location: typeof body.location === "string" ? body.location : null,
    image_url: sanitizeExternalUrl(body.image_url, true),
    category: typeof body.category === "string" ? body.category : null,
    price: typeof body.price === "string" ? body.price : null,
    ticket_url: sanitizeExternalUrl(body.ticket_url, true),
    starts_at: body.starts_at,
    ends_at: typeof body.ends_at === "string" && body.ends_at ? body.ends_at : null,
    is_recurring: Boolean(body.is_recurring),
    recurrence_rule: typeof body.recurrence_rule === "string" && body.recurrence_rule ? body.recurrence_rule : null,
  };

  const { data, error } = await access.sessionClient.from("events").insert(payload).select("*").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to create event" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "event.create",
    entityType: "event",
    entityId: data.id,
  });
  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ event: data });
}
