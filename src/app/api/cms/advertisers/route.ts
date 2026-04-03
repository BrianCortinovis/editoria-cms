import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { CMS_BANNER_ROLES, CMS_VIEW_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";

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

  const { data, error } = await access.tenantClient
    .from("advertisers")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    console.error("advertisers.list failed:", error.message);
    return NextResponse.json({ error: "Unable to load advertisers" }, { status: 500 });
  }

  return NextResponse.json({ advertisers: data || [] });
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

  const access = await requireTenantAccess(tenantId, CMS_BANNER_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const payload = {
    tenant_id: tenantId,
    name: body.name.trim(),
    email: typeof body.email === "string" && body.email ? body.email : null,
    phone: typeof body.phone === "string" && body.phone ? body.phone : null,
    notes: typeof body.notes === "string" && body.notes ? body.notes : null,
  };

  const { data, error } = await access.tenantClient
    .from("advertisers")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("advertiser.create failed:", error?.message);
    return NextResponse.json({ error: "Unable to create advertiser" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "advertiser.create",
    entityType: "advertiser",
    entityId: data.id,
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);
  return NextResponse.json({ advertiser: data });
}
