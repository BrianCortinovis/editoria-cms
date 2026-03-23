'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Clock,
} from 'lucide-react';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  parent_id: null;
  path: string;
  depth: 0;
  seo_slug: string;
  breadcrumb: Array<{ title: string; slug: string }>;
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
  const [creating, setCreating] = useState(false);

  const loadPages = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_pages')
      .select('id, title, slug, is_published, sort_order, created_at, updated_at')
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

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageSlug.trim() || !currentTenant) return;

    setCreating(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('site_pages')
      .insert({
        tenant_id: currentTenant.id,
        title: newPageTitle,
        slug: newPageSlug,
        page_type: newPageSlug === 'homepage' ? 'homepage' : 'custom',
        is_published: false,
        blocks: [],
        sort_order: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setLoading(true);
      await loadPages();
      setNewPageTitle('');
      setNewPageSlug('');
      setShowNewPage(false);
    }
    setCreating(false);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Eliminare questa pagina?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('site_pages')
      .delete()
      .eq('id', pageId);

    if (!error) {
      setLoading(true);
      await loadPages();
    }
  };

  const togglePublish = async (pageId: string, isPublished: boolean) => {
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
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-0)' }}>
            Pagine Sito
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>
            Gestisci tutte le pagine del sito
          </p>
        </div>
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
                  onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
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
                disabled={!newPageTitle.trim() || !newPageSlug.trim() || creating}
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
                    href={`/dashboard/editor?page=${page.id}`}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: 'var(--c-accent)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Modifica pagina"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {/* Publish Toggle */}
                  <button
                    onClick={() => togglePublish(page.id, page.is_published)}
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
