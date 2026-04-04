import type { SupabaseClient } from "@supabase/supabase-js";

export const PLATFORM_EMAIL_CONTROL_AUDIT_ACTION = "platform.email.control";

export interface PlatformTransactionalEmailConfig {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  senderDomain: string;
  newsletterProvider: "brevo" | "dedicated";
  notes: string;
}

export interface SiteTransactionalEmailConfig {
  senderMode: "platform_default" | "custom";
  fromName: string;
  fromEmail: string;
  replyTo: string;
  senderDomain: string;
  notes: string;
}

export interface EffectiveTransactionalSender {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  senderDomain: string;
  source: "platform_default" | "site_custom";
}

const DEFAULT_PLATFORM_CONFIG: PlatformTransactionalEmailConfig = {
  fromName: "Editoria CMS",
  fromEmail: "",
  replyTo: "",
  senderDomain: "",
  newsletterProvider: "brevo",
  notes: "",
};

const DEFAULT_SITE_CONFIG: SiteTransactionalEmailConfig = {
  senderMode: "platform_default",
  fromName: "",
  fromEmail: "",
  replyTo: "",
  senderDomain: "",
  notes: "",
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizePlatformTransactionalEmailConfig(
  input: unknown,
): PlatformTransactionalEmailConfig {
  const record = asRecord(input);
  const newsletterProvider = asString(record.newsletterProvider, DEFAULT_PLATFORM_CONFIG.newsletterProvider);

  return {
    fromName: asString(record.fromName, DEFAULT_PLATFORM_CONFIG.fromName),
    fromEmail: asString(record.fromEmail, DEFAULT_PLATFORM_CONFIG.fromEmail),
    replyTo: asString(record.replyTo, DEFAULT_PLATFORM_CONFIG.replyTo),
    senderDomain: asString(record.senderDomain, DEFAULT_PLATFORM_CONFIG.senderDomain),
    newsletterProvider:
      newsletterProvider === "dedicated" ? "dedicated" : "brevo",
    notes: asString(record.notes, DEFAULT_PLATFORM_CONFIG.notes),
  };
}

export function normalizeSiteTransactionalEmailConfig(input: unknown): SiteTransactionalEmailConfig {
  const record = asRecord(input);
  const senderMode = asString(record.senderMode, DEFAULT_SITE_CONFIG.senderMode);

  return {
    senderMode: senderMode === "custom" ? "custom" : "platform_default",
    fromName: asString(record.fromName, DEFAULT_SITE_CONFIG.fromName),
    fromEmail: asString(record.fromEmail, DEFAULT_SITE_CONFIG.fromEmail),
    replyTo: asString(record.replyTo, DEFAULT_SITE_CONFIG.replyTo),
    senderDomain: asString(record.senderDomain, DEFAULT_SITE_CONFIG.senderDomain),
    notes: asString(record.notes, DEFAULT_SITE_CONFIG.notes),
  };
}

export async function readLatestPlatformTransactionalEmailConfig(
  client: SupabaseClient,
): Promise<PlatformTransactionalEmailConfig> {
  const { data } = await client
    .from("audit_logs")
    .select("metadata")
    .eq("action", PLATFORM_EMAIL_CONTROL_AUDIT_ACTION)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return normalizePlatformTransactionalEmailConfig(data?.metadata);
}

export function readSiteTransactionalEmailConfigFromInfrastructure(input: unknown) {
  const config = asRecord(input);
  return normalizeSiteTransactionalEmailConfig(config.transactionalEmail);
}

export function mergeSiteTransactionalEmailConfigIntoInfrastructure(
  infrastructureConfig: unknown,
  emailConfig: SiteTransactionalEmailConfig,
) {
  const config = asRecord(infrastructureConfig);
  return {
    ...config,
    transactionalEmail: {
      senderMode: emailConfig.senderMode,
      fromName: emailConfig.fromName,
      fromEmail: emailConfig.fromEmail,
      replyTo: emailConfig.replyTo,
      senderDomain: emailConfig.senderDomain,
      notes: emailConfig.notes,
    },
  };
}

export function resolveEffectiveTransactionalSender(input: {
  siteName?: string | null;
  platform: PlatformTransactionalEmailConfig;
  site: SiteTransactionalEmailConfig;
}): EffectiveTransactionalSender {
  const siteName = asString(input.siteName, "Sito");
  const siteConfig = input.site;
  const platformConfig = input.platform;
  const source = siteConfig.senderMode === "custom" && siteConfig.fromEmail
    ? "site_custom"
    : "platform_default";

  if (source === "site_custom") {
    return {
      fromName: siteConfig.fromName || siteName,
      fromEmail: siteConfig.fromEmail,
      replyTo: siteConfig.replyTo || siteConfig.fromEmail,
      senderDomain: siteConfig.senderDomain,
      source,
    };
  }

  return {
    fromName: platformConfig.fromName || "Editoria CMS",
    fromEmail: platformConfig.fromEmail,
    replyTo: platformConfig.replyTo || platformConfig.fromEmail,
    senderDomain: platformConfig.senderDomain,
    source,
  };
}
