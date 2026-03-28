import type { SupabaseClient } from "@supabase/supabase-js";
import { isModuleActive } from "@/lib/modules";
import type { SocialAutoConfig, SocialPlatformKey, SocialChannelConfig } from "./platforms";
import { normalizeSocialAutoConfig } from "./platforms";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SocialPostPayload {
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  tags?: string[];
}

export interface SocialPostResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Platform posters                                                   */
/* ------------------------------------------------------------------ */

async function postToTelegram(
  ch: SocialChannelConfig,
  payload: SocialPostPayload,
): Promise<SocialPostResult> {
  try {
    const botToken = ch.accessToken;
    const chatId = ch.primaryValue;
    if (!botToken || !chatId) {
      return { platform: "telegram", success: false, error: "Bot token or chat ID missing" };
    }
    const text = `<b>${escapeHtml(payload.title)}</b>\n\n${escapeHtml(payload.summary || "")}\n\n${payload.url}`;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const data = await res.json();
    if (!data.ok) return { platform: "telegram", success: false, error: data.description };
    return { platform: "telegram", success: true, postId: String(data.result?.message_id) };
  } catch (e) {
    return { platform: "telegram", success: false, error: String(e) };
  }
}

async function postToFacebook(
  ch: SocialChannelConfig,
  payload: SocialPostPayload,
): Promise<SocialPostResult> {
  try {
    const pageId = ch.primaryValue;
    const accessToken = ch.accessToken;
    if (!pageId || !accessToken) {
      return { platform: "facebook", success: false, error: "Page ID or access token missing" };
    }
    const body: Record<string, string> = {
      message: `${payload.title}\n\n${payload.summary || ""}`,
      link: payload.url,
      access_token: accessToken,
    };
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return { platform: "facebook", success: false, error: data.error.message };
    return { platform: "facebook", success: true, postId: data.id };
  } catch (e) {
    return { platform: "facebook", success: false, error: String(e) };
  }
}

async function postToTwitter(
  ch: SocialChannelConfig,
  payload: SocialPostPayload,
): Promise<SocialPostResult> {
  try {
    const bearerToken = ch.accessToken;
    if (!bearerToken) {
      return { platform: "x", success: false, error: "Bearer token missing" };
    }
    const text = truncate(`${payload.title}\n\n${payload.url}`, 280);
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.errors) return { platform: "x", success: false, error: data.errors[0]?.detail };
    return { platform: "x", success: true, postId: data.data?.id };
  } catch (e) {
    return { platform: "x", success: false, error: String(e) };
  }
}

async function postToLinkedin(
  ch: SocialChannelConfig,
  payload: SocialPostPayload,
): Promise<SocialPostResult> {
  try {
    const organizationId = ch.primaryValue;
    const accessToken = ch.accessToken;
    if (!organizationId || !accessToken) {
      return { platform: "linkedin", success: false, error: "Organization ID or access token missing" };
    }
    const body = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: `${payload.title}\n\n${payload.summary || ""}` },
          shareMediaCategory: "ARTICLE",
          media: [
            {
              status: "READY",
              originalUrl: payload.url,
              title: { text: payload.title },
            },
          ],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { platform: "linkedin", success: false, error: data.message || res.statusText };
    return { platform: "linkedin", success: true, postId: data.id };
  } catch (e) {
    return { platform: "linkedin", success: false, error: String(e) };
  }
}

type PlatformPoster = (ch: SocialChannelConfig, payload: SocialPostPayload) => Promise<SocialPostResult>;

const PLATFORM_POSTERS: Partial<Record<SocialPlatformKey, PlatformPoster>> = {
  telegram: postToTelegram,
  facebook: postToFacebook,
  x: postToTwitter,
  linkedin: postToLinkedin,
};

/* ------------------------------------------------------------------ */
/*  Main entry point                                                   */
/* ------------------------------------------------------------------ */

/**
 * Auto-post to all enabled social channels for a tenant.
 * Reads channel configs from tenant settings (module_config.social_auto),
 * posts to each enabled platform with a direct API poster, and logs results.
 *
 * This function is fully non-blocking and never throws — failures are
 * captured per-platform in the returned results array.
 */
export async function autoPostToSocial(
  supabase: SupabaseClient,
  tenantId: string,
  payload: SocialPostPayload,
): Promise<SocialPostResult[]> {
  try {
    // 1. Load tenant settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single();

    if (!tenant) return [];

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;

    // 2. Check module is active
    if (!isModuleActive(settings, "social_auto")) return [];

    // 3. Parse social config
    const moduleConfig = (settings.module_config as Record<string, unknown>) ?? {};
    const socialConfig: SocialAutoConfig = normalizeSocialAutoConfig(moduleConfig.social_auto);

    // Check the master toggle
    if (!socialConfig.publishOnApproval) return [];

    const results: SocialPostResult[] = [];

    for (const [key, channel] of Object.entries(socialConfig.channels)) {
      if (!channel.enabled) continue;

      const poster = PLATFORM_POSTERS[key as SocialPlatformKey];
      if (!poster) {
        // Platform exists in config but no direct API poster available
        continue;
      }

      try {
        const result = await poster(channel, payload);
        results.push(result);
      } catch (e) {
        results.push({ platform: key, success: false, error: String(e) });
      }
    }

    // 4. Log results to audit
    if (results.length > 0) {
      try {
        await supabase.from("audit_logs").insert({
          tenant_id: tenantId,
          actor_user_id: null,
          action: "social.auto_post",
          resource_type: "article",
          metadata: {
            payload: { title: payload.title, url: payload.url },
            results,
          },
        });
      } catch {
        // Audit log failure should never block
      }
    }

    return results;
  } catch {
    // Top-level catch — social posting must never throw
    return [];
  }
}

/**
 * Post a single test message to one platform.
 * Used by the dashboard "Test" button to verify credentials.
 */
export async function testSocialChannel(
  platform: SocialPlatformKey,
  channel: SocialChannelConfig,
): Promise<SocialPostResult> {
  const poster = PLATFORM_POSTERS[platform];
  if (!poster) {
    return { platform, success: false, error: "Platform not supported for direct posting" };
  }
  const testPayload: SocialPostPayload = {
    title: "Test Editoria CMS",
    summary: "Questo e' un messaggio di test dal CMS.",
    url: "https://example.com/test",
  };
  try {
    return await poster(channel, testPayload);
  } catch (e) {
    return { platform, success: false, error: String(e) };
  }
}

/**
 * Build the public article URL for a tenant.
 */
export function buildArticleUrl(
  siteUrl: string,
  tenantSlug: string,
  articleSlug: string,
): string {
  // If a custom siteUrl is configured, use it directly
  if (siteUrl) {
    const base = siteUrl.replace(/\/$/, "");
    return `${base}/articolo/${articleSlug}`;
  }
  // Fallback to multi-tenant internal path
  return `/site/${tenantSlug}/articolo/${articleSlug}`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}
