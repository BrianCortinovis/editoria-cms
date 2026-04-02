import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeSocialAutoConfig } from "./platforms";
import type { SocialChannelConfig, SocialPlatformKey } from "./platforms";
import { PLATFORM_POSTERS, buildArticleUrl } from "./post-service";
import type { SocialPostPayload } from "./post-service";

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

/**
 * Processore cron: trova post programmati pronti e li invia.
 * Chiamato da /api/cron/social ogni minuto.
 */
export async function processScheduledSocialPosts() {
  const supabase = await createServiceRoleClient();
  const now = new Date().toISOString();

  // 1. Trova post pendenti con scheduled_at <= now
  const { data: pendingPosts, error: fetchError } = await supabase
    .from("scheduled_social_posts")
    .select("*, articles!inner(id, title, slug, summary, cover_image_url, status)")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .lt("retry_count", MAX_RETRIES)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    throw new Error(`Fetch scheduled posts failed: ${fetchError.message}`);
  }

  if (!pendingPosts || pendingPosts.length === 0) {
    return { processed: 0, sent: 0, failed: 0, processedAt: now };
  }

  let sent = 0;
  let failed = 0;

  for (const post of pendingPosts) {
    // Marca come "sending" (optimistic lock)
    const { count, error: lockError } = await supabase
      .from("scheduled_social_posts")
      .update(
        { status: "sending", updated_at: new Date().toISOString() },
        { count: "exact" },
      )
      .eq("id", post.id)
      .eq("status", "pending");

    if (lockError) {
      throw new Error(`Lock scheduled post failed: ${lockError.message}`);
    }

    // Se count === 0, un altro worker l'ha gia' preso
    if (count !== 1) continue;

    const article = post.articles as {
      id: string;
      title: string;
      slug: string;
      summary: string | null;
      cover_image_url: string | null;
      status: string;
    };

    // Skip se articolo non piu' pubblicato
    if (article.status !== "published") {
      await markFailed(supabase, post.id, "Articolo non piu' pubblicato");
      failed++;
      continue;
    }

    // Carica config tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug, settings")
      .eq("id", post.tenant_id)
      .single();

    if (!tenant) {
      await markFailed(supabase, post.id, "Tenant non trovato");
      failed++;
      continue;
    }

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const moduleConfig = (settings.module_config as Record<string, unknown>) ?? {};
    const socialConfig = normalizeSocialAutoConfig(moduleConfig.social_auto);

    // Credenziali: override dal post oppure config tenant
    const channelConfig: SocialChannelConfig = post.channel_config
      ? {
          enabled: true,
          primaryValue: (post.channel_config as Record<string, string>).primaryValue ?? "",
          secondaryValue: (post.channel_config as Record<string, string>).secondaryValue ?? "",
          webhookUrl: (post.channel_config as Record<string, string>).webhookUrl ?? "",
          accessToken: (post.channel_config as Record<string, string>).accessToken ?? "",
        }
      : socialConfig.channels[post.platform as SocialPlatformKey];

    if (!channelConfig) {
      await markFailed(supabase, post.id, `Piattaforma ${post.platform} non configurata`);
      failed++;
      continue;
    }

    const poster = PLATFORM_POSTERS[post.platform as SocialPlatformKey];
    if (!poster) {
      await markFailed(supabase, post.id, `Piattaforma ${post.platform} non supportata per posting diretto`);
      failed++;
      continue;
    }

    const articleUrl = buildArticleUrl(socialConfig.siteUrl, tenant.slug, article.slug);
    const payload: SocialPostPayload = {
      title: article.title || "",
      summary: post.custom_text || article.summary || "",
      url: articleUrl,
      imageUrl: article.cover_image_url || undefined,
    };

    const result = await poster(channelConfig, payload);

    if (result.success) {
      await supabase
        .from("scheduled_social_posts")
        .update({
          status: "sent",
          posted_at: new Date().toISOString(),
          post_id: result.postId || null,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);
      sent++;
    } else {
      const newRetryCount = (post.retry_count || 0) + 1;
      await supabase
        .from("scheduled_social_posts")
        .update({
          status: newRetryCount >= MAX_RETRIES ? "failed" : "pending",
          error_message: result.error || "Unknown error",
          retry_count: newRetryCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);
      failed++;
    }

    // Audit log
    try {
      await supabase.from("audit_logs").insert({
        tenant_id: post.tenant_id,
        action: "social.scheduled_post",
        resource_type: "scheduled_social_post",
        resource_id: post.id,
        metadata: {
          platform: post.platform,
          target_label: post.target_label,
          article_id: post.article_id,
          success: result.success,
          postId: result.postId,
          error: result.error,
        },
      });
    } catch {
      // Audit non deve bloccare
    }
  }

  return { processed: pendingPosts.length, sent, failed, processedAt: now };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markFailed(supabase: any, postId: string, errorMessage: string) {
  await supabase
    .from("scheduled_social_posts")
    .update({
      status: "failed",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);
}
