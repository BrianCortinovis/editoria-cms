import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getPlatformCronSettings } from "@/lib/cron/platform-settings";
import { getCronSettingsForTenant, getCronSettingsMap } from "@/lib/cron/settings";

export async function runSeoAnalysisCron() {
  const platformSettings = await getPlatformCronSettings();
  const serviceClient = await createServiceRoleClient();
  const timestamp = new Date().toISOString();

  if (!platformSettings.seoAnalysisEnabled) {
    await serviceClient.from("audit_logs").insert({
      actor_user_id: null,
      tenant_id: null,
      site_id: null,
      action: "cron.seo_analysis.skipped",
      resource_type: "cron_run",
      resource_id: null,
      metadata: {
        timestamp,
        reason: "platform_disabled",
      },
    });

    return {
      success: true,
      skipped: true,
      reason: "platform_disabled",
      tenants_processed: 0,
      results: [],
      timestamp,
    };
  }

  const supabase = await createServerSupabaseClient();
  const cronSettingsMap = await getCronSettingsMap();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, settings")
    .limit(100);

  if (!tenants || tenants.length === 0) {
    return { success: true, analyzed: 0, message: "No tenants found", timestamp };
  }

  const results = [];

  for (const tenant of tenants) {
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const modules = settings.modules as Record<string, unknown> | undefined;
    const aiModule = (modules?.ai_assistant ?? null) as { enabled?: boolean } | null;
    const cronSettings = getCronSettingsForTenant(cronSettingsMap, tenant.id);

    if (!aiModule?.enabled || !cronSettings.seoAnalysisEnabled) {
      continue;
    }

    try {
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, slug, body, summary, meta_title, meta_description, og_image_url, view_count, published_at")
        .eq("tenant_id", tenant.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);

      if (!articles || articles.length === 0) {
        continue;
      }

      const seoBaseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!seoBaseUrl) {
        results.push({ tenant_id: tenant.id, status: "error", message: "NEXTAUTH_URL or NEXT_PUBLIC_APP_URL not configured" });
        continue;
      }

      const response = await fetch(
        `${seoBaseUrl}/api/ai/seo-tools`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({
            tenant_id: tenant.id,
            action: "analyze_seo",
            articles,
          }),
        }
      );

      const analysisResult = await response.json();

      if (response.ok) {
        const { data: stored } = await supabase
          .from("seo_analysis_history")
          .insert({
            tenant_id: tenant.id,
            analysis_date: timestamp,
            article_count: articles.length,
            result: analysisResult,
          })
          .select();

        results.push({
          tenant_id: tenant.id,
          status: "success",
          articles_analyzed: articles.length,
          stored: !!stored,
        });
      } else {
        results.push({
          tenant_id: tenant.id,
          status: "error",
          message: analysisResult.error,
        });
      }
    } catch (error) {
      results.push({
        tenant_id: tenant.id,
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const payload = {
    success: true,
    tenants_processed: tenants.length,
    results,
    timestamp,
  };

  await serviceClient.from("audit_logs").insert({
    actor_user_id: null,
    tenant_id: null,
    site_id: null,
    action: "cron.seo_analysis",
    resource_type: "cron_run",
    resource_id: null,
    metadata: payload,
  });

  return payload;
}
