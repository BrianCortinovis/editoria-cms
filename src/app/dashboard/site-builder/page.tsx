'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Plus, FileText, Globe, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import Link from 'next/link';

interface SitePage {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  article: 'Articolo',
  category: 'Categoria',
  tag: 'Tag',
  author: 'Autore',
  search: 'Ricerca',
  contact: 'Contatti',
  about: 'Chi Siamo',
  events: 'Eventi',
  custom: 'Personalizzata',
};

export default function SiteBuilderPage() {
  const { currentTenant } = useAuthStore();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('custom');

  useEffect(() => {
    if (!currentTenant) return;
    loadPages();
  }, [currentTenant]);

  async function loadPages() {
    if (!currentTenant) return;
    setLoading(true);
    const res = await fetch(`/api/builder/pages?tenant_id=${currentTenant.id}`);
    const data = await res.json();
    setPages(data.pages || []);
    setLoading(false);
  }

  async function createPage() {
    if (!currentTenant || !newTitle || !newSlug) return;
    const res = await fetch('/api/builder/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        title: newTitle,
        slug: newSlug,
        page_type: newType,
      }),
    });
    if (res.ok) {
      setShowNewForm(false);
      setNewTitle('');
      setNewSlug('');
      setNewType('custom');
      loadPages();
    }
  }

  async function deletePage(id: string) {
    if (!confirm('Eliminare questa pagina?')) return;
    await fetch(`/api/builder/pages/${id}`, { method: 'DELETE' });
    loadPages();
  }

  async function togglePublish(page: SitePage) {
    await fetch(`/api/builder/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !page.is_published }),
    });
    loadPages();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Site Builder</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Costruisci e gestisci le pagine del sito della testata
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={16} />
          Nuova Pagina
        </button>
      </div>

      {/* New page form */}
      {showNewForm && (
        <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <h3 className="font-semibold mb-3 text-[var(--foreground)]">Nuova Pagina</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
              }}
              placeholder="Titolo pagina"
              className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="slug-pagina"
              className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            >
              {Object.entries(PAGE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={createPage}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:opacity-90"
            >
              Crea
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--foreground)] hover:bg-[var(--border)]"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Pages list */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Caricamento...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <Globe size={48} className="mx-auto mb-4 text-[var(--muted)]" />
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Nessuna pagina</h3>
          <p className="text-[var(--muted)] mb-4">Crea la tua prima pagina per iniziare a costruire il sito</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Crea Homepage
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition group"
            >
              <GripVertical size={16} className="text-[var(--muted)] opacity-0 group-hover:opacity-100 cursor-grab" />
              <FileText size={18} className="text-[var(--accent)]" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/site-builder/${page.id}`}
                  className="font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition"
                >
                  {page.title}
                </Link>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)] mt-0.5">
                  <span>/{page.slug}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)]">
                    {PAGE_TYPE_LABELS[page.page_type] || page.page_type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePublish(page)}
                  className={`p-2 rounded hover:bg-[var(--border)] transition ${page.is_published ? 'text-green-500' : 'text-[var(--muted)]'}`}
                  title={page.is_published ? 'Pubblicata' : 'Bozza'}
                >
                  {page.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <Link
                  href={`/dashboard/site-builder/${page.id}`}
                  className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90 transition"
                >
                  Modifica
                </Link>
                <button
                  onClick={() => deletePage(page.id)}
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
