"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import {
  BarChart3,
  Globe,
  Search,
  FileText,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Rss,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";
import { SeoGuideSheet } from "@/components/help/SeoGuideSheet";
import toast from "react-hot-toast";

interface ArticleSEO {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  reading_time_minutes: number | null;
  view_count: number;
  published_at: string | null;
}

interface SeoRuntimeChecks {
  sitemapReachable: boolean;
  articleSchemaPresent: boolean;
  articleOgPresent: boolean;
  analyticsRuntimePresent: boolean;
  tagManagerRuntimePresent: boolean;
  adsenseRuntimePresent: boolean;
  searchConsoleVerificationPresent: boolean;
  googleNewsPublicationRuntimePresent: boolean;
  slugCoverageOk: boolean;
  readingTimeCoverageOk: boolean;
}

type CheckStatus = "verified" | "configured" | "missing" | "unknown";

interface SeoAnalysisSuggestion {
  article_title?: string;
  suggested_meta_title?: string;
}

interface SeoAnalysisStats {
  total: number;
  with_meta_title: number;
  with_meta_desc: number;
}

interface SeoAnalysisResult {
  error?: string;
  message?: string;
  count?: number;
  analysis?: string;
  stats?: SeoAnalysisStats;
  suggestions?: SeoAnalysisSuggestion[];
}

