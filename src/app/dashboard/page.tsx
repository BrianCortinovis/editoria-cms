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
        .select("id, title, status, created_at, profiles!articles_author_id_fkey(full_name), categories(name)")
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

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    in_review: "bg-yellow-900/50 text-yellow-400",
    approved: "bg-blue-900/50 text-blue-400",
    published: "bg-emerald-900/50 text-emerald-400",
    archived: "bg-red-900/50 text-red-400",
  };

  const statusLabels: Record<string, string> = {
    draft: "Bozza",
    in_review: "Revisione",
    approved: "Approvato",
    published: "Online",
    archived: "Archiviato",
  };

  const statCards = [
    { label: "Articoli", value: stats.articles, icon: FileText, accent: "text-blue-400" },
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
        <h2 className="text-xl font-semibold text-white">
          {profile?.full_name?.split(" ")[0] || "Ciao"}
        </h2>
        <p className="text-sm text-zinc-500 mt-0.5">
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
              className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition"
            >
              <Icon className={`w-5 h-5 ${card.accent} mb-2`} />
              <p className="text-2xl font-bold text-white tabular-nums">
                {card.value}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#27272a] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Azioni Rapide
          </div>
          <div className="p-3 space-y-1.5">
            <Link
              href="/dashboard/articoli/nuovo"
              className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Nuovo Articolo
            </Link>
            <Link
              href="/dashboard/layout"
              className="flex items-center gap-3 px-3 py-2.5 bg-[#27272a] text-zinc-300 rounded-lg hover:bg-[#3f3f46] transition text-sm font-medium"
            >
              <LayoutTemplate className="w-4 h-4 text-zinc-500" /> Layout Sito
            </Link>
            <Link
              href="/dashboard/media"
              className="flex items-center gap-3 px-3 py-2.5 bg-[#27272a] text-zinc-300 rounded-lg hover:bg-[#3f3f46] transition text-sm font-medium"
            >
              <Image className="w-4 h-4 text-zinc-500" /> Carica Media
            </Link>
            <Link
              href="/dashboard/breaking-news"
              className="flex items-center gap-3 px-3 py-2.5 bg-[#27272a] text-zinc-300 rounded-lg hover:bg-[#3f3f46] transition text-sm font-medium"
            >
              <Zap className="w-4 h-4 text-zinc-500" /> Breaking News
            </Link>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Ultimi Articoli
            </span>
            <Link
              href="/dashboard/articoli"
              className="text-xs text-blue-400 font-medium flex items-center gap-1 hover:text-blue-300"
            >
              Tutti <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#27272a]">
            {recentArticles.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-600">
                Nessun articolo. Inizia a scrivere!
              </div>
            ) : (
              recentArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/dashboard/articoli/${article.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#1f1f23] transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {article.title}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {article.author_name}
                      {article.category_name && ` · ${article.category_name}`}
                      {" · "}
                      {new Date(article.created_at).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-3 ${
                      statusColors[article.status] ?? "bg-zinc-700 text-zinc-400"
                    }`}
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
