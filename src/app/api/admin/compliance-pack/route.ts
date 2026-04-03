import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import {
  getGlobalCompliancePack,
  saveGlobalCompliancePack,
  syncGlobalCompliancePackToTenants,
} from "@/lib/legal/compliance-pack";
import { requireSuperAdminApi } from "@/lib/superadmin/api";

export async function GET() {
  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const pack = await getGlobalCompliancePack();
  return NextResponse.json({ pack });
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const savedPack = await saveGlobalCompliancePack(body, access.user.id);
  const sync = await syncGlobalCompliancePackToTenants({
    actorUserId: access.user.id,
    republish: true,
  });

  return NextResponse.json({
    ok: true,
    pack: savedPack,
    sync,
  });
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const tenantIds = Array.isArray(body?.tenantIds)
    ? body.tenantIds.filter((entry: unknown): entry is string => typeof entry === "string")
    : undefined;

  const sync = await syncGlobalCompliancePackToTenants({
    actorUserId: access.user.id,
    tenantIds,
    republish: true,
  });

  return NextResponse.json({
    ok: true,
    sync,
  });
}
