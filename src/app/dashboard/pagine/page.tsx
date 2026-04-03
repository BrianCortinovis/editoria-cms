'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { buildCanonicalPathFromSlug, buildDefaultPageMeta, derivePageDescription, slugifyPageTitle } from '@/lib/pages/page-seo';
import { SeoSerpPreview } from '@/components/seo/SeoSerpPreview';
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
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import AIButton from '@/components/ai/AIButton';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  path: string;
  depth: number;
  seo_slug: string;
  breadcrumb: Array<{ title: string; slug: string }>;
  page_type?: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: SitePage[];
}

interface PageSeoModalState {
  pageId: string;
  pageTitle: string;
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
  schemaType: string;
  noindex: boolean;
  nofollow: boolean;
}

function createPageSeoModalState(page: SitePage, meta: Record<string, unknown> = {}): PageSeoModalState {
  const normalizedMeta = buildDefaultPageMeta({
    title: page.title,
    slug: page.slug,
    currentMeta: meta,
  });

  return {
    pageId: page.id,
    pageTitle: page.title,
    pagePath: page.path,
    metaTitle: typeof normalizedMeta.title === 'string' ? normalizedMeta.title : page.title,
    metaDescription: typeof normalizedMeta.description === 'string' ? normalizedMeta.description : '',
    canonicalPath: typeof normalizedMeta.canonicalPath === 'string' ? normalizedMeta.canonicalPath : page.path,
    focusKeyword: typeof normalizedMeta.focusKeyword === 'string' ? normalizedMeta.focusKeyword : page.title,
    ogTitle: typeof normalizedMeta.ogTitle === 'string' ? normalizedMeta.ogTitle : page.title,
    ogDescription: typeof normalizedMeta.ogDescription === 'string' ? normalizedMeta.ogDescription : '',
    schemaType: typeof normalizedMeta.schemaType === 'string' ? normalizedMeta.schemaType : 'WebPage',
    noindex: Boolean(normalizedMeta.noindex),
    nofollow: Boolean(normalizedMeta.nofollow),
  };
}

function buildPageTree(flatPages: SitePage[]): SitePage[] {
  const map = new Map<string, SitePage>();
  for (const page of flatPages) {
    map.set(page.id, { ...page, children: [] });
  }

  const roots: SitePage[] = [];
  for (const page of map.values()) {
    if (page.parent_id && map.has(page.parent_id)) {
      map.get(page.parent_id)!.children!.push(page);
    } else {
      roots.push(page);
    }
  }

  const setDepthAndPath = (nodes: SitePage[], parentPath: string, depth: number) => {
    for (const node of nodes) {
      node.depth = depth;
      node.path = parentPath === '/' ? `/${node.slug}` : `${parentPath}/${node.slug}`;
      node.breadcrumb = depth === 0
        ? [{ title: node.title, slug: node.slug }]
        : [...(map.get(node.parent_id!)?.breadcrumb || []), { title: node.title, slug: node.slug }];
      if (node.children && node.children.length > 0) {
        setDepthAndPath(node.children, node.path, depth + 1);
      }
    }
  };

  setDepthAndPath(roots, '', 0);
  return roots;
}

