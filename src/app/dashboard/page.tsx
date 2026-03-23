"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  FileText,
  Image,
  Eye,
  Calendar,
  Megaphone,
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
  LayoutTemplate,
} from "lucide-react";

interface DashStats {
  articles: number;
  published: number;
  drafts: number;
  media: number;
  events: number;
  banners: number;
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
  const { currentTenant, currentRole, profile } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    articles: 0, published: 0, drafts: 0, media: 0, events: 0, banners: 0,
  });
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);

  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    async function loadDashboard() {
      const tenantId = currentTenant!.id;
      const [articlesRes, publishedRes, draftsRes, mediaRes, eventsRes, bannersRes] =
        await Promise.all([
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "published"),
          supabase.from("articles").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "draft"),
          supabase.from("media").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("events").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
          supabase.from("banners").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
        ]);

      setStats({
        articles: articlesRes.count ?? 0,
        published: publishedRes.count ?? 0,
        drafts: draftsRes.count ?? 0,
        media: mediaRes.count ?? 0,
        events: eventsRes.count ?? 0,
        banners: bannersRes.count ?? 0,
      });

      const { data: recent } = await supabase
        .from("articles")
        .select("id, title, status, created_at, profiles!articles_author_id_fkey(full_name), categories:categories!articles_category_id_fkey(name)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) {
        setRecentArticles(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recent.map((a: any) => ({
            id: a.id,
            title: a.title,
            status: a.status,
            created_at: a.created_at,
            author_name: a.profiles?.full_name ?? "—",
            category_name: a.categories?.name ?? null,
          }))
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
    { label: "Media", value: stats.media, icon: Image, accent: "text-purple-400" },
    { label: "Eventi", value: stats.events, icon: Calendar, accent: "text-pink-400" },
    { label: "Banner", value: stats.banners, icon: Megaphone, accent: "text-orange-400" },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          {profile?.full_name?.split(" ")[0] || "Ciao"}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-2)" }}>
          {currentTenant?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
              href="/dashboard/layout"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <LayoutTemplate className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Layout Sito
            </Link>
            <Link
              href="/dashboard/media"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            >
              <Image className="w-4 h-4" style={{ color: "var(--c-text-2)" }} /> Carica Media
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
