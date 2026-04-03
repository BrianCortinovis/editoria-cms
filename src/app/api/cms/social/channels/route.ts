import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { CMS_CONFIG_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { normalizeSocialAutoConfig, type SocialAutoConfig } from "@/lib/social/platforms";

const MASKED_SECRET = "••••••••";

function maskSocialConfigSecrets(config: SocialAutoConfig): SocialAutoConfig {
  return {
    ...config,
    channels: Object.fromEntries(
      Object.entries(config.channels).map(([key, channel]) => [
        key,
        {
          ...channel,
          webhookUrl: channel.webhookUrl ? MASKED_SECRET : "",
          accessToken: channel.accessToken ? MASKED_SECRET : "",
        },
      ]),
    ) as SocialAutoConfig["channels"],
  };
}

function restoreMaskedSocialConfigSecrets(currentConfig: SocialAutoConfig, incomingConfig: SocialAutoConfig): SocialAutoConfig {
  return {
    ...incomingConfig,
    channels: Object.fromEntries(
      Object.entries(incomingConfig.channels).map(([key, channel]) => {
        const currentChannel = currentConfig.channels[key as keyof typeof currentConfig.channels];
        return [
          key,
          {
            ...channel,
            webhookUrl: channel.webhookUrl === MASKED_SECRET ? currentChannel?.webhookUrl ?? "" : channel.webhookUrl,
            accessToken: channel.accessToken === MASKED_SECRET ? currentChannel?.accessToken ?? "" : channel.accessToken,
          },
        ];
      }),
    ) as SocialAutoConfig["channels"],
  };
}

/**
 * GET /api/cms/social/channels?tenant_id=...
 * Returns the social auto-post configuration for a tenant.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_CONFIG_ROLES);
  if ("error" in access) return access.error;

  const { data: tenant, error } = await access.platformServiceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const moduleConfig = (settings.module_config as Record<string, unknown>) ?? {};
  const socialConfig = normalizeSocialAutoConfig(moduleConfig.social_auto);

  return NextResponse.json({ config: maskSocialConfigSecrets(socialConfig) });
}

/**
 * POST /api/cms/social/channels
 * Save/update social auto-post configuration for a tenant.
 * Body:
 * - platform scope: { tenant_id, config: SocialAutoConfig }
 * - operational scope: { tenant_id, scope: "operational", config: { channels: { key: { enabled } } } }
 */
export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.tenant_id) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const tenantId = String(body.tenant_id);

  const access = await requireTenantAccess(tenantId, CMS_CONFIG_ROLES);
  if ("error" in access) return access.error;

  // Normalize the incoming config to ensure consistency
  const incomingConfig = normalizeSocialAutoConfig(body.config);
  const scope = body.scope === "operational" ? "operational" : "platform";

  // Read current settings
  const { data: tenant, error: readError } = await access.platformServiceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  if (readError || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const currentSettings = (tenant.settings ?? {}) as Record<string, unknown>;
  const currentModuleConfig = (currentSettings.module_config as Record<string, unknown>) ?? {};
  const currentConfig = normalizeSocialAutoConfig(currentModuleConfig.social_auto);
  const nextIncomingConfig = restoreMaskedSocialConfigSecrets(currentConfig, incomingConfig);

  const nextConfig: SocialAutoConfig =
    scope === "operational"
      ? normalizeSocialAutoConfig({
          ...currentConfig,
          channels: Object.fromEntries(
            Object.entries(currentConfig.channels).map(([key, channel]) => [
              key,
              {
                ...channel,
                enabled: nextIncomingConfig.channels[key as keyof typeof nextIncomingConfig.channels]?.enabled ?? channel.enabled,
              },
            ]),
          ),
        })
      : nextIncomingConfig;

  // Merge into settings
  const updatedSettings = {
    ...currentSettings,
    module_config: {
      ...currentModuleConfig,
      social_auto: nextConfig,
    },
  };

  const { error: updateError } = await access.platformServiceClient
    .from("tenants")
    .update({ settings: updatedSettings })
    .eq("id", tenantId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, config: maskSocialConfigSecrets(nextConfig), scope });
}
