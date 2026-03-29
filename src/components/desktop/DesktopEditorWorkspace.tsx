"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePlus2, Loader2, MonitorCog, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { BuilderShell } from "@/components/builder/BuilderShell";
import PageTemplateSelector from "@/components/builder/PageTemplateSelector";
import { useAuthStore } from "@/lib/store";
import type { Block } from "@/lib/types/block";

interface EditorPageOption {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string | null;
}

const EDITOR_ROLES = new Set(["admin", "chief_editor", "editor"]);

export function DesktopEditorWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant, currentRole } = useAuthStore();
  const [pages, setPages] = useState<EditorPageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [pendingTemplateBlocks, setPendingTemplateBlocks] = useState<Block[] | null>(null);
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageType, setNewPageType] = useState<string>("page");

  const selectedPageId = searchParams.get("page") ?? "";
  const canEdit = currentRole ? EDITOR_ROLES.has(currentRole) : false;

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null,
    [pages, selectedPageId],
  );

  const setPageInUrl = useCallback(
    (pageId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("page", pageId);
      router.replace(`/desktop-editor?${next.toString()}`);
    },
    [router, searchParams],
  );

  const loadPages = useCallback(async () => {
    if (!currentTenant?.id) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/builder/pages?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile caricare le pagine");
      }

      const nextPages = Array.isArray(payload.pages) ? payload.pages : [];
      setPages(nextPages);
      setBootstrapped(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore caricamento pagine");
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  const createHomepage = useCallback(async () => {
    if (!currentTenant?.id || !canEdit) {
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          title: "Homepage",
          slug: "homepage",
          page_type: "homepage",
          blocks: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile creare la homepage");
      }

      toast.success("Homepage creata");
      await loadPages();
      if (payload.page?.id) {
        setPageInUrl(payload.page.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore creazione homepage");
    } finally {
      setCreating(false);
    }
  }, [canEdit, currentTenant?.id, loadPages, setPageInUrl]);

  const createPage = useCallback(async () => {
    if (!currentTenant?.id || !canEdit || !newPageTitle.trim()) return;

    const slug = newPageTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setCreating(true);
    try {
      const response = await fetch("/api/builder/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          title: newPageTitle.trim(),
          slug: slug || "nuova-pagina",
          page_type: newPageType,
          blocks: pendingTemplateBlocks || [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile creare la pagina");
      }

      toast.success("Pagina creata");
      setShowNewPageForm(false);
      setNewPageTitle("");
      setNewPageType("page");
      setPendingTemplateBlocks(null);
      await loadPages();
      if (payload.page?.id) {
        setPageInUrl(payload.page.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore creazione pagina");
    } finally {
      setCreating(false);
    }
  }, [canEdit, currentTenant?.id, loadPages, newPageTitle, newPageType, setPageInUrl]);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      setPageInUrl(pages[0].id);
    }
  }, [pages, selectedPageId, setPageInUrl]);

  if (!currentTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "var(--c-bg-0)" }}>
        <div className="w-full max-w-xl border-y py-8">
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
            Seleziona un sito dal CMS prima di aprire l&apos;editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg-0)" }}>
      <header className="border-b px-6 py-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
              <MonitorCog className="h-3.5 w-3.5" />
              Desktop Editor
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
              {currentTenant.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/cms"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-1)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al CMS
            </Link>
            <Link
              href="/dashboard/desktop-bridge"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-1)" }}
            >
              Bridge
              <ExternalLink className="h-4 w-4" />
            </Link>
            <div className="min-w-[220px]">
              <select
                value={selectedPage?.id ?? ""}
                onChange={(event) => setPageInUrl(event.target.value)}
                className="w-full rounded-full border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-0)" }}
                disabled={loading || pages.length === 0}
              >
                {pages.length === 0 ? (
                  <option value="">Nessuna pagina</option>
                ) : (
                  pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            {canEdit && !showNewPageForm && (
              <button
                type="button"
                onClick={() => setShowNewPageForm(true)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-1)" }}
                title="Nuova pagina"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Nuova</span>
              </button>
            )}
            {showNewPageForm && (
              <div
                className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                style={{ borderColor: "var(--c-accent)", background: "var(--c-bg-1)" }}
              >
                <input
                  type="text"
                  placeholder="Titolo pagina"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void createPage();
                    if (e.key === "Escape") { setShowNewPageForm(false); setNewPageTitle(""); }
                  }}
                  autoFocus
                  className="border-none bg-transparent text-sm outline-none w-[140px]"
                  style={{ color: "var(--c-text-0)" }}
                />
                <select
                  value={newPageType}
                  onChange={(e) => setNewPageType(e.target.value)}
                  className="border-none bg-transparent text-xs outline-none"
                  style={{ color: "var(--c-text-1)" }}
                >
                  <option value="homepage">Homepage</option>
                  <option value="page">Pagina</option>
                  <option value="article">Articolo</option>
                  <option value="category">Categoria</option>
                  <option value="search">Ricerca</option>
                  <option value="landing">Landing</option>
                </select>
                <button
                  type="button"
                  onClick={() => void createPage()}
                  disabled={creating || !newPageTitle.trim()}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--c-accent)" }}
                >
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FilePlus2 className="h-3 w-3" />}
                  Crea
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateSelector(true)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
                >
                  Da template
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewPageForm(false); setNewPageTitle(""); setPendingTemplateBlocks(null); }}
                  className="p-0.5 rounded"
                  style={{ color: "var(--c-text-2)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {pendingTemplateBlocks && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                    Template selezionato
                  </span>
                )}
              </div>
            )}
            {showTemplateSelector && (
              <PageTemplateSelector
                onSelect={(blocks: Block[]) => {
                  setPendingTemplateBlocks(blocks);
                  setShowTemplateSelector(false);
                  if (!showNewPageForm) setShowNewPageForm(true);
                  toast.success("Template selezionato — inserisci titolo e crea la pagina");
                }}
                onSkip={() => {
                  setPendingTemplateBlocks(null);
                  setShowTemplateSelector(false);
                  if (!showNewPageForm) setShowNewPageForm(true);
                }}
              />
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-81px)]">
        {loading ? (
          <div className="flex min-h-[calc(100vh-81px)] items-center justify-center">
            <div className="inline-flex items-center gap-3 text-sm" style={{ color: "var(--c-text-2)" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento editor...
            </div>
          </div>
        ) : pages.length === 0 ? (
          <div className="mx-auto flex min-h-[calc(100vh-81px)] max-w-3xl items-center px-6">
            <div className="w-full border-y py-8" style={{ borderColor: "var(--c-border)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                Nessuna pagina disponibile
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--c-text-2)" }}>
                Crea una homepage per iniziare il layout del sito.
              </p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void createHomepage()}
                  disabled={creating}
                  className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--c-accent)" }}
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
                  Crea homepage
                </button>
              ) : (
                <p className="mt-5 text-sm" style={{ color: "var(--c-text-2)" }}>
                  Non hai i permessi per creare pagine.
                </p>
              )}
            </div>
          </div>
        ) : selectedPage ? (
          <BuilderShell
            key={selectedPage.id}
            projectId={currentTenant.id}
            projectName={currentTenant.name}
            pageId={selectedPage.id}
            onNavigateToPage={(pid) => { setPageInUrl(pid); void loadPages(); }}
          />
        ) : bootstrapped ? (
          <div className="flex min-h-[calc(100vh-81px)] items-center justify-center px-6 text-sm" style={{ color: "var(--c-text-2)" }}>
            Seleziona una pagina per aprire l&apos;editor.
          </div>
        ) : null}
      </main>
    </div>
  );
}
