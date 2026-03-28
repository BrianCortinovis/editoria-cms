import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { enrichArticlesWithCategories, fetchArticleIdsForCategory, loadArticleCategoryIds } from "@/lib/articles/taxonomy";
import { resolveProvider } from "@/lib/ai/resolver";
import { callProvider } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedPostsDocument, PublishedSettingsDocument } from "@/lib/publish/types";

import { getPublicApiCorsHeaders } from "@/lib/security/cors";

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  category_id?: string | null;
  categories?: { name: string; slug: string; color: string | null } | null;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getPublicApiCorsHeaders(request) });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const limit = Math.min(Number(searchParams.get("limit") || 5), 10);

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: getPublicApiCorsHeaders(request) });
  }

  const [publishedSettings, publishedPosts] = await Promise.all([
    readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(tenantSlug)}/settings.json`),
    readPublishedJson<PublishedPostsDocument>(`sites/${encodeURIComponent(tenantSlug)}/posts.json`),
  ]);

  if (publishedSettings?.tenant && publishedPosts?.articles) {
    const settings = (publishedSettings.tenantSettings ?? {}) as Record<string, unknown>;
    const sourceArticle = publishedPosts.articles.find((article) => article.slug === slug);

    if (!sourceArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404, headers: getPublicApiCorsHeaders(request) });
    }

    const sourceCategorySlugs = new Set(
      (sourceArticle.all_categories || [])
        .map((category) => String(category.slug || "").trim())
        .filter(Boolean)
    );
    if (sourceArticle.categories?.slug) {
      sourceCategorySlugs.add(sourceArticle.categories.slug);
    }

    let candidates = publishedPosts.articles.filter((article) => article.id !== sourceArticle.id);
    const sameCategoryArticles = candidates.filter((article) =>
      (article.all_categories || []).some((category) => sourceCategorySlugs.has(String(category.slug || "").trim())) ||
      (article.categories?.slug ? sourceCategorySlugs.has(article.categories.slug) : false)
    );
    if (sameCategoryArticles.length > 0) {
      candidates = sameCategoryArticles;
    }

    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ articles: candidates.slice(0, limit) }, {
        headers: { ...getPublicApiCorsHeaders(request), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }

    const config = getModuleConfig(settings, "ai_assistant");
    const { provider, apiKey, model } = resolveProvider(config, "related");
    const articleList = candidates.map((a, i) => `${i}: ${a.title} — ${a.summary || ""}`).join("\n");

    try {
      const result = await callProvider(provider, apiKey, {
        system: "Sei un sistema di raccomandazione per una testata giornalistica. Dato un articolo di riferimento e una lista di altri articoli, identifica quelli più correlati per argomento. Rispondi SOLO con un array JSON di numeri interi ordinati per rilevanza, es: [3, 7, 1]",
        prompt: `Articolo di riferimento: "${sourceArticle.title}" — ${sourceArticle.summary || ""}\n\nAltri articoli:\n${articleList}`,
        model,
      });

      const text = result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const indices = JSON.parse(text) as number[];
      const related = indices
        .filter((i) => i >= 0 && i < candidates.length)
        .slice(0, limit)
        .map((i) => candidates[i]);

      return NextResponse.json({ articles: related, provider }, {
        headers: { ...getPublicApiCorsHeaders(request), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    } catch {
      return NextResponse.json({ articles: candidates.slice(0, limit) }, {
        headers: { ...getPublicApiCorsHeaders(request), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      });
    }
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, settings")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: getPublicApiCorsHeaders(request) });
  }

  // Get the source article
  const { data: article } = await supabase
    .from("articles")
    .select("id, title, summary, category_id")
    .eq("tenant_id", tenant.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404, headers: getPublicApiCorsHeaders(request) });
  }

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const sourceCategoryIds = await loadArticleCategoryIds(
    supabase as never,
    article.id,
    article.category_id
  );

  let sameCatArticles: RelatedArticle[] = [];

  if (sourceCategoryIds.length > 0) {
    const relatedArticleIds = new Set<string>();
    for (const categoryId of sourceCategoryIds) {
      const matchedIds = await fetchArticleIdsForCategory(supabase as never, categoryId);
      if (matchedIds) {
        matchedIds.forEach((matchedId) => {
          if (matchedId !== article.id) {
            relatedArticleIds.add(matchedId);
          }
        });
      }
    }

    if (relatedArticleIds.size > 0) {
      const { data } = await supabase
        .from("articles")
        .select("id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, category_id, categories:categories!articles_category_id_fkey(id, name, slug, color)")
        .eq("tenant_id", tenant.id)
        .eq("status", "published")
        .in("id", [...relatedArticleIds])
        .order("published_at", { ascending: false })
        .limit(30);
      sameCatArticles = (data || []) as unknown as RelatedArticle[];
    }
  }

  if (sameCatArticles.length === 0) {
    let fallbackQuery = supabase
      .from("articles")
      .select("id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, category_id, categories:categories!articles_category_id_fkey(id, name, slug, color)")
      .eq("tenant_id", tenant.id)
      .eq("status", "published")
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(30);

    if (article.category_id) {
      fallbackQuery = fallbackQuery.eq("category_id", article.category_id);
    }

    const { data } = await fallbackQuery;
    sameCatArticles = (data || []) as unknown as RelatedArticle[];
  }

  if (!sameCatArticles || sameCatArticles.length === 0) {
    return NextResponse.json({ articles: [] }, { headers: getPublicApiCorsHeaders(request) });
  }

  const enrichedArticles = await enrichArticlesWithCategories(
    supabase as never,
    tenant.id,
    sameCatArticles
  );

  // If AI is not active, return same-category or recent articles
  if (!isModuleActive(settings, "ai_assistant")) {
    // Without AI, just return most recent articles
    return NextResponse.json({ articles: enrichedArticles.slice(0, limit) }, {
      headers: { ...getPublicApiCorsHeaders(request), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // AI-powered related articles
  const config = getModuleConfig(settings, "ai_assistant");
  const { provider, apiKey, model } = resolveProvider(config, "related");

  const articleList = enrichedArticles.map((a, i) => `${i}: ${a.title} — ${a.summary || ""}`).join("\n");

  const result = await callProvider(provider, apiKey, {
    system: "Sei un sistema di raccomandazione per una testata giornalistica. Dato un articolo di riferimento e una lista di altri articoli, identifica quelli più correlati per argomento. Rispondi SOLO con un array JSON di numeri interi ordinati per rilevanza, es: [3, 7, 1]",
    prompt: `Articolo di riferimento: "${article.title}" — ${article.summary || ""}\n\nAltri articoli:\n${articleList}`,
    model,
  });

  try {
    const text = result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const indices = JSON.parse(text) as number[];
    const related = indices
      .filter((i) => i >= 0 && i < enrichedArticles.length)
      .slice(0, limit)
      .map((i) => enrichedArticles[i]);

    return NextResponse.json({ articles: related, provider }, {
      headers: { ...getPublicApiCorsHeaders(request), "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ articles: enrichedArticles.slice(0, limit) }, { headers: getPublicApiCorsHeaders(request) });
  }
}
