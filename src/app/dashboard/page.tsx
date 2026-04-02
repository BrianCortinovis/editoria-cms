"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  Cpu,
  Database,
  FileText,
  Image as ImageIcon,
  Calendar,
  Megaphone,
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
  ScanLine,
  Upload,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface DashStats {
  articles: number;
  published: number;
  drafts: number;
  inReview: number;
  approved: number;
  media: number;
  events: number;
  banners: number;
  activeBreaking: number;
}

interface RecentArticle {
  id: string;
  title: string;
  status: string;
  created_at: string;
  author_name: string;
  category_name: string | null;
}

export default function DashboardPage() {
  const { currentTenant, profile } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    articles: 0, published: 0, drafts: 0, inReview: 0, approved: 0, media: 0, events: 0, banners: 0, activeBreaking: 0,
  });
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    async function loadDashboard() {
      const tenantId = currentTenant!.id;
      const [articlesRes, publishedRes, draftsRes, inReviewRes, approvedRes, mediaRes, eventsRes, bannersRes, breakingRes] =
        await Promise.all([
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "published"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "draft"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "in_review"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "approved"),
          supabase.from("media").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("banners").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("breaking_news").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("is_active", true),
        ]);

      setStats({
        articles: articlesRes.count ?? 0,
        published: publishedRes.count ?? 0,
        drafts: draftsRes.count ?? 0,
        inReview: inReviewRes.count ?? 0,
        approved: approvedRes.count ?? 0,
        media: mediaRes.count ?? 0,
        events: eventsRes.count ?? 0,
        banners: bannersRes.count ?? 0,
        activeBreaking: breakingRes.count ?? 0,
      });

      const { data: recent } = await supabase
        .from("articles")
        .select("id, title, status, created_at, profiles!articles_author_id_fkey(full_name), categories:categories!articles_category_id_fkey(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) {
        setRecentArticles(
          recent.map((a) => {
            const profiles = a.profiles as unknown as { full_name?: string } | null;
            const categories = a.categories as unknown as { name?: string } | null;
            return {
              id: a.id,
              title: a.title,
              status: a.status,
              created_at: a.created_at,
              author_name: profiles?.full_name ?? "—",
              category_name: categories?.name ?? null,
            };
          })
        );
      }
    }

    loadDashboard();
  }, [currentTenant]);

  const statusColors: Record<string, { background: string; color: string }> = {
    draft: { background: "var(--c-bg-2)", color: "var(--c-text-2)" },
    in_review: { background: "rgba(var(--c-warning-rgb, 234,179,8), 0.15)", color: "var(--c-warning)" },
    approved: { background: "var(--c-accent-soft)", color: "var(--c-accent)" },
    published: { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" },
    archived: { background: "rgba(var(--c-danger-rgb, 239,68,68), 0.15)", color: "var(--c-danger)" },
  };

  const statusLabels: Record<string, string> = {
    draft: "Bozza",
    in_review: "Revisione",
    approved: "Approvato",
    published: "Online",
    archived: "Archiviato",
  };

  const statCards = [
    { label: "Articoli", value: stats.articles, icon: FileText, accent: "accent" },
    { label: "Pubblicati", value: stats.published, icon: TrendingUp, accent: "text-emerald-400" },
    { label: "Bozze", value: stats.drafts, icon: FileText, accent: "text-yellow-400" },
    { label: "In revisione", value: stats.inReview, icon: ScanLine, accent: "text-orange-400" },
    { label: "Approvati", value: stats.approved, icon: ArrowRight, accent: "text-sky-400" },
    { label: "Breaking attive", value: stats.activeBreaking, icon: Zap, accent: "text-red-400" },
    { label: "Media", value: stats.media, icon: ImageIcon, accent: "text-purple-400" },
    { label: "Eventi", value: stats.events, icon: Calendar, accent: "text-pink-400" },
    { label: "Banner", value: stats.banners, icon: Megaphone, accent: "text-orange-400" },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              {profile?.full_name?.split(" ")[0] || "Ciao"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--c-text-2)" }}>
              {currentTenant?.name}
            </p>
          </div>
          <AIButton
            compact
            actions={[
              {
                id: "dashboard-ops",
                label: "Sintesi operativa",
                prompt: "Analizza dashboard, numeri del tenant, articoli recenti e moduli principali. Suggerisci priorita` operative per redazione, tecnico, SEO e publish: {context}",
              },
              {
                id: "dashboard-tech",
                label: "Controllo tecnico",
                prompt: "Rivedi il tenant dal punto di vista tecnico e gestionale: contenuti, media, eventi, banner e strumenti disponibili. Evidenzia rischi e next step: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                stats,
                recentArticles,
              },
              null,
              2,
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <Link
          href="/dashboard/cms"
          className="rounded-2xl border p-5 transition block"
          style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
          >
            <Database className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Cloud CMS
              </div>
              <h3 className="text-lg font-semibold mt-1" style={{ color: "var(--c-text-0)" }}>
                Contenuti, SEO e pubblicazione
              </h3>
              <p className="text-sm mt-2 leading-6" style={{ color: "var(--c-text-2)" }}>
                Accesso diretto al CMS puro, senza entrare nell&apos;editor. Da qui gestisci articoli, media, categorie, regole slot e publishing.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0" style={{ color: "var(--c-text-3)" }} />
          </div>
        </Link>

        <Link
          href="/dashboard/importa-sito"
          className="rounded-2xl border p-5 transition block"
          style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
          >
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Importa Sito
              </div>
              <h3 className="text-lg font-semibold mt-1" style={{ color: "var(--c-text-0)" }}>
                Da Desktop Builder
              </h3>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0" style={{ color: "var(--c-text-3)" }} />
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-4 transition"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--c-border-light)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--c-border)"}
            >
              <Icon
                className={`w-5 h-5 mb-2 ${card.accent === "accent" ? "" : card.accent}`}
                style={card.accent === "accent" ? { color: "var(--c-accent)" } : undefined}
              />
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--c-text-0)" }}>
                {card.value}
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--c-text-2)" }}>
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Priorità immediate
          </div>
          <div className="p-3 space-y-2">
            <Link href="/dashboard/articoli" className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <span className="text-sm font-medium">Bozze da chiudere</span>
              <strong style={{ color: "var(--c-text-0)" }}>{stats.drafts}</strong>
            </Link>
            <Link href="/dashboard/redazione" className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <span className="text-sm font-medium">Articoli in revisione</span>
              <strong style={{ color: "var(--c-text-0)" }}>{stats.inReview}</strong>
            </Link>
            <Link href="/dashboard/breaking-news" className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <span className="text-sm font-medium">Breaking attive</span>
              <strong style={{ color: "var(--c-text-0)" }}>{stats.activeBreaking}</strong>
            </Link>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden lg:col-span-2" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Sotto controllo
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
            <Link href="/dashboard/social" className="rounded-lg px-3 py-3" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Social</div>
              <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>Programmazione, canali attivi e rilanci.</div>
            </Link>
            <Link href="/dashboard/newsletter" className="rounded-lg px-3 py-3" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Newsletter</div>
              <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>Invii, iscritti e funnel editoriali.</div>
            </Link>
            <Link href="/dashboard/tecnico" className="rounded-lg px-3 py-3" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Tecnico</div>
              <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>Bridge, publish e stato runtime.</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-2)" }}>
            Azioni Rapide
          </div>
          <div className="p-3 space-y-1.5">
            <Link
              href="/dashboard/articoli/nuovo"
              className="flex items-center gap-3 px-3 py-2.5 text-white rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
            >
              <Plus className="w-4 h-4" /> Nuovo Articolo
            </Link>
            <Link
              href="/dashboard/layout/content"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <ScanLine className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Regole Slot
            </Link>
            <Link
              href="/dashboard/importa-sito"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <Cpu className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Importa Sito
            </Link>
            <Link
              href="/dashboard/media"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <ImageIcon className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Carica Media
            </Link>
            <Link
              href="/dashboard/breaking-news"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <Zap className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Breaking News
            </Link>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="rounded-xl overflow-hidden lg:col-span-2" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
              Ultimi Articoli
            </span>
            <Link
              href="/dashboard/articoli"
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "var(--c-accent)" }}
            >
              Tutti <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {recentArticles.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "var(--c-text-3)" }}>
                Nessun articolo. Inizia a scrivere!
              </div>
            ) : (
              recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/dashboard/articoli/${article.id}`}
                  className="flex items-center justify-between px-4 py-3 transition"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>
                      {article.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-3)" }}>
                      {article.author_name}
                      {article.category_name && ` · ${article.category_name}`}
                      {" · "}
                      {new Date(article.created_at).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-3"
                    style={statusColors[article.status] ?? { background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                  >
                    {statusLabels[article.status] ?? article.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
