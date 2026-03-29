"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FilePlus2,
  Trash2,
  Copy,
  GripVertical,
  Globe,
  FileText,
  Loader2,
  Pencil,
  Check,
  X,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  is_published: boolean;
  sort_order: number;
  updated_at: string | null;
}

interface PageManagerPanelProps {
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  homepage: "Homepage",
  page: "Pagina",
  article: "Articolo",
  category: "Categoria",
  search: "Ricerca",
  landing: "Landing",
};

export function PageManagerPanel({ currentPageId, onSelectPage }: PageManagerPanelProps) {
  const { currentTenant } = useAuthStore();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("page");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch(
        `/api/builder/pages?tenant_id=${encodeURIComponent(currentTenant.id)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setPages(Array.isArray(data.pages) ? data.pages : []);
    } catch {
      toast.error("Errore caricamento pagine");
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const createPage = async () => {
    if (!currentTenant?.id || !newTitle.trim()) return;
    setCreating(true);
    const slug = newTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    try {
      const res = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          title: newTitle.trim(),
          slug: slug || "nuova-pagina",
          page_type: newType,
          blocks: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");
      toast.success("Pagina creata");
      setShowCreate(false);
      setNewTitle("");
      setNewType("page");
      await loadPages();
      if (data.page?.id) onSelectPage(data.page.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setCreating(false);
    }
  };

  const duplicatePage = async (page: PageItem) => {
    if (!currentTenant?.id) return;
    try {
      // Fetch full page data
      const res = await fetch(`/api/builder/pages/${page.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error("Fetch failed");

      const blocks = data.page?.blocks || [];
      const createRes = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          title: `${page.title} (copia)`,
          slug: `${page.slug}-copia-${Date.now().toString(36)}`,
          page_type: page.page_type,
          blocks,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Duplicate failed");
      toast.success("Pagina duplicata");
      await loadPages();
      if (createData.page?.id) onSelectPage(createData.page.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore duplicazione");
    }
  };

  const renamePage = async (pageId: string) => {
    if (!editTitle.trim()) return;
    try {
      const res = await fetch(`/api/builder/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (!res.ok) throw new Error("Rename failed");
      setEditingId(null);
      await loadPages();
      toast.success("Rinominata");
    } catch {
      toast.error("Errore rinomina");
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      const res = await fetch(`/api/builder/pages/${pageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setDeletingId(null);
      toast.success("Pagina eliminata");
      await loadPages();
      // If deleted current page, select first available
      if (pageId === currentPageId) {
        const remaining = pages.filter((p) => p.id !== pageId);
        if (remaining.length > 0) onSelectPage(remaining[0].id);
      }
    } catch {
      toast.error("Errore eliminazione");
    }
  };

  const filtered = search.trim()
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : pages;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--c-text-0)" }}
          >
            Pagine ({pages.length})
          </span>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold"
            style={{
              background: "var(--c-accent)",
              color: "#fff",
            }}
          >
            <FilePlus2 size={11} />
            Nuova
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--c-text-2)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca pagine..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--c-bg-1)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-1)",
            }}
          />
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="mx-3 mb-2 rounded-xl p-3 space-y-2"
          style={{
            background: "var(--c-bg-1)",
            border: "1px solid var(--c-accent)",
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void createPage();
              if (e.key === "Escape") setShowCreate(false);
            }}
            placeholder="Titolo pagina"
            autoFocus
            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--c-bg-0)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-0)",
            }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--c-bg-0)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-1)",
            }}
          >
            {Object.entries(PAGE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void createPage()}
              disabled={creating || !newTitle.trim()}
              className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
            >
              {creating ? (
                <Loader2 size={12} className="animate-spin mx-auto" />
              ) : (
                "Crea"
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-3 py-1.5 text-xs"
              style={{
                background: "var(--c-bg-2)",
                color: "var(--c-text-1)",
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Page list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: "var(--c-text-2)" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <p
            className="text-xs text-center py-6"
            style={{ color: "var(--c-text-2)" }}
          >
            {search ? "Nessun risultato" : "Nessuna pagina"}
          </p>
        ) : (
          filtered.map((page) => {
            const isActive = page.id === currentPageId;
            const isEditing = editingId === page.id;
            const isDeleting = deletingId === page.id;

            return (
              <div
                key={page.id}
                className="group rounded-lg px-2.5 py-2 transition-colors"
                style={{
                  background: isActive
                    ? "var(--c-accent-soft, rgba(59,130,246,0.1))"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--c-accent)"
                    : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <GripVertical
                    size={12}
                    className="shrink-0 opacity-30"
                    style={{ color: "var(--c-text-2)" }}
                  />

                  {page.is_published ? (
                    <Globe
                      size={11}
                      className="shrink-0"
                      style={{ color: "#22c55e" }}
                    />
                  ) : (
                    <FileText
                      size={11}
                      className="shrink-0"
                      style={{ color: "var(--c-text-2)" }}
                    />
                  )}

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void renamePage(page.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: "var(--c-bg-0)",
                          border: "1px solid var(--c-border)",
                          color: "var(--c-text-0)",
                        }}
                      />
                      <button
                        onClick={() => void renamePage(page.id)}
                        className="p-0.5"
                        style={{ color: "#22c55e" }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-0.5"
                        style={{ color: "var(--c-text-2)" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPage(page.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div
                        className="text-xs font-medium truncate"
                        style={{
                          color: isActive
                            ? "var(--c-accent)"
                            : "var(--c-text-0)",
                        }}
                      >
                        {page.title}
                      </div>
                      <div
                        className="text-[10px] truncate"
                        style={{ color: "var(--c-text-2)" }}
                      >
                        /{page.slug} · {PAGE_TYPE_LABELS[page.page_type] || page.page_type}
                      </div>
                    </button>
                  )}

                  {/* Actions - visible on hover */}
                  {!isEditing && (
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(page.id);
                          setEditTitle(page.title);
                        }}
                        className="p-1 rounded hover:bg-white/10"
                        title="Rinomina"
                      >
                        <Pencil size={11} style={{ color: "var(--c-text-2)" }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void duplicatePage(page)}
                        className="p-1 rounded hover:bg-white/10"
                        title="Duplica"
                      >
                        <Copy size={11} style={{ color: "var(--c-text-2)" }} />
                      </button>
                      {isDeleting ? (
                        <button
                          type="button"
                          onClick={() => void deletePage(page.id)}
                          className="p-1 rounded text-[10px] font-semibold"
                          style={{ color: "#ef4444" }}
                          title="Conferma eliminazione"
                        >
                          <Trash2 size={11} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(page.id)}
                          className="p-1 rounded hover:bg-white/10"
                          title="Elimina"
                        >
                          <Trash2
                            size={11}
                            style={{ color: "var(--c-text-2)" }}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
