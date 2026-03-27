import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildNewsletterPreview,
  type NewsletterCampaignRecord,
  type NewsletterPreviewArticle,
} from "@/lib/newsletter/module";
import { buildNewsletterProviderHandoff } from "@/lib/newsletter/provider";
import { normalizeNewsletterConfig, type SiteNewsletterConfig } from "@/lib/site/newsletter";

async function getTenantAccess(tenantId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, role: null as string | null };
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, role: membership?.role || null };
}

function isCampaignRecord(input: unknown): input is NewsletterCampaignRecord {
  if (!input || typeof input !== "object") return false;
  const record = input as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.title === "string";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : null;
  const configInput = body?.config as SiteNewsletterConfig | undefined;
  const campaignInput = body?.campaign;

  if (!tenantId || !configInput || !isCampaignRecord(campaignInput)) {
    return NextResponse.json({ error: "tenant_id, config and campaign required" }, { status: 400 });
  }

  const { supabase, user, role } = await getTenantAccess(tenantId);
  if (!user || !role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = normalizeNewsletterConfig({ newsletterSettings: configInput });
  const campaign = campaignInput;
  const articleIds = Array.from(
    new Set([campaign.featuredArticleId, ...campaign.articleIds].filter((value): value is string => Boolean(value))),
  );

  const [{ data: tenant }, articlesRes] = await Promise.all([
    supabase.from("tenants").select("name").eq("id", tenantId).single(),
    articleIds.length > 0
      ? supabase
          .from("articles")
          .select("id, title, slug, summary, cover_image_url, published_at, categories:categories!articles_category_id_fkey(name, slug)")
          .eq("tenant_id", tenantId)
          .in("id", articleIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (articlesRes.error) {
    return NextResponse.json({ error: articlesRes.error.message }, { status: 500 });
  }

  const articleMap = new Map<string, NewsletterPreviewArticle>();
  for (const article of articlesRes.data || []) {
    articleMap.set(article.id, {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      coverImageUrl: article.cover_image_url,
      publishedAt: article.published_at,
      categoryName:
        article.categories && typeof article.categories === "object" && "name" in article.categories
          ? String(article.categories.name || "")
          : null,
      categorySlug:
        article.categories && typeof article.categories === "object" && "slug" in article.categories
          ? String(article.categories.slug || "")
          : null,
    });
  }

  const orderedArticles = articleIds.map((id) => articleMap.get(id)).filter((item): item is NewsletterPreviewArticle => Boolean(item));
  const preview = buildNewsletterPreview(tenant?.name || "Testata", config, campaign, orderedArticles);

  return NextResponse.json({
    preview,
    handoff: buildNewsletterProviderHandoff(config, campaign, preview),
  });
}
