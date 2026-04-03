import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_BANNER_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ advertiserId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { advertiserId } = await params;
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
  if ("email" in (body || {})) patch.email = typeof body?.email === "string" && body.email ? body.email : null;
  if ("phone" in (body || {})) patch.phone = typeof body?.phone === "string" && body.phone ? body.phone : null;
  if ("notes" in (body || {})) patch.notes = typeof body?.notes === "string" && body.notes ? body.notes : null;

  const { data, error } = await access.tenantClient
    .from("advertisers")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", advertiserId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("advertiser.update failed:", error?.message);
    return NextResponse.json({ error: "Unable to update advertiser" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "advertiser.update",
    entityType: "advertiser",
    entityId: advertiserId,
    details: { updatedKeys: Object.keys(patch) },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ advertiser: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ advertiserId: string }> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { advertiserId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const { error } = await access.tenantClient
    .from("advertisers")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", advertiserId);

  if (error) {
    console.error("advertiser.delete failed:", error.message);
    return NextResponse.json({ error: "Unable to delete advertiser" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "advertiser.delete",
    entityType: "advertiser",
    entityId: advertiserId,
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ ok: true });
}
