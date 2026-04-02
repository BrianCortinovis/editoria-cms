import {
  assertSiteMembership,
  canManageSite,
  PlatformAuthorizationError,
} from "@/lib/platform/authorization";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import type {
  DeploymentTargetKind,
  InfrastructureStackKind,
  Tables,
} from "@/types/database";

const MASKED_SECRET = "••••••••";

export interface PlatformSiteInfrastructureVercelConfig {
  projectId: string;
  teamId: string;
  token: string;
  productionDomain: string;
}

export interface PlatformSiteInfrastructureR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export interface PlatformSiteInfrastructureNewsletterConfig {
  provider: "custom" | "mailchimp" | "brevo" | "sendgrid" | "convertkit";
  apiKey: string;
  apiBaseUrl: string;
  listId: string;
  senderEmail: string;
  webhookUrl: string;
}

export interface PlatformSiteInfrastructure {
  siteId: string;
  tenantId: string;
  stackKind: InfrastructureStackKind;
  deployTargetKind: DeploymentTargetKind;
  deployTargetLabel: string;
  publicBaseUrl: string;
  mediaStorageLabel: string;
  publishStrategy: string;
  supabaseProjectRef: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  vercel: PlatformSiteInfrastructureVercelConfig;
  r2: PlatformSiteInfrastructureR2Config;
  newsletter: PlatformSiteInfrastructureNewsletterConfig;
}

