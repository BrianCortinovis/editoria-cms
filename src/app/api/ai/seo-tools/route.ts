import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { isModuleActive, getModuleConfig } from "@/lib/modules";
import { resolveProvider } from "@/lib/ai/resolver";

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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tenant_id, action, articles = [], articleId } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
    }

    // Get tenant settings
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant_id)
      .single();

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    if (!isModuleActive(settings, "ai_assistant")) {
      return NextResponse.json({ error: "AI module not active" }, { status: 403 });
    }

    const aiConfig = getModuleConfig(settings, "ai_assistant");
    const resolved = resolveProvider(aiConfig, "seo");

    let result: any = {};

    switch (action) {
      case "analyze_seo":
        result = await analyzeSEO(articles, resolved);
        break;

      case "generate_meta":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for meta generation" }, { status: 400 });
        }
        result = await generateMetaTags(articles, resolved);
        break;

      case "keyword_analysis":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for keyword analysis" }, { status: 400 });
        }
        result = await analyzeKeywords(articles, resolved);
        break;

      case "readability":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for readability analysis" }, { status: 400 });
        }
        result = await analyzeReadability(articles, resolved);
        break;

      case "internal_linking":
        if (!articles || articles.length === 0) {
          return NextResponse.json({ error: "articles required for linking suggestions" }, { status: 400 });
        }
        result = await suggestInternalLinks(articles, resolved);
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

/**
 * Analyze overall SEO performance
 */
async function analyzeSEO(articles: ArticleWithMetrics[], resolved: any) {
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

  const result = await callAI(resolved.provider, [
    {
      role: "system",
      content: "Sei un esperto SEO per siti giornalistici italiani. Fornisci analisi concrete e attuabili.",
    },
    { role: "user", content: prompt },
  ], { apiKey: resolved.apiKey, model: resolved.model });

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
async function generateMetaTags(articles: ArticleWithMetrics[], resolved: any) {
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

      const result = await callAI(resolved.provider, [
        {
          role: "system",
          content: "Sei un esperto SEO. Genera meta tag concisi e ottimizzati per i motori di ricerca.",
        },
        { role: "user", content: prompt },
      ], { apiKey: resolved.apiKey, model: resolved.model });

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
    provider: resolved.provider,
  };
}

/**
 * Analyze keywords and suggest improvements
 */
async function analyzeKeywords(articles: ArticleWithMetrics[], resolved: any) {
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

  const result = await callAI(resolved.provider, [
    {
      role: "system",
      content: "Sei un esperto SEO specializzato in ottimizzazione keywords per siti giornalistici italiani.",
    },
    { role: "user", content: prompt },
  ], { apiKey: resolved.apiKey, model: resolved.model });

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
async function analyzeReadability(articles: ArticleWithMetrics[], resolved: any) {
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

  const result = await callAI(resolved.provider, [
    {
      role: "system",
      content: "Sei un esperto di SEO e readability per siti giornalistici italiani.",
    },
    { role: "user", content: prompt },
  ], { apiKey: resolved.apiKey, model: resolved.model });

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
async function suggestInternalLinks(articles: ArticleWithMetrics[], resolved: any) {
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

  const result = await callAI(resolved.provider, [
    {
      role: "system",
      content: "Sei un esperto SEO specializzato in strategie di internal linking per siti di notizie italiani.",
    },
    { role: "user", content: prompt },
  ], { apiKey: resolved.apiKey, model: resolved.model });

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
function generateSchemaMarkup(article: any) {
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
