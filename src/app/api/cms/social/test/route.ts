import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { CMS_CONFIG_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { testSocialChannel } from "@/lib/social/post-service";
import { SOCIAL_PLATFORMS, type SocialPlatformKey, type SocialChannelConfig } from "@/lib/social/platforms";

const VALID_PLATFORMS = new Set(SOCIAL_PLATFORMS.map((p) => p.key));

/**
 * POST /api/cms/social/test
 * Send a test message to a single social platform to verify credentials.
 *
 * Body: { tenant_id, platform, channel: SocialChannelConfig }
 * Returns: SocialPostResult
 */
export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.tenant_id || !body.platform) {
    return NextResponse.json(
      { error: "tenant_id e platform richiesti" },
      { status: 400 },
    );
  }

  const tenantId = String(body.tenant_id);
  const platform = String(body.platform) as SocialPlatformKey;

  if (!VALID_PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: `Piattaforma non valida: ${platform}` },
      { status: 400 },
    );
  }

  const access = await requireTenantAccess(tenantId, CMS_CONFIG_ROLES);
  if ("error" in access) return access.error;

  // Build channel config from body
  const ch: SocialChannelConfig = {
    enabled: true,
    primaryValue: String(body.channel?.primaryValue ?? ""),
    secondaryValue: String(body.channel?.secondaryValue ?? ""),
    webhookUrl: String(body.channel?.webhookUrl ?? ""),
    accessToken: String(body.channel?.accessToken ?? ""),
  };

  const result = await testSocialChannel(platform, ch);

  return NextResponse.json(result);
}