function flattenTree(nodes: SitePage[]): SitePage[] {
  const result: SitePage[] = [];
  const walk = (list: SitePage[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return result;
}

export default function PaginePage() {
  const { currentTenant } = useAuthStore();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [pageTree, setPageTree] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
  const [newPageMetaTitle, setNewPageMetaTitle] = useState('');
  const [newPageMetaDescription, setNewPageMetaDescription] = useState('');
  const [newPageCanonicalPath, setNewPageCanonicalPath] = useState('');
  const [newPageFocusKeyword, setNewPageFocusKeyword] = useState('');
  const [newPageOgTitle, setNewPageOgTitle] = useState('');
  const [newPageOgDescription, setNewPageOgDescription] = useState('');
  const [newPageSchemaType, setNewPageSchemaType] = useState('WebPage');
  const [newPageNoindex, setNewPageNoindex] = useState(false);
  const [newPageNofollow, setNewPageNofollow] = useState(false);
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
  const [pageSeoModal, setPageSeoModal] = useState<PageSeoModalState | null>(null);
  const [savingSeoPageId, setSavingSeoPageId] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    if (!currentTenant) {
      setPages([]);
      setPageTree([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_pages')
      .select('id, title, slug, parent_id, page_type, is_published, sort_order, created_at, updated_at')
      .eq('tenant_id', currentTenant.id)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (!error && data) {
      const flat = data.map((page) => ({
        ...page,
        parent_id: (page as unknown as { parent_id: string | null }).parent_id ?? null,
        path: `/${page.slug}`,
        depth: 0,
        seo_slug: page.slug,
        breadcrumb: [{ title: page.title, slug: page.slug }],
      }));
      const tree = buildPageTree(flat);
      setPageTree(tree);
      setPages(flattenTree(tree));
      // Auto-expand pages that have children
      const withChildren = new Set<string>();
      for (const p of flat) {
        if (flat.some((c) => c.parent_id === p.id)) {
          withChildren.add(p.id);
        }
      }
      setExpandedIds((prev) => new Set([...prev, ...withChildren]));
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
      setNewPageCanonicalPath(buildCanonicalPathFromSlug(suggestedSlug));
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
    if (!newPageFocusKeyword.trim()) {
      setNewPageFocusKeyword(title);
    }
  }, [
    metaDescriptionManual,
    metaTitleManual,
    newPageFocusKeyword,
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
        canonicalPath: newPageCanonicalPath || buildCanonicalPathFromSlug(newPageSlug),
        focusKeyword: newPageFocusKeyword.trim() || newPageTitle.trim(),
        ogTitle: newPageOgTitle,
        ogDescription: newPageOgDescription,
        schemaType: newPageSchemaType,
        noindex: newPageNoindex,
        nofollow: newPageNofollow,
      },
    });

    const { data, error } = await supabase
      .from('site_pages')
      .insert({
        tenant_id: currentTenant.id,
        title: newPageTitle,
        slug: newPageSlug,
        parent_id: newPageParentId,
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
      setNewPageParentId(null);
      setNewPageMetaTitle('');
      setNewPageMetaDescription('');
      setNewPageCanonicalPath('');
      setNewPageFocusKeyword('');
      setNewPageOgTitle('');
      setNewPageOgDescription('');
      setNewPageSchemaType('WebPage');
      setNewPageNoindex(false);
      setNewPageNofollow(false);
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

  const getPublicPagePath = useCallback((page: Pick<SitePage, 'slug' | 'path'>) => {
    const tenantSlug = currentTenant?.slug || 'slug';
    return page.slug === 'homepage'
      ? `/site/${tenantSlug}`
      : `/site/${tenantSlug}${page.path.startsWith('/') ? page.path : `/${page.path}`}`;
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

  const openPageSeoModal = useCallback(async (page: SitePage) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('meta')
        .eq('id', page.id)
        .single();

      if (error) {
        throw new Error(error.message || 'SEO pagina non disponibile');
      }

      setPageSeoModal(createPageSeoModalState(page, (data?.meta || {}) as Record<string, unknown>));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore apertura SEO pagina');
    }
  }, []);

  const handleSavePageSeo = useCallback(async () => {
    if (!pageSeoModal) {
      return;
    }

    setSavingSeoPageId(pageSeoModal.pageId);
    try {
      const response = await fetch(`/api/builder/pages/${pageSeoModal.pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: {
            title: pageSeoModal.metaTitle.trim(),
            description: pageSeoModal.metaDescription.trim(),
            canonicalPath: pageSeoModal.canonicalPath.trim() || pageSeoModal.pagePath,
            focusKeyword: pageSeoModal.focusKeyword.trim(),
            ogTitle: pageSeoModal.ogTitle.trim(),
            ogDescription: pageSeoModal.ogDescription.trim(),
            schemaType: pageSeoModal.schemaType.trim() || 'WebPage',
            noindex: pageSeoModal.noindex,
            nofollow: pageSeoModal.nofollow,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Salvataggio SEO non riuscito');
      }

      toast.success('SEO pagina aggiornata');
      setPageSeoModal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore salvataggio SEO pagina');
    } finally {
      setSavingSeoPageId(null);
    }
  }, [pageSeoModal]);

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
                    const nextSlug = slugifyPageTitle(e.target.value);
                    setNewPageSlug(nextSlug);
                    setNewPageCanonicalPath(buildCanonicalPathFromSlug(nextSlug));
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

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                  Pagina Padre
                </label>
                <select
                  value={newPageParentId || ''}
                  onChange={(e) => setNewPageParentId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                  style={{
                    background: 'var(--c-bg-0)',
                    borderColor: 'var(--c-border)',
                    color: 'var(--c-text-0)',
                  }}
                >
                  <option value="">Nessuna (pagina principale)</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {'—'.repeat(p.depth)} {p.title}
                    </option>
                  ))}
                </select>
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

                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                    Canonical Path
                  </label>
                  <input
                    type="text"
                    value={newPageCanonicalPath}
                    onChange={(e) => setNewPageCanonicalPath(e.target.value)}
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
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={newPageFocusKeyword}
                    onChange={(e) => setNewPageFocusKeyword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'var(--c-bg-1)',
                      borderColor: 'var(--c-border)',
                      color: 'var(--c-text-0)',
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                      Schema Type
                    </label>
                    <select
                      value={newPageSchemaType}
                      onChange={(e) => setNewPageSchemaType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border transition focus:outline-none"
                      style={{
                        background: 'var(--c-bg-1)',
                        borderColor: 'var(--c-border)',
                        color: 'var(--c-text-0)',
                      }}
                    >
                      <option value="WebPage">WebPage</option>
                      <option value="CollectionPage">CollectionPage</option>
                      <option value="AboutPage">AboutPage</option>
                      <option value="ContactPage">ContactPage</option>
                      <option value="NewsMediaOrganization">NewsMediaOrganization</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-3 pb-1">
                    <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                      <input type="checkbox" checked={newPageNoindex} onChange={(e) => setNewPageNoindex(e.target.checked)} />
                      Noindex
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                      <input type="checkbox" checked={newPageNofollow} onChange={(e) => setNewPageNofollow(e.target.checked)} />
                      Nofollow
                    </label>
                  </div>
                </div>

                <SeoSerpPreview
                  title={newPageMetaTitle || newPageTitle || 'Titolo pagina'}
                  description={newPageMetaDescription}
                  url={newPageCanonicalPath || pagePreviewPath}
                />
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

      {/* Pages Tree */}
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
          <div>
            <PageTreeNodes nodes={pageTree} />
          </div>
        )}
      </div>

      {pageSeoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div
            className="w-full max-w-3xl rounded-3xl border p-5 shadow-2xl"
            style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--c-text-2)' }}>
                  SEO Pagina
                </p>
                <h3 className="mt-2 text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  {pageSeoModal.pageTitle}
                </h3>
                <p className="mt-1 text-xs font-mono" style={{ color: 'var(--c-text-3)' }}>
                  {pageSeoModal.pagePath}
                </p>
              </div>
              <button
                onClick={() => setPageSeoModal(null)}
                className="rounded-full px-3 py-1.5 text-sm"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
              >
                Chiudi
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Meta Title</label>
                <input
                  type="text"
                  value={pageSeoModal.metaTitle}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, metaTitle: e.target.value } : current)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Canonical Path</label>
                <input
                  type="text"
                  value={pageSeoModal.canonicalPath}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, canonicalPath: e.target.value } : current)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Meta Description</label>
                <textarea
                  value={pageSeoModal.metaDescription}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, metaDescription: e.target.value } : current)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border resize-none"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Focus Keyword</label>
                <input
                  type="text"
                  value={pageSeoModal.focusKeyword}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, focusKeyword: e.target.value } : current)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Schema Type</label>
                <select
                  value={pageSeoModal.schemaType}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, schemaType: e.target.value } : current)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}
                >
                  <option value="WebPage">WebPage</option>
                  <option value="CollectionPage">CollectionPage</option>
                  <option value="AboutPage">AboutPage</option>
                  <option value="ContactPage">ContactPage</option>
                  <option value="NewsMediaOrganization">NewsMediaOrganization</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Open Graph Title</label>
                <input
                  type="text"
                  value={pageSeoModal.ogTitle}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, ogTitle: e.target.value } : current)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>Open Graph Description</label>
                <textarea
                  value={pageSeoModal.ogDescription}
                  onChange={(e) => setPageSeoModal((current) => current ? { ...current, ogDescription: e.target.value } : current)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border resize-none"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                  <input
                    type="checkbox"
                    checked={pageSeoModal.noindex}
                    onChange={(e) => setPageSeoModal((current) => current ? { ...current, noindex: e.target.checked } : current)}
                  />
                  Noindex
                </label>
                <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                  <input
                    type="checkbox"
                    checked={pageSeoModal.nofollow}
                    onChange={(e) => setPageSeoModal((current) => current ? { ...current, nofollow: e.target.checked } : current)}
                  />
                  Nofollow
                </label>
              </div>
              <div className="md:col-span-2">
                <SeoSerpPreview
                  title={pageSeoModal.metaTitle || pageSeoModal.pageTitle}
                  description={pageSeoModal.metaDescription}
                  url={pageSeoModal.canonicalPath || pageSeoModal.pagePath}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPageSeoModal(null)}
                className="rounded-xl px-4 py-2 text-sm"
                style={{ border: '1px solid var(--c-border)', color: 'var(--c-text-1)' }}
              >
                Annulla
              </button>
              <button
                onClick={() => void handleSavePageSeo()}
                disabled={savingSeoPageId === pageSeoModal.pageId}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--c-accent)' }}
              >
                {savingSeoPageId === pageSeoModal.pageId ? 'Salvataggio...' : 'Salva SEO'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  function PageTreeNodes({ nodes }: { nodes: SitePage[] }) {
    return (
      <>
        {nodes.map((page) => {
          const hasChildren = page.children && page.children.length > 0;
          const isExpanded = expandedIds.has(page.id);

          return (
            <div key={page.id}>
              <div
                className="flex items-center justify-between transition border-b"
                style={{ paddingLeft: `${page.depth * 24 + 16}px`, borderColor: 'var(--c-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex-1 min-w-0 py-3 flex items-start gap-2">
                  {/* Expand/Collapse toggle */}
                  {hasChildren ? (
                    <button
                      onClick={() => setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(page.id)) next.delete(page.id);
                        else next.add(page.id);
                        return next;
                      })}
                      className="mt-0.5 p-0.5 rounded hover:bg-[var(--c-bg-2)] transition shrink-0"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--c-text-2)' }} />
                        : <ChevronRight className="w-4 h-4" style={{ color: 'var(--c-text-2)' }} />
                      }
                    </button>
                  ) : (
                    <div className="w-5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium flex items-center gap-2" style={{ color: 'var(--c-text-0)' }}>
                      {page.title}
                      {hasChildren && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                          {page.children!.length}
                        </span>
                      )}
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
                </div>

                <div className="flex items-center gap-1 ml-4 pr-4">
                  <Link
                    href={`/dashboard/importa-sito?page=${page.id}`}
                    className="p-2 rounded-lg transition"
                    style={{ color: 'var(--c-accent)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Modifica"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => void handlePreviewPage(page)}
                    disabled={previewingPageId === page.id}
                    className="p-2 rounded-lg transition disabled:opacity-60"
                    style={{ color: 'var(--c-accent)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Anteprima"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleDuplicatePage(page)}
                    disabled={duplicatingPageId === page.id}
                    className="p-2 rounded-lg transition disabled:opacity-60"
                    style={{ color: 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Duplica"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
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
                    title={page.is_published ? 'Apri online' : 'Non pubblicata'}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/dashboard/importa-sito?page=${page.id}`}
                    className="p-2 rounded-lg transition"
                    style={{ color: 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Layout"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => void openPageSeoModal(page)}
                    className="p-2 rounded-lg transition"
                    style={{ color: 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="SEO"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void handleCopyPageUrl(page)}
                    className="p-2 rounded-lg transition"
                    style={{ color: 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Copia URL"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePublish(page.id, page.is_published)}
                    disabled={publishingPageId === page.id}
                    className="p-2 rounded-lg transition"
                    style={{ color: page.is_published ? 'var(--c-accent)' : 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={page.is_published ? 'Nascondi' : 'Pubblica'}
                  >
                    {page.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    disabled={deletingPageId === page.id}
                    className="p-2 rounded-lg transition"
                    style={{ color: 'var(--c-text-2)', background: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--c-text-2)';
                    }}
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <PageTreeNodes nodes={page.children!} />
              )}
            </div>
          );
        })}
      </>
    );
  }
}
