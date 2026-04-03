import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import {
  normalizePlatformR2Config,
  PLATFORM_R2_AUDIT_ACTION,
  readLatestPlatformR2Config,
  serializePlatformR2Config,
} from "@/lib/storage/platform-r2-config";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const client = await createServiceRoleClient();
  const config = (await readLatestPlatformR2Config(client)) ?? normalizePlatformR2Config(null);
  // Mask secret for read
  const masked = {
    ...config,
    secretAccessKey: config.secretAccessKey ? "••••••••" : "",
  };

  return NextResponse.json({ config: masked });
}

export async function PUT(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  if (!body?.config) {
    return NextResponse.json({ error: "Missing config" }, { status: 400 });
  }

  const incoming = normalizePlatformR2Config(body.config);

  // If secret is masked, keep the existing one
  if (incoming.secretAccessKey === "••••••••") {
    const client = await createServiceRoleClient();
    const prev = (await readLatestPlatformR2Config(client)) ?? normalizePlatformR2Config(null);
    incoming.secretAccessKey = prev.secretAccessKey;
  }

  const client = await createServiceRoleClient();
  const { error } = await client.from("audit_logs").insert({
    actor_user_id: access.user.id,
    tenant_id: null,
    site_id: null,
    action: PLATFORM_R2_AUDIT_ACTION,
    resource_type: "platform_runtime",
    resource_id: null,
    metadata: serializePlatformR2Config(incoming),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
