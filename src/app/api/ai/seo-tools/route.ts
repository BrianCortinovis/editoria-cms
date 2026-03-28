import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { callAIWithFallback } from "@/lib/ai/fallback";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider, type ResolvedProvider } from "@/lib/ai/resolver";
import { buildCmsFactPolicy } from "@/lib/ai/prompts";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const SEO_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);

interface ArticleWithMetrics {
  id: string;
  title: string;
  slug: string;
  body?: string;
  summary?: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  published_at: string | null;
}

interface PageSeoPayload {
  title: string;
  slug: string;
  blocks?: unknown[];
  meta?: Record<string, unknown>;
  tenant_name?: string;
}

interface SeoToolResult {
  action: string;
  provider?: string;
  [key: string]: unknown;
}

type AIConfig = Record<string, string | undefined>;

interface SeoAiContext {
  aiConfig: AIConfig;
  resolved: ResolvedProvider;
  tenantName: string;
}

interface SchemaArticle {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
  meta_description?: string | null;
  summary?: string | null;
  og_image_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  author_name?: string | null;
  publication_name?: string | null;
  site_logo_url?: string | null;
  site_url?: string | null;
  url?: string | null;
}

/**
 * POST /api/ai/seo-tools
 *
 * SEO-specific AI analysis tools:
 * - analyze: Analyze SEO performance of articles
 * - generate_meta: Generate optimized meta title/description
 * - keyword_analysis: Suggest keyword improvements
 * - improve_readability: Suggest readability improvements
 * - internal_linking: Suggest internal links
 * - schema_markup: Generate schema.org markup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, action, articles = [], articleId, page } = body as {
      tenant_id?: string;
      action?: string;
      articles?: ArticleWithMetrics[];
      articleId?: string;
      page?: PageSeoPayload;
    };

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
    }

    const internalSecret = request.headers.get("authorization");
    const isTrustedInternalCall = Boolean(
      process.env.CRON_SECRET &&
      internalSecret === `Bearer ${process.env.CRON_SECRET}`
    );

    const supabase = isTrustedInternalCall
      ? await createServiceRoleClient()
      : await createServerSupabaseClient();

    // Validate tenant exists BEFORE any other logic (including cron calls)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, settings")
      .eq("id", tenant_id)
      .single();

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const { data: { user } } = isTrustedInternalCall
      ? { data: { user: null } }
      : await supabase.auth.getUser();

    if (!user && !isTrustedInternalCall) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTrustedInternalCall && user) {
      const { data: membership } = await supabase
        .from("user_tenants")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenant_id)
        .single();

      if (!membership || !SEO_EDITOR_ROLES.has(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Rate limit for interactive (non-cron) calls
      const clientIp = getClientIp(request);
      const limiter = await checkRateLimit(`ai-seo-tools:${user.id}:${clientIp}`, 10, 10 * 60 * 1000);
      if (!limiter.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
    }

    // Module check applies to ALL callers including cron
    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, "seo");

    let result: SeoToolResult = { action: action || "unknown" };

    switch (action) {
      case "analyze_seo":
        result = await analyzeSEO(articles, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      case "generate_meta":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for meta generation" }, { status: 400 });
        }
        result = await generateMetaTags(articles, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      case "keyword_analysis":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for keyword analysis" }, { status: 400 });
        }
        result = await analyzeKeywords(articles, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      case "readability":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for readability analysis" }, { status: 400 });
        }
        result = await analyzeReadability(articles, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      case "internal_linking":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for linking suggestions" }, { status: 400 });
        }
        result = await suggestInternalLinks(articles, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      case "schema_markup":
        if (!articleId) {
          return NextResponse.json({ error: "articleId required for schema generation" }, { status: 400 });
        }
        const { data: article } = await supabase
          .from("articles")
          .select("*")
          .eq("id", articleId)
          .eq("tenant_id", tenant_id)
          .single();

        if (!article) {
          return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }
        result = generateSchemaMarkup(article);
        break;

      case "optimize_page":
        if (!page) {
          return NextResponse.json({ error: "page required for page optimization" }, { status: 400 });
        }
        result = await optimizePageSeo(page, { aiConfig, resolved, tenantName: tenant.name || tenant_id });
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("SEO tools error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBlockText(blocks: unknown[], depth = 0): string[] {
  if (!Array.isArray(blocks) || depth > 5) {
    return [];
  }

  const parts: string[] = [];

  for (const rawBlock of blocks) {
    if (!rawBlock || typeof rawBlock !== "object") continue;
    const block = rawBlock as {
      label?: string;
      props?: Record<string, unknown>;
      children?: unknown[];
    };

    if (block.label) {
      parts.push(String(block.label));
    }

    const props = block.props || {};
    const candidateKeys = [
      "title",
      "subtitle",
      "description",
      "content",
      "text",
      "headline",
      "excerpt",
      "buttonText",
      "ctaText",
    ];

    for (const key of candidateKeys) {
      const value = props[key];
      if (typeof value === "string" && value.trim()) {
        parts.push(stripHtml(value));
      }
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      parts.push(...extractBlockText(block.children, depth + 1));
    }
  }

  return parts.filter(Boolean);
}

function safeJsonParse<T>(value: string): T | null {
  const cleaned = value.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

async function callSeoAi(
  context: SeoAiContext,
  messages: Array<{ role: "system" | "user"; content: string }>
) {
  const result = await callAIWithFallback({
    aiConfig: context.aiConfig,
    task: "seo",
    messages,
    preferredProvider: context.resolved.provider,
    preferredModel: context.resolved.model,
  });

  return result;
}

async function optimizePageSeo(page: PageSeoPayload, context: SeoAiContext) {
  const textParts = extractBlockText(page.blocks || []);
  const pageText = textParts.join("\n").trim().slice(0, 6000);
  const currentMeta = page.meta || {};
  const pagePath = page.slug === "homepage" ? "/" : `/${page.slug}`;

  const prompt = `Ottimizza SEO per questa pagina CMS di una testata giornalistica italiana.

Tenant: ${page.tenant_name || "Testata"}
Slug: ${page.slug}
Path pubblico: ${pagePath}
Titolo corrente pagina: ${page.title}
Meta title corrente: ${typeof currentMeta.title === "string" ? currentMeta.title : ""}
Meta description corrente: ${typeof currentMeta.description === "string" ? currentMeta.description : ""}
Contenuto estratto dai blocchi:
${pageText || "(nessun contenuto disponibile)"}

Genera SOLO JSON valido con questa struttura:
{
  "title": "meta title SEO max 60 caratteri",
  "description": "meta description SEO max 155 caratteri",
  "ogTitle": "titolo Open Graph",
  "ogDescription": "descrizione Open Graph",
  "canonicalPath": "/percorso-canonico",
  "focusKeyword": "keyword principale",
  "schemaType": "WebPage",
  "noindex": false,
  "nofollow": false,
  "notes": [
    "nota breve 1",
    "nota breve 2"
  ]
}

Regole:
- usa italiano professionale
- non inventare brand diversi dal tenant
- title massimo 60 caratteri
- description massimo 155 caratteri
- canonicalPath deve essere relativo e iniziare con /
- schemaType deve essere uno tra WebPage, CollectionPage, AboutPage, ContactPage, NewsMediaOrganization
- notes max 3`;

  const result = await callSeoAi(context, [
    {
      role: "system",
      content: `Sei un SEO strategist senior per CMS editoriali. Produci solo JSON valido, conciso e applicabile direttamente.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
    },
    { role: "user", content: prompt },
  ]);

  const parsed = safeJsonParse<Record<string, unknown>>(result.text);
  if (!parsed) {
    throw new Error("AI SEO page optimization did not return valid JSON");
  }

  const seo = {
    title: typeof parsed.title === "string" ? parsed.title.trim().slice(0, 60) : page.title,
    description: typeof parsed.description === "string" ? parsed.description.trim().slice(0, 155) : "",
    ogTitle: typeof parsed.ogTitle === "string" ? parsed.ogTitle.trim().slice(0, 90) : "",
    ogDescription: typeof parsed.ogDescription === "string" ? parsed.ogDescription.trim().slice(0, 200) : "",
    canonicalPath: typeof parsed.canonicalPath === "string" && parsed.canonicalPath.startsWith("/")
      ? parsed.canonicalPath
      : pagePath,
    focusKeyword: typeof parsed.focusKeyword === "string" ? parsed.focusKeyword.trim() : "",
    schemaType: typeof parsed.schemaType === "string" ? parsed.schemaType.trim() : "WebPage",
    noindex: Boolean(parsed.noindex),
    nofollow: Boolean(parsed.nofollow),
    notes: Array.isArray(parsed.notes) ? parsed.notes.map((item) => String(item)).slice(0, 3) : [],
  };

  return {
    action: "optimize_page",
    seo,
    provider: result.provider,
    analysis: seo.notes.join(" "),
  };
}

/**
 * Analyze overall SEO performance
 */
