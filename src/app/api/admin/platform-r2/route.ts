import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import { createServiceRoleClient } from "@/lib/supabase/server";

const AUDIT_ACTION = "platform.r2.config";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

function normalizeConfig(input: unknown): R2Config {
  const r = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    accountId: typeof r.accountId === "string" ? r.accountId : "",
    accessKeyId: typeof r.accessKeyId === "string" ? r.accessKeyId : "",
    secretAccessKey: typeof r.secretAccessKey === "string" ? r.secretAccessKey : "",
    bucketName: typeof r.bucketName === "string" ? r.bucketName : "",
    publicUrl: typeof r.publicUrl === "string" ? r.publicUrl : "",
  };
}

export async function GET() {
  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const client = await createServiceRoleClient();
  const { data } = await client
    .from("audit_logs")
    .select("metadata")
    .eq("action", AUDIT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = normalizeConfig(data?.metadata);
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

  const incoming = normalizeConfig(body.config);

  // If secret is masked, keep the existing one
  if (incoming.secretAccessKey === "••••••••") {
    const client = await createServiceRoleClient();
    const { data: existing } = await client
      .from("audit_logs")
      .select("metadata")
      .eq("action", AUDIT_ACTION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prev = normalizeConfig(existing?.metadata);
    incoming.secretAccessKey = prev.secretAccessKey;
  }

  const client = await createServiceRoleClient();
  const { error } = await client.from("audit_logs").insert({
    actor_user_id: access.user.id,
    tenant_id: null,
    site_id: null,
    action: AUDIT_ACTION,
    resource_type: "platform_runtime",
    resource_id: "global",
    metadata: incoming,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
