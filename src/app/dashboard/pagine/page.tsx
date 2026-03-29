'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { buildCanonicalPathFromSlug, buildDefaultPageMeta, derivePageDescription, slugifyPageTitle } from '@/lib/pages/page-seo';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Clock,
  ExternalLink,
  Copy,
  LayoutTemplate,
  Search,
} from 'lucide-react';
import AIButton from '@/components/ai/AIButton';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  parent_id: null;
  path: string;
  depth: 0;
  seo_slug: string;
  breadcrumb: Array<{ title: string; slug: string }>;
  page_type?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function PaginePage() {
  const { currentTenant } = useAuthStore();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageMetaTitle, setNewPageMetaTitle] = useState('');
  const [newPageMetaDescription, setNewPageMetaDescription] = useState('');
  const [newPageOgTitle, setNewPageOgTitle] = useState('');
  const [newPageOgDescription, setNewPageOgDescription] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [metaTitleManual, setMetaTitleManual] = useState(false);
  const [metaDescriptionManual, setMetaDescriptionManual] = useState(false);
  const [ogTitleManual, setOgTitleManual] = useState(false);
  const [ogDescriptionManual, setOgDescriptionManual] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishingPageId, setPublishingPageId] = useState<string | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [previewingPageId, setPreviewingPageId] = useState<string | null>(null);
  const [duplicatingPageId, setDuplicatingPageId] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    if (!currentTenant) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_pages')
      .select('id, title, slug, page_type, is_published, sort_order, created_at, updated_at')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (!error && data) {
      setPages(data.map((page) => ({
        ...page,
        parent_id: null,
        path: `/${page.slug}`,
        depth: 0,
        seo_slug: page.slug,
        breadcrumb: [{ title: page.title, slug: page.slug }],
      })));
    } else if (error) {
      toast.error(error.message || 'Errore caricamento pagine');
    }
    setLoading(false);
  }, [currentTenant]);

  // Load pages
  useEffect(() => {
    if (!currentTenant) return;
    const timer = window.setTimeout(() => {
      void loadPages();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentTenant, loadPages]);

  useEffect(() => {
    const title = newPageTitle.trim();
    const suggestedSlug = slugifyPageTitle(title);
    const suggestedDescription = derivePageDescription(title, []);

    if (!slugManual) {
      setNewPageSlug(suggestedSlug);
    }
    if (!metaTitleManual) {
      setNewPageMetaTitle(title);
    }
    if (!metaDescriptionManual) {
      setNewPageMetaDescription(suggestedDescription);
    }
    if (!ogTitleManual) {
      setNewPageOgTitle(title);
    }
    if (!ogDescriptionManual) {
      setNewPageOgDescription(suggestedDescription);
    }
  }, [
    metaDescriptionManual,
    metaTitleManual,
    newPageTitle,
    ogDescriptionManual,
    ogTitleManual,
    slugManual,
  ]);

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !currentTenant) return;

    setCreating(true);
    const supabase = createClient();

    const nextMeta = buildDefaultPageMeta({
      title: newPageTitle,
      slug: newPageSlug,
      currentMeta: {
        title: newPageMetaTitle,
        description: newPageMetaDescription,
        canonicalPath: buildCanonicalPathFromSlug(newPageSlug),
        focusKeyword: newPageTitle.trim(),
        ogTitle: newPageOgTitle,
        ogDescription: newPageOgDescription,
      },
    });

    const { data, error } = await supabase
      .from('site_pages')
      .insert({
        tenant_id: currentTenant.id,
        title: newPageTitle,
        slug: newPageSlug,
        page_type: newPageSlug === 'homepage' ? 'homepage' : 'custom',
        meta: nextMeta,
        is_published: false,
        blocks: [],
        sort_order: 0,
      })
      .select()
      .single();

    if (!error && data) {
      toast.success('Pagina creata');
      await loadPages();
      setNewPageTitle('');
      setNewPageSlug('');
      setNewPageMetaTitle('');
      setNewPageMetaDescription('');
      setNewPageOgTitle('');
      setNewPageOgDescription('');
      setSlugManual(false);
      setMetaTitleManual(false);
      setMetaDescriptionManual(false);
      setOgTitleManual(false);
      setOgDescriptionManual(false);
      setShowNewPage(false);
    } else if (error) {
      toast.error(error.message || 'Errore creazione pagina');
    }
    setCreating(false);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Eliminare questa pagina?')) return;

    setDeletingPageId(pageId);
    const supabase = createClient();
    const { error } = await supabase
      .from('site_pages')
      .delete()
      .eq('id', pageId);

    if (!error) {
      toast.success('Pagina eliminata');
      await loadPages();
    } else {
      toast.error(error.message || 'Errore eliminazione pagina');
    }
    setDeletingPageId(null);
  };

  const togglePublish = async (pageId: string, isPublished: boolean) => {
    setPublishingPageId(pageId);
    const supabase = createClient();
    const nextPublishedState = !isPublished;

    const { error } = await supabase
      .from('site_pages')
      .update({ is_published: nextPublishedState })
      .eq('id', pageId);

    if (!error) {
      setPages(pages.map(p =>
        p.id === pageId ? { ...p, is_published: nextPublishedState } : p
      ));
      toast.success(nextPublishedState ? 'Pagina pubblicata' : 'Pagina riportata in bozza');
    } else {
      toast.error(error.message || 'Errore pubblicazione pagina');
    }
    setPublishingPageId(null);
  };

  const buildDuplicateSlug = useCallback((originalSlug: string) => {
    const base = `${originalSlug}-copia`;
    if (!pages.some((page) => page.slug === base)) {
      return base;
    }

    let index = 2;
    while (pages.some((page) => page.slug === `${base}-${index}`)) {
      index += 1;
    }

    return `${base}-${index}`;
  }, [pages]);

  const getPublicPagePath = useCallback((page: Pick<SitePage, 'slug'>) => {
    const tenantSlug = currentTenant?.slug || 'slug';
    return page.slug === 'homepage'
      ? `/site/${tenantSlug}`
      : `/site/${tenantSlug}/${page.slug}`;
  }, [currentTenant?.slug]);

  const handlePreviewPage = useCallback(async (page: SitePage) => {
    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!previewWindow) {
      toast.error('Consenti i popup per aprire l’anteprima');
      return;
    }

    setPreviewingPageId(page.id);

    try {
      if (page.is_published) {
        previewWindow.location.href = `${getPublicPagePath(page)}?preview=${Date.now()}`;
        return;
      }

      const response = await fetch(`/api/export/${page.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Anteprima non disponibile');
      }

      const body = typeof payload?.html === 'string'
        ? payload.html
        : '<div style="padding:40px;font:14px system-ui,sans-serif;color:#64748b">Nessun contenuto da mostrare.</div>';

      const documentHtml = `<!DOCTYPE html>
        <html lang="it">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style="margin:0">${body}</body>
        </html>`;

      const blob = new Blob([documentHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      previewWindow.location.href = blobUrl;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      previewWindow.close();
      toast.error(error instanceof Error ? error.message : 'Errore anteprima pagina');
    } finally {
      setPreviewingPageId(null);
    }
  }, [getPublicPagePath]);

  const handleCopyPageUrl = useCallback(async (page: SitePage) => {
    const publicUrl = `${window.location.origin}${getPublicPagePath(page)}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('URL pagina copiato');
    } catch {
      toast.error('Copia URL non riuscita');
    }
  }, [getPublicPagePath]);

  const handleDuplicatePage = useCallback(async (page: SitePage) => {
    if (!currentTenant) return;

    setDuplicatingPageId(page.id);
    const supabase = createClient();

    try {
      const { data: sourcePage, error: sourceError } = await supabase
        .from('site_pages')
        .select('title, slug, page_type, meta, blocks, custom_css, sort_order')
        .eq('id', page.id)
        .single();

      if (sourceError || !sourcePage) {
        throw new Error(sourceError?.message || 'Pagina sorgente non trovata');
      }

      const duplicateSlug = buildDuplicateSlug(sourcePage.slug);
      const duplicateTitle = `${sourcePage.title} copia`;

      const { error: insertError } = await supabase
        .from('site_pages')
        .insert({
          tenant_id: currentTenant.id,
          title: duplicateTitle,
          slug: duplicateSlug,
          page_type: sourcePage.page_type || 'custom',
          meta: sourcePage.meta || {},
          blocks: sourcePage.blocks || [],
          custom_css: sourcePage.custom_css || '',
          is_published: false,
          sort_order: (sourcePage.sort_order || 0) + 1,
        });

      if (insertError) {
        throw new Error(insertError.message || 'Duplicazione non riuscita');
      }

      toast.success('Pagina duplicata');
      await loadPages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore duplicazione pagina');
    } finally {
      setDuplicatingPageId(null);
    }
  }, [buildDuplicateSlug, currentTenant, loadPages]);

  const statusColors = {
    draft: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
    published: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  };

  const normalizedPreviewSlug = newPageSlug || 'slug';
  const pagePreviewPath = normalizedPreviewSlug === 'homepage'
    ? `/site/${currentTenant?.slug || 'slug'}`
    : `/site/${currentTenant?.slug || 'slug'}/${normalizedPreviewSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-0)' }}>
            Pagine Sito
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>
            Gestisci tutte le pagine del sito
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "page-plan",
                label: "Piano pagine",
                prompt: "Analizza l'albero pagine, gli slug, i meta e lo stato di pubblicazione. Suggerisci struttura, pagine mancanti, SEO e contenuti istituzionali da creare o rifinire: {context}",
              },
              {
                id: "page-seo-audit",
                label: "Audit SEO pagine",
                prompt: "Controlla pagine, slug, meta title, meta description, canonical e rischi di contenuto debole o duplicato. Restituisci una checklist operativa: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                pages,
                draftPage: {
                  title: newPageTitle,
                  slug: newPageSlug,
                  metaTitle: newPageMetaTitle,
                  metaDescription: newPageMetaDescription,
                  ogTitle: newPageOgTitle,
                  ogDescription: newPageOgDescription,
                },
              },
              null,
              2,
            )}
          />
          <button
            onClick={() => setShowNewPage(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition"
            style={{ background: 'var(--c-accent)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Plus className="w-5 h-5" /> Nuova Pagina
          </button>
        </div>
      </div>

      {/* New Page Modal */}
      {showNewPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--c-text-0)' }}>
              Crea Nuova Pagina
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                  Titolo Pagina *
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Es: Chi Siamo, Team, Contatti..."
                  className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                  style={{
                    background: 'var(--c-bg-0)',
                    borderColor: 'var(--c-border)',
                    color: 'var(--c-text-0)',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--c-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--c-border)'}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setNewPageSlug(slugifyPageTitle(e.target.value));
                  }}
                  placeholder="es: chi-siamo, team, contatti..."
                  className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                  style={{
                    background: 'var(--c-bg-0)',
                    borderColor: 'var(--c-border)',
                    color: 'var(--c-text-0)',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--c-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--c-border)'}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>
                  URL: {pagePreviewPath}
                </p>
              </div>

              <div className="border rounded-xl p-4 space-y-4" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    SEO Default
                  </h3>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>
                    Vengono precompilati dal titolo ma restano modificabili a mano.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={newPageMetaTitle}
                    onChange={(e) => {
                      setMetaTitleManual(true);
                      setNewPageMetaTitle(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'var(--c-bg-1)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                    Meta Description
                  </label>
                  <textarea
                    value={newPageMetaDescription}
                    onChange={(e) => {
                      setMetaDescriptionManual(true);
                      setNewPageMetaDescription(e.target.value);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'var(--c-bg-1)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                    Open Graph Title
                  </label>
                  <input
                    type="text"
                    value={newPageOgTitle}
                    onChange={(e) => {
                      setOgTitleManual(true);
                      setNewPageOgTitle(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'var(--c-bg-1)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                    Open Graph Description
                  </label>
                  <textarea
                    value={newPageOgDescription}
                    onChange={(e) => {
                      setOgDescriptionManual(true);
                      setNewPageOgDescription(e.target.value);
                    }}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'var(--c-bg-1)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewPage(false)}
                className="flex-1 px-4 py-2 rounded-lg border transition"
                style={{
                  borderColor: 'var(--c-border)',
                  color: 'var(--c-text-1)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Annulla
              </button>
              <button
                onClick={handleCreatePage}
                disabled={!newPageTitle.trim() || creating}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50"
                style={{ background: 'var(--c-accent)' }}
                onMouseEnter={(e) => !creating && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => !creating && (e.currentTarget.style.opacity = '1')}
              >
                {creating ? 'Creando...' : 'Crea Pagina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="rounded-xl overflow-hidden border" style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--c-text-2)' }}>
            Caricamento pagine...
          </div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--c-text-2)' }}>
            Nessuna pagina. Creane una per iniziare!
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--c-border)' }}>
            {pages.map((page) => (
              <div
                key={page.id}
                className="p-4 flex items-center justify-between hover:bg-opacity-50 transition"
                style={{ paddingLeft: `${page.depth * 20 + 16}px` }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium" style={{ color: 'var(--c-text-0)' }}>
                    {page.depth > 0 && <span style={{ color: 'var(--c-text-2)' }}>└ </span>}
                    {page.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-3 h-3" style={{ color: 'var(--c-text-2)' }} />
                    <p className="text-sm font-mono" style={{ color: 'var(--c-text-2)' }}>
                      {page.path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded"
                      style={{
                        background: page.is_published ? statusColors.published.bg : statusColors.draft.bg,
                        color: page.is_published ? statusColors.published.text : statusColors.draft.text,
                      }}
                    >
                      {page.is_published ? 'Online' : 'Bozza'}
                    </span>
                    <Clock className="w-3 h-3" style={{ color: 'var(--c-text-3)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>
                      {new Date(page.updated_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Edit Button */}
                  <Link
                    href={`/dashboard/importa-sito?page=${page.id}`}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-accent)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Apri bridge desktop"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {/* Preview Button */}
                  <button
                    onClick={() => void handlePreviewPage(page)}
                    disabled={previewingPageId === page.id}
                    className="p-2 rounded-lg transition disabled:opacity-60"
                    style={{
                      color: 'var(--c-accent)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Anteprima pagina"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Duplicate Button */}
                  <button
                    onClick={() => void handleDuplicatePage(page)}
                    disabled={duplicatingPageId === page.id}
                    className="p-2 rounded-lg transition disabled:opacity-60"
                    style={{
                      color: 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Duplica pagina"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Open Live Button */}
                  <a
                    href={page.is_published ? getPublicPagePath(page) : undefined}
                    target={page.is_published ? '_blank' : undefined}
                    rel={page.is_published ? 'noreferrer' : undefined}
                    aria-disabled={!page.is_published}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: page.is_published ? 'var(--c-accent)' : 'var(--c-text-3)',
                      background: 'transparent',
                      pointerEvents: page.is_published ? 'auto' : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={page.is_published ? 'Apri pagina online' : 'Pubblica la pagina per aprirla online'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Layout Button */}
                  <Link
                    href={`/dashboard/importa-sito?page=${page.id}`}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Apri bridge desktop"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                  </Link>

                  {/* SEO Button */}
                  <Link
                    href="/dashboard/seo"
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Apri SEO"
                  >
                    <Search className="w-4 h-4" />
                  </Link>

                  {/* Copy URL Button */}
                  <button
                    onClick={() => void handleCopyPageUrl(page)}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Copia URL pagina"
                  >
                    <Globe className="w-4 h-4" />
                  </button>

                  {/* Publish Toggle */}
                  <button
                    onClick={() => togglePublish(page.id, page.is_published)}
                    disabled={publishingPageId === page.id}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: page.is_published ? 'var(--c-accent)' : 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={page.is_published ? 'Nascondi' : 'Pubblica'}
                  >
                    {page.is_published ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    disabled={deletingPageId === page.id}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--c-text-2)';
                    }}
                    title="Elimina pagina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
