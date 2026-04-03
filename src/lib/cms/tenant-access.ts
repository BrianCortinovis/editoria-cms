import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
  createServiceRoleClientForTenant,
} from "@/lib/supabase/server";
import { getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { hasCmsRole } from "@/lib/cms/roles";

export const CMS_VIEW_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor", "contributor", "advertiser"]);
export const CMS_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);
export const CMS_BANNER_ROLES = new Set(["admin", "super_admin", "chief_editor", "advertiser"]);
export const CMS_MEDIA_DELETE_ROLES = new Set(["admin", "super_admin", "chief_editor"]);
export const CMS_CONFIG_ROLES = new Set(["admin", "super_admin", "chief_editor"]);

export async function requireTenantAccess(
  tenantId: string,
  allowedRoles: Set<string>,
) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: membership, error } = await sessionClient
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership?.role || !hasCmsRole(membership.role, allowedRoles)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const platformServiceClient = await createServiceRoleClient();
  const tenantClient = await createServiceRoleClientForTenant(tenantId);

  return {
    sessionClient,
    serviceClient: tenantClient,
    tenantClient,
    platformServiceClient,
    user,
    role: membership.role,
  };
}

export async function assertCmsRateLimit(
  request: Request,
  key: string,
  maxRequests: number,
  windowMs: number,
) {
  const ip = getClientIp(request);
  const result = await checkRateLimit(`${key}:${ip}`, maxRequests, windowMs);

  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "Rate limit exceeded" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
      },
    },
  );
}
