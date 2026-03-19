import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveProvider } from "@/lib/ai/resolver";
import { callProvider } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
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
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, settings")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: CORS_HEADERS });
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
    return NextResponse.json({ error: "Article not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;

  // Fallback: same category articles
  const { data: sameCatArticles } = await supabase
    .from("articles")
    .select("id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, categories(name, slug, color)")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(30);

  if (!sameCatArticles || sameCatArticles.length === 0) {
    return NextResponse.json({ articles: [] }, { headers: CORS_HEADERS });
  }

  // If AI is not active, return same-category or recent articles
  if (!isModuleActive(settings, "ai_assistant")) {
    // Without AI, just return most recent articles
    return NextResponse.json({ articles: sameCatArticles.slice(0, limit) }, {
      headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  // AI-powered related articles
  const config = getModuleConfig(settings, "ai_assistant");
  const { provider, apiKey, model } = resolveProvider(config, "related");

  const articleList = sameCatArticles.map((a, i) => `${i}: ${a.title} — ${a.summary || ""}`).join("\n");

  const result = await callProvider(provider, apiKey, {
    system: "Sei un sistema di raccomandazione per una testata giornalistica. Dato un articolo di riferimento e una lista di altri articoli, identifica quelli più correlati per argomento. Rispondi SOLO con un array JSON di numeri interi ordinati per rilevanza, es: [3, 7, 1]",
    prompt: `Articolo di riferimento: "${article.title}" — ${article.summary || ""}\n\nAltri articoli:\n${articleList}`,
    model,
  });

  try {
    const text = result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const indices = JSON.parse(text) as number[];
    const related = indices
      .filter((i) => i >= 0 && i < sameCatArticles.length)
      .slice(0, limit)
      .map((i) => sameCatArticles[i]);

    return NextResponse.json({ articles: related, provider }, {
      headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ articles: sameCatArticles.slice(0, limit) }, { headers: CORS_HEADERS });
  }
}