async function analyzeSEO(articles: ArticleWithMetrics[], context: SeoAiContext) {
  const stats = {
    total: articles.length,
    with_meta_title: articles.filter(a => a.meta_title).length,
    with_meta_desc: articles.filter(a => a.meta_description).length,
    with_og_image: articles.filter(a => a.og_image_url).length,
    avg_views: Math.round(articles.reduce((s, a) => s + a.view_count, 0) / articles.length),
    no_meta_articles: articles.filter(a => !a.meta_title || !a.meta_description).slice(0, 3),
  };

  const prompt = `Analizza questi dati SEO di un sito giornalistico italiano:
- Articoli totali: ${stats.total}
- Con Meta Title: ${stats.with_meta_title} (${Math.round((stats.with_meta_title / stats.total) * 100)}%)
- Con Meta Description: ${stats.with_meta_desc} (${Math.round((stats.with_meta_desc / stats.total) * 100)}%)
- Con OG Image: ${stats.with_og_image} (${Math.round((stats.with_og_image / stats.total) * 100)}%)
- Visite medie per articolo: ${stats.avg_views}

Articoli senza meta completi:
${stats.no_meta_articles.map(a => `- "${a.title}" (${a.view_count} visite)`).join("\n")}

Fornisci:
1. Valutazione SEO complessiva (1-10)
2. Problemi critici prioritari
3. Opportunità di miglioramento (max 3)
4. Azioni consigliate nei prossimi 30 giorni`;

  const result = await callSeoAi(context, [
    {
      role: "system",
      content: `Sei un esperto SEO per siti giornalistici italiani. Fornisci analisi concrete e attuabili.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
    },
    { role: "user", content: prompt },
  ]);

  return {
    action: "analyze_seo",
    stats,
    analysis: result.text,
    provider: result.provider,
  };
}

/**
 * Generate optimized meta tags
 */
async function generateMetaTags(articles: ArticleWithMetrics[], context: SeoAiContext) {
  const articlesNeedingMeta = articles
    .filter(a => !a.meta_title || !a.meta_description)
    .slice(0, 5);

  if (articlesNeedingMeta.length === 0) {
    return { action: "generate_meta", message: "Tutti gli articoli hanno meta tag", suggestions: [] };
  }

  const suggestions = await Promise.all(
    articlesNeedingMeta.map(async (article) => {
      const prompt = `Genera meta tag SEO ottimizzati per questo articolo giornalistico italiano:

Titolo: "${article.title}"
Sommario: "${article.summary || ""}"
Corpo (prime 500 parole): "${(article.body || "").slice(0, 500)}"

Genera:
1. Meta Title (50-60 caratteri max)
2. Meta Description (150-160 caratteri max)

Formato risposta:
META_TITLE: [titolo]
META_DESCRIPTION: [descrizione]`;

      const result = await callSeoAi(context, [
        {
          role: "system",
          content: `Sei un esperto SEO. Genera meta tag concisi e ottimizzati per i motori di ricerca.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
        },
        { role: "user", content: prompt },
      ]);

      const text = result.text;
      const titleMatch = text.match(/META_TITLE:\s*(.+?)(?:\n|$)/);
      const descMatch = text.match(/META_DESCRIPTION:\s*(.+?)(?:\n|$)/);

      return {
        article_id: article.id,
        article_title: article.title,
        suggested_meta_title: titleMatch ? titleMatch[1].trim() : "",
        suggested_meta_description: descMatch ? descMatch[1].trim() : "",
        current_meta_title: article.meta_title,
        current_meta_description: article.meta_description,
      };
    })
  );

  return {
    action: "generate_meta",
    count: suggestions.length,
    suggestions,
    provider: context.resolved.provider,
  };
}