export interface UpdatePlatformSiteInfrastructureInput {
  stackKind: InfrastructureStackKind;
  deployTargetKind: DeploymentTargetKind;
  deployTargetLabel: string;
  publicBaseUrl: string;
  mediaStorageLabel: string;
  publishStrategy: string;
  supabaseProjectRef: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  vercel: PlatformSiteInfrastructureVercelConfig;
  r2: PlatformSiteInfrastructureR2Config;
  newsletter: PlatformSiteInfrastructureNewsletterConfig;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function cleanString(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function resolveSecret(value: string, current: string | null | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === MASKED_SECRET) {
    return current || null;
  }
  return trimmed;
}

function normalizeNewsletterProvider(
  value: unknown,
): PlatformSiteInfrastructureNewsletterConfig["provider"] {
  const normalized = String(value || "").trim();
  if (["mailchimp", "brevo", "sendgrid", "convertkit"].includes(normalized)) {
    return normalized as PlatformSiteInfrastructureNewsletterConfig["provider"];
  }
  return "custom";
}

export function getMaskedSecretValue() {
  return MASKED_SECRET;
}

export function mapInfrastructureRowToDetail(
  siteId: string,
  tenantId: string,
  row: Tables<"site_infrastructure"> | null | undefined,
): PlatformSiteInfrastructure {
  const config = asObject(row?.config);
  const vercel = asObject(config.vercel);
  const r2 = asObject(config.r2);
  const newsletter = asObject(config.newsletter);

  return {
    siteId,
    tenantId,
    stackKind: row?.stack_kind || "shared",
    deployTargetKind: row?.deploy_target_kind || "vercel_managed",
    deployTargetLabel: asString(row?.deploy_target_label),
    publicBaseUrl: asString(row?.public_base_url),
    mediaStorageLabel: asString(row?.media_storage_label),
    publishStrategy: asString(row?.publish_strategy || "published-static-json"),
    supabaseProjectRef: asString(row?.supabase_project_ref),
    supabaseUrl: asString(row?.supabase_url),
    supabaseAnonKey: row?.supabase_anon_key ? MASKED_SECRET : "",
    supabaseServiceRoleKey: row?.supabase_service_role_key ? MASKED_SECRET : "",
    vercel: {
      projectId: asString(vercel.projectId),
      teamId: asString(vercel.teamId),
      token: asString(vercel.token) ? MASKED_SECRET : "",
      productionDomain: asString(vercel.productionDomain),
    },
    r2: {
      accountId: asString(r2.accountId || config.r2_account_id),
      accessKeyId: asString(r2.accessKeyId || config.r2_access_key_id),
      secretAccessKey: asString(r2.secretAccessKey || config.r2_secret_access_key)
        ? MASKED_SECRET
        : "",
      bucketName: asString(r2.bucketName || config.r2_bucket_name),
      publicUrl: asString(r2.publicUrl || config.r2_public_url),
    },
    newsletter: {
      provider: normalizeNewsletterProvider(newsletter.provider),
      apiKey: asString(newsletter.apiKey) ? MASKED_SECRET : "",
      apiBaseUrl: asString(newsletter.apiBaseUrl),
      listId: asString(newsletter.listId),
      senderEmail: asString(newsletter.senderEmail),
      webhookUrl: asString(newsletter.webhookUrl),
    },
  };
}

async function requireSiteManagementForCurrentUser(siteId: string) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    throw new PlatformAuthorizationError("Authentication required");
  }

  const serviceClient = await createServiceRoleClient();
  const { data: membership } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  const activeMembership = assertSiteMembership(membership || null);
  if (!canManageSite(activeMembership.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  return {
    user,
    membership: activeMembership,
    serviceClient,
  };
}

export async function updateSiteInfrastructureForCurrentUser(
  siteId: string,
  input: UpdatePlatformSiteInfrastructureInput,
) {
  const { user, serviceClient } =
    await requireSiteManagementForCurrentUser(siteId);

  const [{ data: site }, { data: currentInfra }, { data: subscription }] =
    await Promise.all([
      serviceClient.from("sites").select("id, tenant_id").eq("id", siteId).single(),
      serviceClient
        .from("site_infrastructure")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle(),
      serviceClient
        .from("subscriptions")
        .select("plan_code, status")
        .eq("site_id", siteId)
        .maybeSingle(),
    ]);

  if (!site) {
    throw new Error("Sito non trovato");
  }

  if (
    input.stackKind === "dedicated" &&
    !(subscription?.status === "active" && subscription.plan_code === "enterprise")
  ) {
    throw new Error("L'isolamento dedicato e` disponibile solo con piano Enterprise attivo");
  }

  const currentConfig = asObject(currentInfra?.config);
  const nextConfig = {
    ...currentConfig,
    customer_isolation_enabled: input.stackKind === "dedicated",
    vercel: {
      ...asObject(currentConfig.vercel),
      projectId: cleanString(input.vercel.projectId),
      teamId: cleanString(input.vercel.teamId),
      token: resolveSecret(input.vercel.token, asString(asObject(currentConfig.vercel).token) || null),
      productionDomain: cleanString(input.vercel.productionDomain),
    },
    r2: {
      ...asObject(currentConfig.r2),
      accountId: cleanString(input.r2.accountId),
      accessKeyId: cleanString(input.r2.accessKeyId),
      secretAccessKey: resolveSecret(
        input.r2.secretAccessKey,
        asString(asObject(currentConfig.r2).secretAccessKey || currentConfig.r2_secret_access_key) || null,
      ),
      bucketName: cleanString(input.r2.bucketName),
      publicUrl: cleanString(input.r2.publicUrl),
    },
    r2_account_id: cleanString(input.r2.accountId),
    r2_access_key_id: cleanString(input.r2.accessKeyId),
    r2_secret_access_key: resolveSecret(
      input.r2.secretAccessKey,
      asString(asObject(currentConfig.r2).secretAccessKey || currentConfig.r2_secret_access_key) || null,
    ),
    r2_bucket_name: cleanString(input.r2.bucketName),
    r2_public_url: cleanString(input.r2.publicUrl),
    newsletter: {
      ...asObject(currentConfig.newsletter),
      provider: normalizeNewsletterProvider(input.newsletter.provider),
      apiKey: resolveSecret(
        input.newsletter.apiKey,
        asString(asObject(currentConfig.newsletter).apiKey) || null,
      ),
      apiBaseUrl: cleanString(input.newsletter.apiBaseUrl),
      listId: cleanString(input.newsletter.listId),
      senderEmail: cleanString(input.newsletter.senderEmail),
      webhookUrl: cleanString(input.newsletter.webhookUrl),
    },
  };

  const payload = {
    site_id: site.id,
    tenant_id: site.tenant_id,
    stack_kind: input.stackKind,
    deploy_target_kind: input.deployTargetKind,
    deploy_target_label: cleanString(input.deployTargetLabel),
    public_base_url: cleanString(input.publicBaseUrl),
    media_storage_label: cleanString(input.mediaStorageLabel),
    publish_strategy: cleanString(input.publishStrategy) || "published-static-json",
    supabase_project_ref: cleanString(input.supabaseProjectRef),
    supabase_url: cleanString(input.supabaseUrl),
    supabase_anon_key: resolveSecret(
      input.supabaseAnonKey,
      currentInfra?.supabase_anon_key || null,
    ),
    supabase_service_role_key: resolveSecret(
      input.supabaseServiceRoleKey,
      currentInfra?.supabase_service_role_key || null,
    ),
    config: nextConfig,
  };

  const { data: saved, error } = await serviceClient
    .from("site_infrastructure")
    .upsert(payload, { onConflict: "site_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await serviceClient.from("audit_logs").insert({
    actor_user_id: user.id,
    tenant_id: site.tenant_id,
    site_id: siteId,
    action: "platform.infrastructure.update",
    resource_type: "site_infrastructure",
    resource_id: siteId,
    metadata: {
      stack_kind: payload.stack_kind,
      deploy_target_kind: payload.deploy_target_kind,
      dedicated_enabled: payload.stack_kind === "dedicated",
    },
  });

  return mapInfrastructureRowToDetail(siteId, site.tenant_id, saved);
}