export default function SeoPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [articles, setArticles] = useState<ArticleSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeoAnalysisResult | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [runtimeChecks, setRuntimeChecks] = useState<SeoRuntimeChecks>({
    sitemapReachable: false,
    articleSchemaPresent: false,
    articleOgPresent: false,
    analyticsRuntimePresent: false,
    tagManagerRuntimePresent: false,
    adsenseRuntimePresent: false,
    searchConsoleVerificationPresent: false,
    googleNewsPublicationRuntimePresent: false,
    slugCoverageOk: false,
    readingTimeCoverageOk: false,
  });
  const canUseSeoTools =
    currentRole === "admin" ||
    currentRole === "chief_editor" ||
    currentRole === "editor";

  useEffect(() => {
    if (!currentTenant) return;
    const tenantId = currentTenant.id;
    const supabase = createClient();

    supabase.from("articles")
      .select("id, title, slug, meta_title, meta_description, og_image_url, reading_time_minutes, view_count, published_at")
      .eq("tenant_id", currentTenant.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setArticles(data as ArticleSEO[]);
        setLoading(false);
      });

    supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenantId)
      .single()
      .then(({ data }) => {
        setSiteSettings((data?.settings ?? {}) as Record<string, string>);
      });
  }, [currentTenant]);

  useEffect(() => {
    if (!currentTenant) return;
    const tenantSlug = currentTenant.slug;

    let cancelled = false;

    async function verifySeoRuntime() {
      const slugCoverageOk =
        articles.length > 0 &&
        articles.every((article) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug));
      const readingTimeCoverageOk =
        articles.length > 0 &&
        articles.every((article) => typeof article.reading_time_minutes === "number" && article.reading_time_minutes > 0);

      let sitemapReachable = false;
      let articleSchemaPresent = false;
      let articleOgPresent = false;
      let analyticsRuntimePresent = false;
      let tagManagerRuntimePresent = false;
      let adsenseRuntimePresent = false;
      let searchConsoleVerificationPresent = false;
      let googleNewsPublicationRuntimePresent = false;

      const tenantSitemapUrl = `/site/${tenantSlug}/sitemap.xml`;

      try {
        const sitemapResponse = await fetch(tenantSitemapUrl, { cache: "no-store" });
        const sitemapBody = await sitemapResponse.text();
        sitemapReachable = sitemapResponse.ok && /<urlset|<sitemapindex/i.test(sitemapBody);
      } catch {
        sitemapReachable = false;
      }

      const sampleArticle = articles[0];
      if (sampleArticle?.slug) {
        try {
          const articleResponse = await fetch(`/site/${tenantSlug}/articolo/${sampleArticle.slug}`, { cache: "no-store" });
          const articleHtml = await articleResponse.text();
          articleSchemaPresent =
            articleResponse.ok &&
            articleHtml.includes('application/ld+json') &&
            articleHtml.includes('"@type":"NewsArticle"');
          articleOgPresent =
            articleResponse.ok &&
            /property=["']og:title["']/i.test(articleHtml) &&
            /property=["']og:description["']/i.test(articleHtml);
          analyticsRuntimePresent =
            articleResponse.ok &&
            /data-ga-configured=["']true["']/i.test(articleHtml);
          tagManagerRuntimePresent =
            articleResponse.ok &&
            /data-gtm-configured=["']true["']/i.test(articleHtml);
          adsenseRuntimePresent =
            articleResponse.ok &&
            /data-adsense-configured=["']true["']/i.test(articleHtml);
          searchConsoleVerificationPresent =
            articleResponse.ok &&
            (siteSettings.google_search_console_verification
              ? articleHtml.includes(`name="google-site-verification"`) &&
                articleHtml.includes(String(siteSettings.google_search_console_verification))
              : false);
          googleNewsPublicationRuntimePresent =
            articleResponse.ok &&
            (siteSettings.google_news_publication_name
              ? articleHtml.includes(String(siteSettings.google_news_publication_name))
              : false);
        } catch {
          articleSchemaPresent = false;
          articleOgPresent = false;
          analyticsRuntimePresent = false;
          tagManagerRuntimePresent = false;
          adsenseRuntimePresent = false;
          searchConsoleVerificationPresent = false;
          googleNewsPublicationRuntimePresent = false;
        }
      }

      if (!cancelled) {
        setRuntimeChecks({
          sitemapReachable,
          articleSchemaPresent,
          articleOgPresent,
          analyticsRuntimePresent,
          tagManagerRuntimePresent,
          adsenseRuntimePresent,
          searchConsoleVerificationPresent,
          googleNewsPublicationRuntimePresent,
          slugCoverageOk,
          readingTimeCoverageOk,
        });
      }
    }

    void verifySeoRuntime();

    return () => {
      cancelled = true;
    };
  }, [articles, currentTenant, siteSettings]);

  const withMeta = articles.filter(a => a.meta_title && a.meta_description);
  const withOG = articles.filter(a => a.og_image_url);
  const totalViews = articles.reduce((s, a) => s + a.view_count, 0);
  const seoScore = articles.length > 0 ? Math.round((withMeta.length / articles.length) * 100) : 0;

  const ScoreCircle = ({ score }: { score: number }) => {
    const color = score >= 80 ? "var(--c-success)" : score >= 50 ? "var(--c-warning)" : "var(--c-danger)";
    return (
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" fill="none" stroke="var(--c-border)" strokeWidth="6" />
          <circle cx="40" cy="40" r="35" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(score / 100) * 220} 220`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
    );
  };

  const CheckItem = ({ status, label }: { status: CheckStatus; label: string }) => {
    const icon =
      status === "verified" ? (
        <CheckCircle className="w-4 h-4" style={{ color: "var(--c-success)" }} />
      ) : status === "configured" ? (
        <AlertCircle className="w-4 h-4" style={{ color: "var(--c-warning)" }} />
      ) : status === "unknown" ? (
        <AlertCircle className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
      ) : (
        <XCircle className="w-4 h-4" style={{ color: "var(--c-danger)" }} />
      );

    return (
      <div className="flex items-center gap-2 py-1.5">
        {icon}
        <span
          className="text-xs"
          style={{
            color: status === "verified" ? "var(--c-text-0)" : "var(--c-text-2)",
          }}
        >
          {label}
        </span>
      </div>
    );
  };

  const handleSEOAnalysis = async () => {
    if (!currentTenant || articles.length === 0 || !canUseSeoTools) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/seo-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          action: "analyze_seo",
          articles: articles,
        }),
      });

      const result = (await response.json()) as SeoAnalysisResult;
      if (!response.ok) {
        toast.error(result.error || "Errore nell'analisi SEO");
        return;
      }

      setAnalysisResult(result);
      toast.success("Analisi SEO completata!");
    } catch (error) {
      toast.error("Errore di connessione");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateMeta = async () => {
    if (!currentTenant || articles.length === 0 || !canUseSeoTools) return;
    setAnalyzing(true);
    try {
      const response = await fetch("/api/ai/seo-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          action: "generate_meta",
          articles: articles.filter(a => !a.meta_title || !a.meta_description),
        }),
      });

      const result = (await response.json()) as SeoAnalysisResult;
      if (!response.ok) {
        toast.error(result.error || "Errore nella generazione");
        return;
      }

      setAnalysisResult(result);
      toast.success(`${result.count} meta tag generati!`);
    } catch (error) {
      toast.error("Errore di connessione");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!canUseSeoTools) {
    return (
      <div className="max-w-2xl text-center py-20">
        <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          Solo editor, caporedattori e super admin possono usare gli strumenti SEO del CMS.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <SeoGuideSheet />

      {/* Score + KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-5">
          <ScoreCircle score={seoScore} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>SEO Score</p>
            <p className="text-xs" style={{ color: "var(--c-text-2)" }}>{withMeta.length}/{articles.length} articoli con meta</p>
          </div>
        </div>
        <div className="card p-4">
          <Eye className="w-5 h-5 mb-2" style={{ color: "var(--c-accent)" }} />
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>{totalViews.toLocaleString()}</p>
          <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Visite totali</p>
        </div>
        <div className="card p-4">
          <FileText className="w-5 h-5 mb-2" style={{ color: "#22c55e" }} />
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>{articles.length}</p>
          <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Articoli pubblicati</p>
        </div>
        <div className="card p-4">
          <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#f59e0b" }} />
          <p className="text-xl font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>{withOG.length}</p>
          <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Con OG Image</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SEO Checklist */}
        <div className="card">
          <div className="card-header flex items-center justify-between relative">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Checklist SEO Sito</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSEOAnalysis}
                disabled={analyzing || articles.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                Analizza
              </button>
              <button
                onClick={handleGenerateMeta}
                disabled={analyzing || articles.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Genera Meta
              </button>
              <div className="relative">
                <AIButton
                  actions={[
                    {
                      id: "analisi_seo",
                      label: "Analisi SEO completa",
                      prompt: "Esegui un'analisi SEO completa basandoti solo sui dati degli articoli pubblicati e del tenant corrente presenti nel contesto. Separa la risposta in: fatti verificati, verifiche mancanti, opportunita' e azioni consigliate. Non dichiarare criticita' non supportate dai dati. Dati: {context}",
                    },
                    {
                      id: "suggerisci_miglioramenti",
                      label: "Suggerisci miglioramenti",
                      prompt: "Suggerisci miglioramenti SEO specifici e attuabili per i seguenti articoli di un giornale locale italiano, concentrandoti su quelli senza meta description o meta title: {context}",
                    },
                    {
                      id: "genera_meta_sito",
                      label: "Genera meta description sito",
                      prompt: "Genera una meta description ottimizzata per SEO (max 160 caratteri) per il sito di un giornale locale italiano, basandoti sui contenuti pubblicati: {context}",
                    },
                    {
                      id: "audit-analytics-news",
                      label: "Audit analytics e Google News",
                      prompt: "Controlla SEO editoriale, analytics, Google News, sitemap, structured data e tracking per questa testata. Restituisci checklist tecnica con priorita`: {context}",
                    },
                    {
                      id: "piano-home-serp",
                      label: "Migliora home e SERP",
                      prompt: "Proponi miglioramenti pratici per homepage, listing e snippet SERP del sito, considerando articoli pubblicati, meta e copertura contenuti: {context}",
                    },
                  ]}
                  contextData={JSON.stringify(
                    {
                      tenant: currentTenant ? { name: currentTenant.name, slug: currentTenant.slug } : null,
                      siteSettings: {
                      siteDescription: siteSettings.site_description || "",
                      googleAnalytics: siteSettings.google_analytics || "",
                      googleTagManager: siteSettings.google_tag_manager || "",
                      googleAdsense: siteSettings.google_adsense || "",
                      googleSearchConsoleVerification: siteSettings.google_search_console_verification || "",
                      googleNewsPublicationName: siteSettings.google_news_publication_name || "",
                    },
                      articles: articles.map((a) => ({
                        title: a.title,
                        slug: a.slug,
                        hasMetaTitle: Boolean(a.meta_title),
                        hasMetaDescription: Boolean(a.meta_description),
                        hasOgImage: Boolean(a.og_image_url),
                        viewCount: a.view_count,
                        publishedAt: a.published_at,
                      })),
                    },
                    null,
                    2,
                  )}
                  compact
                />
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3 flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--c-text-2)" }}>
              <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--c-success)" }} /> verificato nel runtime</span>
              <span className="inline-flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--c-warning)" }} /> solo configurato o non verificato</span>
              <span className="inline-flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" style={{ color: "var(--c-danger)" }} /> assente</span>
            </div>
            <CheckItem status={runtimeChecks.sitemapReachable ? "verified" : "missing"} label="Sitemap.xml pubblico raggiungibile" />
            <CheckItem status={runtimeChecks.articleSchemaPresent ? "verified" : "missing"} label="JSON-LD NewsArticle presente in una pagina articolo" />
            <CheckItem status={runtimeChecks.articleOgPresent ? "verified" : "missing"} label="Meta Open Graph presenti in una pagina articolo" />
            <CheckItem status={runtimeChecks.slugCoverageOk ? "verified" : "missing"} label="Slug articoli coerenti e SEO-friendly" />
            <CheckItem status={runtimeChecks.readingTimeCoverageOk ? "verified" : "missing"} label="Tempo di lettura presente negli articoli pubblicati" />
            <CheckItem
              status={runtimeChecks.tagManagerRuntimePresent || runtimeChecks.analyticsRuntimePresent ? "verified" : siteSettings.google_analytics || siteSettings.google_tag_manager ? "configured" : "missing"}
              label={
                runtimeChecks.tagManagerRuntimePresent
                  ? `Google Tag Manager attivo nel runtime pubblico (${siteSettings.google_tag_manager})`
                  : runtimeChecks.analyticsRuntimePresent
                    ? `Google Analytics attivo nel runtime pubblico (${siteSettings.google_analytics})`
                    : siteSettings.google_tag_manager
                      ? `Google Tag Manager configurato ma non verificato nel runtime (${siteSettings.google_tag_manager})`
                      : siteSettings.google_analytics
                        ? `Google Analytics inserito nelle impostazioni ma non verificato nel runtime (${siteSettings.google_analytics})`
                        : "Google Analytics / Tag Manager non configurati"
              }
            />
            <CheckItem
              status={runtimeChecks.adsenseRuntimePresent ? "verified" : siteSettings.google_adsense ? "configured" : "missing"}
              label={
                runtimeChecks.adsenseRuntimePresent
                  ? `Google AdSense rilevato nel runtime pubblico (${siteSettings.google_adsense})`
                  : siteSettings.google_adsense
                    ? `Google AdSense configurato ma non verificato nel runtime (${siteSettings.google_adsense})`
                    : "Google AdSense non configurato"
              }
            />
            <CheckItem
              status={!!siteSettings.site_description ? "configured" : "missing"}
              label={siteSettings.site_description ? "Meta description sito configurata" : "Meta description sito mancante"}
            />
            <CheckItem status={seoScore >= 80 ? "verified" : "configured"} label={`${seoScore}% articoli con meta completi`} />
            <CheckItem
              status={runtimeChecks.searchConsoleVerificationPresent ? "verified" : siteSettings.google_search_console_verification ? "configured" : "missing"}
              label={
                runtimeChecks.searchConsoleVerificationPresent
                  ? "Meta Search Console presente nel runtime pubblico"
                  : siteSettings.google_search_console_verification
                    ? "Search Console configurato ma non verificato nel runtime"
                    : "Search Console non configurato"
              }
            />
            <CheckItem
              status={runtimeChecks.googleNewsPublicationRuntimePresent ? "verified" : siteSettings.google_news_publication_name ? "configured" : "missing"}
              label={
                runtimeChecks.googleNewsPublicationRuntimePresent
                  ? `Nome pubblicazione Google News presente nei dati pubblici (${siteSettings.google_news_publication_name})`
                  : siteSettings.google_news_publication_name
                    ? `Nome pubblicazione Google News configurato ma non verificato nel runtime (${siteSettings.google_news_publication_name})`
                    : "Nome pubblicazione Google News non configurato"
              }
            />
          </div>
        </div>

        {/* Endpoints SEO */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><Globe className="w-4 h-4" /> Risorse SEO</div>
          <div className="p-4 space-y-3">
            {[
              { label: "Articoli JSON", desc: "Endpoint pubblico dei contenuti pubblicati", icon: Rss, url: `/api/v1/articles?tenant=${currentTenant?.slug}&limit=20` },
              { label: "Sitemap XML", desc: "Sitemap pubblica del tenant", icon: Globe, url: currentTenant?.domain ? `https://${String(currentTenant.domain).replace(/^https?:\/\//, "")}/sitemap.xml` : `/site/${currentTenant?.slug}/sitemap.xml` },
              { label: "Robots.txt", desc: "Regole crawl pubbliche del tenant", icon: Search, url: currentTenant?.domain ? `https://${String(currentTenant.domain).replace(/^https?:\/\//, "")}/robots.txt` : `/site/${currentTenant?.slug}/robots.txt` },
              { label: "Breadcrumb JSON-LD", desc: "Schema breadcrumb dedicato per tenant e percorso", icon: BarChart3, url: `/api/seo/breadcrumb?tenant_slug=${currentTenant?.slug}&page_path=/` },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                <r.icon className="w-4 h-4 shrink-0" style={{ color: "var(--c-accent)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>{r.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="card" style={{ background: "var(--c-bg-2)" }}>
          <div className="card-header flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
            Risultati Analisi SEO
          </div>
          <div className="p-4 space-y-3">
            {analysisResult.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded" style={{ background: "var(--c-bg-3)" }}>
                  <p className="text-[10px]" style={{ color: "var(--c-text-2)" }}>Totale</p>
                  <p className="text-lg font-bold">{analysisResult.stats.total}</p>
                </div>
                <div className="p-2 rounded" style={{ background: "var(--c-bg-3)" }}>
                  <p className="text-[10px]" style={{ color: "var(--c-text-2)" }}>Meta Title</p>
                  <p className="text-lg font-bold">{Math.round((analysisResult.stats.with_meta_title / analysisResult.stats.total) * 100)}%</p>
                </div>
                <div className="p-2 rounded" style={{ background: "var(--c-bg-3)" }}>
                  <p className="text-[10px]" style={{ color: "var(--c-text-2)" }}>Meta Desc</p>
                  <p className="text-lg font-bold">{Math.round((analysisResult.stats.with_meta_desc / analysisResult.stats.total) * 100)}%</p>
                </div>
              </div>
            )}
            <div className="text-xs leading-relaxed" style={{ color: "var(--c-text-0)", whiteSpace: "pre-wrap" }}>
              {analysisResult.analysis || analysisResult.message}
            </div>
            {analysisResult.suggestions && Array.isArray(analysisResult.suggestions) && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold" style={{ color: "var(--c-text-0)" }}>Suggerimenti:</p>
                {analysisResult.suggestions.slice(0, 3).map((s, i) => (
                  <div key={i} className="text-xs p-2 rounded" style={{ background: "var(--c-bg-1)" }}>
                    <p style={{ color: "var(--c-text-1)" }}><strong>{s.article_title}</strong></p>
                    <p style={{ color: "var(--c-text-2)" }}>Title: {s.suggested_meta_title?.slice(0, 50)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Articles SEO Audit */}
      <div className="card">
        <div className="card-header flex items-center gap-2"><Search className="w-4 h-4" /> Audit SEO Articoli</div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--c-border)" }}>
                  <th className="text-left px-4 py-2.5 font-semibold" style={{ color: "var(--c-text-2)" }}>Articolo</th>
                  <th className="text-center px-3 py-2.5 font-semibold" style={{ color: "var(--c-text-2)" }}>Meta Title</th>
                  <th className="text-center px-3 py-2.5 font-semibold hidden sm:table-cell" style={{ color: "var(--c-text-2)" }}>Meta Desc</th>
                  <th className="text-center px-3 py-2.5 font-semibold hidden md:table-cell" style={{ color: "var(--c-text-2)" }}>OG Image</th>
                  <th className="text-right px-4 py-2.5 font-semibold" style={{ color: "var(--c-text-2)" }}>Visite</th>
                </tr>
              </thead>
              <tbody>
                {articles.slice(0, 20).map(a => (
                  <tr key={a.id} className="border-b" style={{ borderColor: "var(--c-border)" }}>
                    <td className="px-4 py-2.5 max-w-[250px] truncate" style={{ color: "var(--c-text-0)" }}>{a.title}</td>
                    <td className="px-3 py-2.5 text-center">
                      {a.meta_title ? <CheckCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-success)" }} /> : <XCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-danger)" }} />}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      {a.meta_description ? <CheckCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-success)" }} /> : <XCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-danger)" }} />}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      {a.og_image_url ? <CheckCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-success)" }} /> : <XCircle className="w-3.5 h-3.5 mx-auto" style={{ color: "var(--c-danger)" }} />}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--c-text-0)" }}>{a.view_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