/**
 * Analyze keywords and suggest improvements
 */
async function analyzeKeywords(articles: ArticleWithMetrics[], context: SeoAiContext) {
  const content = articles
    .slice(0, 10)
    .map(a => `${a.title}: ${(a.body || "").slice(0, 300)}`)
    .join("\n---\n");

  const prompt = `Analizza questi articoli giornalistici italiani e suggersci miglioramenti di keyword SEO:

${content}

Per ogni articolo, identifica:
1. Parole chiave principali attuali
2. Opportunità di keyword secondarie
3. Keyword competitor da considerare
4. Suggerimenti di long-tail keywords

Formato: Un paragrafo per articolo con raccomandazioni concrete.`;

  const result = await callSeoAi(context, [
    {
      role: "system",
      content: `Sei un esperto SEO specializzato in ottimizzazione keywords per siti giornalistici italiani.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
    },
    { role: "user", content: prompt },
  ]);

  return {
    action: "keyword_analysis",
    articles_analyzed: articles.length,
    analysis: result.text,
    provider: result.provider,
  };
}

/**
 * Analyze and improve readability
 */
async function analyzeReadability(articles: ArticleWithMetrics[], context: SeoAiContext) {
  const sampleContent = articles
    .slice(0, 3)
    .map(a => `Titolo: "${a.title}"\n${(a.body || "").slice(0, 400)}`)
    .join("\n\n---\n\n");

  const prompt = `Analizza la leggibilità di questi articoli giornalistici e fornisci suggerimenti SEO:

${sampleContent}

Valuta:
1. Lunghezza media delle frasi (ideale: 15-20 parole)
2. Uso di sottotitoli e struttura (H2, H3)
3. Densità keyword naturale
4. Variolazione lessicale
5. Lunghezza paragrafi

Per ogni aspetto, suggerisci 2-3 miglioramenti specifici applicabili.`;

  const result = await callSeoAi(context, [
    {
      role: "system",
      content: `Sei un esperto di SEO e readability per siti giornalistici italiani.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
    },
    { role: "user", content: prompt },
  ]);

  return {
    action: "readability",
    articles_analyzed: articles.length,
    suggestions: result.text,
    provider: result.provider,
  };
}

