import { createServiceRoleClient } from "@/lib/supabase/server";

export interface PlatformCronSettings {
  publishMaintenanceEnabled: boolean;
  seoAnalysisEnabled: boolean;
}

const DEFAULT_PLATFORM_CRON_SETTINGS: PlatformCronSettings = {
  publishMaintenanceEnabled: true,
  seoAnalysisEnabled: true,
};

export function normalizePlatformCronSettings(input: unknown): PlatformCronSettings {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    publishMaintenanceEnabled:
      typeof record.publishMaintenanceEnabled === "boolean"
        ? record.publishMaintenanceEnabled
        : DEFAULT_PLATFORM_CRON_SETTINGS.publishMaintenanceEnabled,
    seoAnalysisEnabled:
      typeof record.seoAnalysisEnabled === "boolean"
        ? record.seoAnalysisEnabled
        : DEFAULT_PLATFORM_CRON_SETTINGS.seoAnalysisEnabled,
  };
}

export async function getPlatformCronSettings() {
  const serviceClient = await createServiceRoleClient();
  const { data, error } = await serviceClient
    .from("audit_logs")
    .select("id, metadata, created_at")
    .eq("action", "platform.cron.settings")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_PLATFORM_CRON_SETTINGS;
  }

  return normalizePlatformCronSettings(data.metadata);
}

export async function savePlatformCronSettings(
  settings: PlatformCronSettings,
  actorUserId: string | null
) {
  const serviceClient = await createServiceRoleClient();
  const normalized = normalizePlatformCronSettings(settings);

  const { error } = await serviceClient.from("audit_logs").insert({
    actor_user_id: actorUserId,
    tenant_id: null,
    site_id: null,
    action: "platform.cron.settings",
    resource_type: "platform_runtime",
    resource_id: "global",
    metadata: normalized,
  });

  if (error) {
    throw error;
  }

  return normalized;
}

export function getDefaultPlatformCronSettings() {
  return DEFAULT_PLATFORM_CRON_SETTINGS;
}
