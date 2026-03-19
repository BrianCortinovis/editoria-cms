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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const query = searchParams.get("q");
  const mode = searchParams.get("mode") || "simple";
  const limit = Math.min(Number(searchParams.get("limit") || 10), 30);

  if (!tenantSlug || !query) {
    return NextResponse.json({ error: "tenant and q parameters required" }, { status: 400, headers: CORS_HEADERS });
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

  // Simple search — PostgreSQL full-text (no AI needed)
  if (mode === "simple") {
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, categories(name, slug, color)")
      .eq("tenant_id", tenant.id)
      .eq("status", "published")
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,body.ilike.%${query}%`)
      .order("published_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({ results: data || [], mode: "simple" }, {
      headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }

  // Semantic search — AI-powered
  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  if (!isModuleActive(settings, "ai_assistant")) {
    return NextResponse.json({ error: "AI module not active" }, { status: 403, headers: CORS_HEADERS });
  }

  // Get recent articles to rank against
  const { data: articles } = await supabase
    .from("articles")
    .select("id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, categories(name, slug, color)")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ results: [], mode: "semantic" }, { headers: CORS_HEADERS });
  }

  const config = getModuleConfig(settings, "ai_assistant");
  const { provider, apiKey, model } = resolveProvider(config, "search");

  const articleList = articles.map((a, i) => `${i}: ${a.title} — ${a.summary || ""}`).join("\n");

  const result = await callProvider(provider, apiKey, {
    system: "Sei un motore di ricerca per una testata giornalistica. Data una query dell'utente e una lista di articoli, restituisci i numeri degli articoli più rilevanti in ordine di rilevanza. Rispondi SOLO con una lista JSON di numeri interi, es: [2, 5, 0, 12]",
    prompt: `Query: "${query}"\n\nArticoli:\n${articleList}`,
    model,
  });

  try {
    const text = result.text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const indices = JSON.parse(text) as number[];
    const ranked = indices
      .filter((i) => i >= 0 && i < articles.length)
      .slice(0, limit)
      .map((i) => articles[i]);

    return NextResponse.json({ results: ranked, mode: "semantic", provider }, { headers: CORS_HEADERS });
  } catch {
    // Fallback to simple search if AI parsing fails
    return NextResponse.json({ results: articles.slice(0, limit), mode: "fallback" }, { headers: CORS_HEADERS });
  }
}
