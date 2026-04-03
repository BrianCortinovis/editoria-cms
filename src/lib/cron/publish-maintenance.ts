import { triggerPublish } from "@/lib/publish/runner";
import { getPlatformCronSettings } from "@/lib/cron/platform-settings";
import { getCronSettingsForTenant, getCronSettingsMap } from "@/lib/cron/settings";
import { syncGlobalCompliancePackToTenants } from "@/lib/legal/compliance-pack";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { autoPostToSocial, buildArticleUrl } from "@/lib/social/post-service";
import { normalizeSocialAutoConfig } from "@/lib/social/platforms";

interface MaintenanceRunSummary {
  processedAt: string;
  scheduledArticlesPublished: number;
  breakingNewsExpired: number;
  bannersExpired: number;
  slotAssignmentsExpired: number;
  complianceTenantSyncCount: number;
  compliancePackVersion: string | null;
  tenantIdsRepublished: string[];
  publishResults: Array<{
    tenantId: string;
    ok: boolean;
    message?: string;
  }>;
}

function uniqueTenantIds(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export async function runPublishMaintenance(): Promise<MaintenanceRunSummary> {
  const supabase = await createServiceRoleClient();
  const now = new Date().toISOString();
  const tenantIdsNeedingPublish: string[] = [];
  const publishResults: MaintenanceRunSummary["publishResults"] = [];
  const platformSettings = await getPlatformCronSettings();

  if (!platformSettings.publishMaintenanceEnabled) {
    await supabase.from("audit_logs").insert({
      actor_user_id: null,
      tenant_id: null,
      site_id: null,
      action: "cron.publish_maintenance.skipped",
      resource_type: "cron_run",
      resource_id: null,
      metadata: {
        processedAt: now,
        reason: "platform_disabled",
      },
    });

    return {
      processedAt: now,
      scheduledArticlesPublished: 0,
      breakingNewsExpired: 0,
      bannersExpired: 0,
      slotAssignmentsExpired: 0,
      complianceTenantSyncCount: 0,
      compliancePackVersion: null,
      tenantIdsRepublished: [],
      publishResults: [],
    };
  }
  const cronSettingsMap = await getCronSettingsMap();

  const { data: dueArticles, error: dueArticlesError } = await supabase
    .from("articles")
    .select("id, tenant_id, slug, title, summary, cover_image_url, scheduled_at")
    .eq("status", "approved")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(200);

  if (dueArticlesError) {
    throw dueArticlesError;
  }

  let scheduledArticlesPublished = 0;

  for (const article of dueArticles || []) {
    if (!getCronSettingsForTenant(cronSettingsMap, article.tenant_id).publishMaintenanceEnabled) {
      continue;
    }

    const publishTimestamp =
      typeof article.scheduled_at === "string" && article.scheduled_at
        ? article.scheduled_at
        : now;

    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        published_at: publishTimestamp,
        scheduled_at: null,
        updated_at: now,
      })
      .eq("id", article.id)
      .eq("tenant_id", article.tenant_id)
      .eq("status", "approved");

    if (!error) {
      scheduledArticlesPublished += 1;
      tenantIdsNeedingPublish.push(article.tenant_id);

      // Social auto-posting (non-blocking, fire-and-forget)
      try {
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("slug, settings")
          .eq("id", article.tenant_id)
          .single();

        if (tenantRow) {
          const tenantSettings = (tenantRow.settings ?? {}) as Record<string, unknown>;
          const moduleConfig = (tenantSettings.module_config as Record<string, unknown>) ?? {};
          const socialCfg = normalizeSocialAutoConfig(moduleConfig.social_auto);
          const articleUrl = buildArticleUrl(socialCfg.siteUrl, tenantRow.slug, article.slug);

          await autoPostToSocial(supabase, article.tenant_id, {
            title: article.title || "",
            summary: article.summary || "",
            url: articleUrl,
            imageUrl: article.cover_image_url || undefined,
          });
        }
      } catch {
        // Social posting must never block the cron
      }
    }
  }

  const { data: expiredBreakingNews, error: expiredBreakingNewsError } = await supabase
    .from("breaking_news")
    .select("id, tenant_id")
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .limit(500);

  if (expiredBreakingNewsError) {
    throw expiredBreakingNewsError;
  }

  let breakingNewsExpired = 0;

  if ((expiredBreakingNews || []).length > 0) {
    const eligibleItems = expiredBreakingNews!.filter((item) =>
      getCronSettingsForTenant(cronSettingsMap, item.tenant_id).publishMaintenanceEnabled
    );
    const ids = eligibleItems.map((item) => item.id);

    if (ids.length === 0) {
      breakingNewsExpired = 0;
    } else {
    const { error } = await supabase
      .from("breaking_news")
      .update({ is_active: false })
      .in("id", ids);

    if (error) {
      throw error;
    }

    breakingNewsExpired = ids.length;
    tenantIdsNeedingPublish.push(...eligibleItems.map((item) => item.tenant_id));
    }
  }

  const { data: expiredBanners, error: expiredBannersError } = await supabase
    .from("banners")
    .select("id, tenant_id")
    .eq("is_active", true)
    .not("ends_at", "is", null)
    .lte("ends_at", now)
    .limit(500);

  if (expiredBannersError) {
    throw expiredBannersError;
  }

  let bannersExpired = 0;

  if ((expiredBanners || []).length > 0) {
    const eligibleItems = expiredBanners!.filter((item) =>
      getCronSettingsForTenant(cronSettingsMap, item.tenant_id).publishMaintenanceEnabled
    );
    const ids = eligibleItems.map((item) => item.id);

    if (ids.length === 0) {
      bannersExpired = 0;
    } else {
    const { error } = await supabase
      .from("banners")
      .update({ is_active: false })
      .in("id", ids);

    if (error) {
      throw error;
    }

    bannersExpired = ids.length;
    tenantIdsNeedingPublish.push(...eligibleItems.map((item) => item.tenant_id));
    }
  }

  const { data: expiredAssignments, error: expiredAssignmentsError } = await supabase
    .from("slot_assignments")
    .select("id, tenant_id")
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .limit(1000);

  if (expiredAssignmentsError) {
    throw expiredAssignmentsError;
  }

  let slotAssignmentsExpired = 0;

  if ((expiredAssignments || []).length > 0) {
    const eligibleItems = expiredAssignments!.filter((item) =>
      getCronSettingsForTenant(cronSettingsMap, item.tenant_id).publishMaintenanceEnabled
    );
    const ids = eligibleItems.map((item) => item.id);

    if (ids.length === 0) {
      slotAssignmentsExpired = 0;
    } else {
    const { error } = await supabase.from("slot_assignments").delete().in("id", ids);

    if (error) {
      throw error;
    }

    slotAssignmentsExpired = ids.length;
    tenantIdsNeedingPublish.push(...eligibleItems.map((item) => item.tenant_id));
    }
  }

  let complianceTenantSyncCount = 0;
  let compliancePackVersion: string | null = null;

  if (platformSettings.complianceSyncEnabled) {
    const complianceSync = await syncGlobalCompliancePackToTenants({
      actorUserId: null,
      republish: false,
    });

    complianceTenantSyncCount = complianceSync.changedTenantIds.length;
    compliancePackVersion = complianceSync.packVersion;
    tenantIdsNeedingPublish.push(...complianceSync.changedTenantIds);
  }

  const tenantIds = uniqueTenantIds(tenantIdsNeedingPublish);
  const siteByTenantId = new Map<string, string>();

  if (tenantIds.length > 0) {
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, tenant_id")
      .in("tenant_id", tenantIds)
      .is("deleted_at", null);

    if (sitesError) {
      throw sitesError;
    }

    for (const site of sites || []) {
      siteByTenantId.set(site.tenant_id, site.id);
    }
  }

  for (const tenantId of tenantIds) {
    try {
      await triggerPublish(tenantId, [{ type: "full_rebuild" }], null);
      publishResults.push({ tenantId, ok: true });
    } catch (error) {
      publishResults.push({
        tenantId,
        ok: false,
        message: error instanceof Error ? error.message : "Publish failed",
      });
    }
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: null,
    tenant_id: null,
    site_id: null,
    action: "cron.publish_maintenance",
    resource_type: "cron_run",
    resource_id: null,
    metadata: {
      processedAt: now,
      scheduledArticlesPublished,
      breakingNewsExpired,
      bannersExpired,
      slotAssignmentsExpired,
      complianceTenantSyncCount,
      compliancePackVersion,
      tenantIdsRepublished: tenantIds,
      publishResults,
    },
  });

  if (tenantIds.length > 0) {
    await supabase.from("audit_logs").insert(
      tenantIds.map((tenantId) => ({
        actor_user_id: null,
        tenant_id: tenantId,
        site_id: siteByTenantId.get(tenantId) ?? null,
        action: "cron.publish_maintenance.tenant",
        resource_type: "cron_run",
        resource_id: tenantId,
        metadata: {
          processedAt: now,
          scheduledArticlesPublished,
          tenantPublishResult: publishResults.find((entry) => entry.tenantId === tenantId) ?? null,
        },
      }))
    );
  }

  // Refresh materialized views after content changes
  if (tenantIds.length > 0) {
    try {
      await supabase.rpc("refresh_materialized_views");
    } catch (mvError) {
      console.error("MV refresh after publish maintenance:", mvError);
    }
  }

  return {
    processedAt: now,
    scheduledArticlesPublished,
    breakingNewsExpired,
    bannersExpired,
    slotAssignmentsExpired,
    complianceTenantSyncCount,
    compliancePackVersion,
    tenantIdsRepublished: tenantIds,
    publishResults,
  };
}
