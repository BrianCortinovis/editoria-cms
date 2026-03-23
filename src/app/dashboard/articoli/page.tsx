"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Star,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  is_premium: boolean;
  view_count: number;
  created_at: string;
  published_at: string | null;
  author: { full_name: string } | null;
  category: { name: string; color: string } | null;
}

const statusColors: Record<string, { background: string; color: string }> = {
  draft: { background: "var(--c-bg-2)", color: "var(--c-text-2)" },
  in_review: { background: "rgba(var(--c-warning-rgb, 234,179,8), 0.15)", color: "var(--c-warning)" },
  approved: { background: "var(--c-accent-soft)", color: "var(--c-accent)" },
  published: { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" },
  archived: { background: "rgba(var(--c-danger-rgb, 239,68,68), 0.15)", color: "var(--c-danger)" },
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  in_review: "In Revisione",
  approved: "Approvato",
  published: "Pubblicato",
  archived: "Archiviato",
};

export default function ArticoliPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    let query = supabase
      .from("articles")
      .select(
        "id, title, slug, status, is_featured, is_premium, view_count, created_at, published_at, profiles!articles_author_id_fkey(full_name), categories:categories!articles_category_id_fkey(name, color)"
      )
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data } = await query.limit(50);
    if (data) {
      setArticles(data as unknown as Article[]);
    }
    setLoading(false);
  }, [currentTenant, filterStatus, search]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo articolo?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      toast.error("Errore nell'eliminazione");
    } else {
      toast.success("Articolo eliminato");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
    setMenuOpen(null);
  };

  return (
    <div className="max-w-[90%] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            {articles.length} articol{articles.length === 1 ? "o" : "i"}
          </h2>
        </div>
        <Link
          href="/dashboard/articoli/nuovo"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ background: "var(--c-accent)" }}
        >
          <Plus className="w-4 h-4" /> Nuovo Articolo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca articoli..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ border: "1px solid var(--c-border)", "--tw-ring-color": "var(--c-accent)" } as React.CSSProperties}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer"
            style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
          >
            <option value="all">Tutti gli stati</option>
            <option value="draft">Bozze</option>
            <option value="in_review">In Revisione</option>
            <option value="approved">Approvati</option>
            <option value="published">Pubblicati</option>
            <option value="archived">Archiviati</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>
            Caricamento...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm mb-3" style={{ color: "var(--c-text-3)" }}>Nessun articolo trovato</p>
            <Link
              href="/dashboard/articoli/nuovo"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--c-accent)" }}
            >
              Crea il primo articolo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-2)" }}>
                    Titolo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--c-text-2)" }}>
                    Categoria
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--c-text-2)" }}>
                    Stato
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--c-text-2)" }}>
                    Autore
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--c-text-2)" }}>
                    Visite
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--c-text-2)" }}>
                    Data
                  </th>
                  <th className="w-10 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--c-border)" }}>
                {articles.map((article) => (
                  <tr key={article.id} className="transition hover:bg-[var(--c-bg-2)]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/articoli/${article.id}`}
                        className="group"
                      >
                        <p className="text-sm font-medium transition flex items-center gap-1.5" style={{ color: "var(--c-text-0)" }}>
                          {article.is_featured && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          {article.title}
                        </p>
                        <p className="text-xs mt-0.5 sm:hidden" style={{ color: "var(--c-text-3)" }}>
                          {statusLabels[article.status]}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {article.category ? (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${article.category.color}15`,
                            color: article.category.color,
                          }}
                        >
                          {article.category.name}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--c-text-3)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={statusColors[article.status] ?? { background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                      >
                        {statusLabels[article.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm" style={{ color: "var(--c-text-2)" }}>
                        {article.author?.full_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm flex items-center justify-end gap-1" style={{ color: "var(--c-text-2)" }}>
                        <Eye className="w-3.5 h-3.5" />
                        {article.view_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--c-text-3)" }}>
                        <Clock className="w-3 h-3" />
                        {new Date(article.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </td>
                    <td className="px-2 py-3 relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === article.id ? null : article.id)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded transition hover:bg-[var(--c-bg-2)]"
                      >
                        <MoreVertical className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                      </button>
                      {menuOpen === article.id && (
                        <div className="absolute right-2 top-10 rounded-lg shadow-lg z-10 py-1 w-40" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                          <Link
                            href={`/dashboard/articoli/${article.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-[var(--c-bg-2)]"
                            style={{ color: "var(--c-text-1)" }}
                            onClick={() => setMenuOpen(null)}
                          >
                            <Pencil className="w-3.5 h-3.5" /> Modifica
                          </Link>
                          {currentRole === "super_admin" && (
                            <button
                              onClick={() => handleDelete(article.id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 w-full text-left transition hover:bg-[var(--c-bg-2)]"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Elimina
                            </button>
                          )}
                        </div>
                      )}
                    </td>
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
