'use client';

import { useEffect, useState } from 'react';
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
  MoreVertical,
} from 'lucide-react';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  path: string;
  depth: number;
  seo_slug: string;
  breadcrumb: Array<{ title: string; slug: string }>;
  status: 'draft' | 'published' | 'archived';
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
  const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Load pages
  useEffect(() => {
    if (!currentTenant) return;
    loadPages();
  }, [currentTenant]);

  const loadPages = async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('page_hierarchy_view')
      .select('id, title, slug, parent_id, path, depth, seo_slug, breadcrumb, status, sort_order, created_at, updated_at')
      .eq('tenant_id', currentTenant.id)
      .order('parent_id', { ascending: true })
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setPages(data);
    }
    setLoading(false);
  };

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
        parent_id: newPageParentId,
        status: 'draft',
        blocks: [],
        sort_order: 0,
      })
      .select()
      .single();

    if (!error && data) {
      await loadPages();
      setNewPageTitle('');
      setNewPageSlug('');
      setNewPageParentId(null);
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
      setPages(pages.filter(p => p.id !== pageId));
    }
  };

  const togglePublish = async (pageId: string, currentStatus: string) => {
    const supabase = createClient();
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';

    const { error } = await supabase
      .from('site_pages')
      .update({ status: newStatus })
      .eq('id', pageId);

    if (!error) {
      setPages(pages.map(p =>
        p.id === pageId ? { ...p, status: newStatus as any } : p
      ));
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
    published: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
    archived: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  };

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
                  URL: /{currentTenant?.slug || 'slug'}/{newPageParentId ? pages.find(p => p.id === newPageParentId)?.slug + '/' : ''}{newPageSlug || 'slug'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--c-text-1)' }}>
                  Pagina Genitrice (opzionale)
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
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--c-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--c-border)'}
                >
                  <option value="">Nessuna (pagina root)</option>
                  {pages
                    .filter(p => p.id !== newPageParentId && p.depth < 3)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {'  '.repeat(p.depth)} {p.title}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>
                  Max 3 livelli di profondità per SEO
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
                        background: statusColors[page.status].bg,
                        color: statusColors[page.status].text,
                      }}
                    >
                      {page.status === 'published' ? 'Online' : page.status === 'draft' ? 'Bozza' : 'Archiviata'}
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
                    onClick={() => togglePublish(page.id, page.status)}
                    className="p-2 rounded-lg transition"
                    style={{
                      color: page.status === 'published' ? 'var(--c-accent)' : 'var(--c-text-2)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-bg-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    title={page.status === 'published' ? 'Nascondi' : 'Pubblica'}
                  >
                    {page.status === 'published' ? (
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