/**
 * Suggest internal linking opportunities
 */
async function suggestInternalLinks(articles: ArticleWithMetrics[], context: SeoAiContext) {
  const titles = articles.map(a => ({ slug: a.slug, title: a.title, summary: a.summary?.slice(0, 100) }));

  const prompt = `Basandoti su questi articoli giornalistici italiani, suggerisci collegamenti interni (internal links):

${titles.map(t => `- "${t.title}" (${t.summary})`).join("\n")}

Suggerisci:
1. 3-5 coppie articolo-collegamento reciproco logico
2. Per ogni collegamento, specifica l'anchor text naturale
3. Fornisci il contesto dove inserire il link (in quale paragrafo/sezione)
4. Spiega il valore SEO di ogni collegamento

Formato:
[Articolo A] → [Articolo B]
- Anchor text: "..."
- Posizione: (dove inserire)
- Motivo: (perché utile)`;

  const result = await callSeoAi(context, [
    {
      role: "system",
      content: `Sei un esperto SEO specializzato in strategie di internal linking per siti di notizie italiani.
${buildCmsFactPolicy({ tenantName: context.tenantName })}`,
    },
    { role: "user", content: prompt },
  ]);

  return {
    action: "internal_linking",
    articles_analyzed: articles.length,
    suggestions: result.text,
    provider: result.provider,
  };
}

/**
 * Generate schema.org NewsArticle markup
 */
function generateSchemaMarkup(article: SchemaArticle) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.meta_description || article.summary,
    image: article.og_image_url || null,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: article.author_name || "Redazione",
    },
    publisher: {
      "@type": "Organization",
      name: article.publication_name || "Sito",
      logo: {
        "@type": "ImageObject",
        url: article.site_logo_url || null,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${article.site_url || ""}/${article.slug}`,
    },
  };

  return {
    action: "schema_markup",
    article_id: article.id,
    schema,
    json_ld: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`,
  };
}
