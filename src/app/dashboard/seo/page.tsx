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
  AlertTriangle,
  XCircle,
  ExternalLink,
  Rss,
} from "lucide-react";

interface ArticleSEO {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  published_at: string | null;
}

export default function SeoPage() {
  const { currentTenant } = useAuthStore();
  const [articles, setArticles] = useState<ArticleSEO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    supabase.from("articles")
      .select("id, title, slug, meta_title, meta_description, og_image_url, view_count, published_at")
      .eq("tenant_id", currentTenant.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setArticles(data as ArticleSEO[]);
        setLoading(false);
      });
  }, [currentTenant]);

  const withMeta = articles.filter(a => a.meta_title && a.meta_description);
  const withOG = articles.filter(a => a.og_image_url);
  const totalViews = articles.reduce((s, a) => s + a.view_count, 0);
  const seoScore = articles.length > 0 ? Math.round((withMeta.length / articles.length) * 100) : 0;

  const settings = (currentTenant?.settings ?? {}) as Record<string, string>;

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

  const CheckItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-2 py-1.5">
      {ok ? <CheckCircle className="w-4 h-4" style={{ color: "var(--c-success)" }} /> : <XCircle className="w-4 h-4" style={{ color: "var(--c-danger)" }} />}
      <span className="text-xs" style={{ color: ok ? "var(--c-text-0)" : "var(--c-text-2)" }}>{label}</span>
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
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
          <div className="card-header flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Checklist SEO Sito</div>
          <div className="p-4">
            <CheckItem ok={true} label="Sitemap.xml generabile da API" />
            <CheckItem ok={true} label="Schema.org NewsArticle nei dati" />
            <CheckItem ok={true} label="Open Graph tags per ogni articolo" />
            <CheckItem ok={true} label="Slug SEO-friendly automatici" />
            <CheckItem ok={true} label="Tempo di lettura calcolato" />
            <CheckItem ok={!!settings.google_analytics} label={`Google Analytics ${settings.google_analytics ? "configurato" : "non configurato"}`} />
            <CheckItem ok={!!settings.site_description} label={`Meta description sito ${settings.site_description ? "presente" : "mancante"}`} />
            <CheckItem ok={seoScore >= 80} label={`${seoScore}% articoli con meta completi`} />
          </div>
        </div>

        {/* Endpoints SEO */}
        <div className="card">
          <div className="card-header flex items-center gap-2"><Globe className="w-4 h-4" /> Risorse SEO</div>
          <div className="p-4 space-y-3">
            {[
              { label: "RSS Feed", desc: "Feed Atom per Google News e aggregatori", icon: Rss, url: `/api/v1/articles?tenant=${currentTenant?.slug}&limit=20` },
              { label: "Sitemap dati", desc: "Lista articoli per generare sitemap.xml", icon: Globe, url: `/api/v1/articles?tenant=${currentTenant?.slug}&limit=100` },
              { label: "Schema.org", desc: "Dati strutturati NewsArticle da API articoli", icon: BarChart3, url: `/api/v1/articles/${"{slug}"}?tenant=${currentTenant?.slug}` },
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
