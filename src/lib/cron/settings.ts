import { createServiceRoleClient } from "@/lib/supabase/server";

export interface TenantCronSettings {
  publishMaintenanceEnabled: boolean;
  seoAnalysisEnabled: boolean;
}

const DEFAULT_CRON_SETTINGS: TenantCronSettings = {
  publishMaintenanceEnabled: true,
  seoAnalysisEnabled: true,
};

export function normalizeTenantCronSettings(featureFlags: unknown): TenantCronSettings {
  const root = featureFlags && typeof featureFlags === "object" ? (featureFlags as Record<string, unknown>) : {};
  const cron = root.cron && typeof root.cron === "object" ? (root.cron as Record<string, unknown>) : {};

  return {
    publishMaintenanceEnabled:
      typeof cron.publishMaintenanceEnabled === "boolean"
        ? cron.publishMaintenanceEnabled
        : DEFAULT_CRON_SETTINGS.publishMaintenanceEnabled,
    seoAnalysisEnabled:
      typeof cron.seoAnalysisEnabled === "boolean"
        ? cron.seoAnalysisEnabled
        : DEFAULT_CRON_SETTINGS.seoAnalysisEnabled,
  };
}

export async function getCronSettingsMap(tenantIds?: string[]) {
  const serviceClient = await createServiceRoleClient();
  let query = serviceClient.from("site_settings_platform").select("tenant_id, feature_flags");

  if (tenantIds && tenantIds.length > 0) {
    query = query.in("tenant_id", tenantIds);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const map = new Map<string, TenantCronSettings>();
  for (const row of data || []) {
    map.set(row.tenant_id, normalizeTenantCronSettings(row.feature_flags));
  }

  return map;
}

export function getCronSettingsForTenant(
  settingsMap: Map<string, TenantCronSettings>,
  tenantId: string
) {
  return settingsMap.get(tenantId) || DEFAULT_CRON_SETTINGS;
}

export function getDefaultCronSettings() {
  return DEFAULT_CRON_SETTINGS;
}
