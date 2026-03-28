import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { AVAILABLE_MODULES, type ModuleId } from "@/lib/modules";

const VALID_MODULES = new Set(AVAILABLE_MODULES.map((module) => module.id));

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const { siteId } = (await params) as { siteId: string };
  const body = await request.json().catch(() => null);
  const requestedModules = Array.isArray(body?.activeModules)
    ? body.activeModules.filter((item: unknown): item is ModuleId => typeof item === "string" && VALID_MODULES.has(item as ModuleId))
    : [];

  const siteRes = await access.serviceClient
    .from("sites")
    .select("id, tenant_id")
    .eq("id", siteId)
    .is("deleted_at", null)
    .maybeSingle();

  if (siteRes.error || !siteRes.data) {
    return NextResponse.json({ error: siteRes.error?.message || "Site not found" }, { status: 404 });
  }

  const tenantRes = await access.serviceClient
    .from("tenants")
    .select("id, settings")
    .eq("id", siteRes.data.tenant_id)
    .maybeSingle();

  if (tenantRes.error || !tenantRes.data) {
    return NextResponse.json({ error: tenantRes.error?.message || "Tenant not found" }, { status: 404 });
  }

  const currentSettings = (tenantRes.data.settings || {}) as Record<string, unknown>;
  const nextSettings = {
    ...currentSettings,
    active_modules: requestedModules,
  };

  const { error } = await access.serviceClient
    .from("tenants")
    .update({ settings: nextSettings })
    .eq("id", siteRes.data.tenant_id);

  if (error) {
    return NextResponse.json({ error: error.message || "Unable to save tenant modules" }, { status: 500 });
  }

  await access.serviceClient.from("audit_logs").insert({
    tenant_id: siteRes.data.tenant_id,
    actor_user_id: access.user.id,
    action: "platform.modules_updated",
    resource_type: "tenant_modules",
    resource_id: siteId,
    metadata: { active_modules: requestedModules },
  }).maybeSingle();

  return NextResponse.json({ ok: true, activeModules: requestedModules });
}
