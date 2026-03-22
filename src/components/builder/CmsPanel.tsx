'use client';

import { useState, useEffect } from 'react';
import {
  Database, Link2, CheckCircle2, XCircle, Loader2, RefreshCw,
  Newspaper, Tag, Image, Calendar, Megaphone, AlertTriangle,
  Globe, Zap, ChevronDown, ChevronRight, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageStore } from '@/lib/stores/page-store';
import { createBlock, type BlockType } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils/cn';
import '@/lib/blocks/init';

interface CmsConnection {
  url: string;
  tenant: string;
  connected: boolean;
  tenantName?: string;
}

interface CmsData {
  articles: CmsArticlePreview[];
  categories: CmsCategoryPreview[];
  banners: CmsBannerPreview[];
  breakingNews: CmsBreakingPreview[];
  events: CmsEventPreview[];
}

interface CmsArticlePreview { id: string; title: string; slug: string; summary: string | null; cover_image_url: string | null; published_at: string | null; categories: { name: string; slug: string } | null; }
interface CmsCategoryPreview { id: string; name: string; slug: string; color: string | null; }
interface CmsBannerPreview { id: string; name: string; position: string; type: string; }
interface CmsBreakingPreview { id: string; text: string; }
interface CmsEventPreview { id: string; title: string; starts_at: string; location: string | null; }

export function CmsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBlock } = usePageStore();
  const [connection, setConnection] = useState<CmsConnection>({
    url: 'http://localhost:3001',
    tenant: '',
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CmsData | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>('articles');
  const [error, setError] = useState<string | null>(null);

  const fetchCmsData = async (endpoint: string, params: Record<string, string> = {}) => {
    const url = new URL('/api/cms/proxy', window.location.origin);
    url.searchParams.set('endpoint', endpoint);
    url.searchParams.set('cmsUrl', connection.url);
    url.searchParams.set('tenant', connection.tenant);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Errore ${res.status}`);
    return res.json();
  };

  const testConnection = async () => {
    if (!connection.url || !connection.tenant) return;
    setLoading(true);
    setError(null);

    try {
      const tenantData = await fetchCmsData('tenant');
      setConnection(c => ({ ...c, connected: true, tenantName: tenantData.tenant?.name }));

      // Fetch all data
      const [articles, categories, banners, breaking, events] = await Promise.allSettled([
        fetchCmsData('articles', { limit: '20' }),
        fetchCmsData('categories'),
        fetchCmsData('banners'),
        fetchCmsData('breaking-news'),
        fetchCmsData('events', { limit: '10' }),
      ]);

      setData({
        articles: articles.status === 'fulfilled' ? articles.value.articles || [] : [],
        categories: categories.status === 'fulfilled' ? categories.value.categories || [] : [],
        banners: banners.status === 'fulfilled' ? banners.value.banners || [] : [],
        breakingNews: breaking.status === 'fulfilled' ? breaking.value.breaking_news || [] : [],
        events: events.status === 'fulfilled' ? events.value.events || [] : [],
      });
    } catch (err) {
      setError((err as Error).message);
      setConnection(c => ({ ...c, connected: false }));
    } finally {
      setLoading(false);
    }
  };

  // Add article as text block with real content
  const addArticleBlock = (article: CmsArticlePreview) => {
    const def = getBlockDefinition('text');
    if (!def) return;
    const block = createBlock('text', article.title, {
      ...def.defaultProps,
      content: `<h2>${article.title}</h2>${article.summary ? `<p class="lead">${article.summary}</p>` : ''}<p><small>${article.categories?.name || ''} · ${article.published_at ? new Date(article.published_at).toLocaleDateString('it') : ''}</small></p>`,
      dropCap: true,
    }, def.defaultStyle);
    block.id = generateId();
    addBlock(block);
  };

  // Add articles grid as related-content block
  const addArticlesGrid = (articles: CmsArticlePreview[], title: string = 'Ultime Notizie') => {
    const def = getBlockDefinition('related-content');
    if (!def) return;
    const block = createBlock('related-content', title, {
      ...def.defaultProps,
      title,
      columns: Math.min(articles.length, 3),
      items: articles.slice(0, 6).map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.summary || '',
        image: a.cover_image_url || '',
        url: `/articolo/${a.slug}`,
        date: a.published_at || '',
      })),
    }, def.defaultStyle);
    block.id = generateId();
    addBlock(block);
  };

  // Add breaking news as hero
  const addBreakingBlock = (news: CmsBreakingPreview[]) => {
    const def = getBlockDefinition('hero');
    if (!def) return;
    const block = createBlock('hero', 'ULTIM\'ORA', {
      ...def.defaultProps,
      title: 'ULTIM\'ORA',
      subtitle: news.map(n => n.text).join(' | '),
      ctaText: 'Aggiornamenti',
      overlayColor: '#b71c1c',
      overlayOpacity: 0.8,
    }, { ...def.defaultStyle, background: { type: 'color', value: '#1a1a2e' } });
    block.id = generateId();
    addBlock(block);
  };

  // Add banner block
  const addBannerBlock = (banner: CmsBannerPreview) => {
    const def = getBlockDefinition('banner-ad');
    if (!def) return;
    const block = createBlock('banner-ad', banner.name, {
      ...def.defaultProps,
      format: banner.position,
      label: banner.name,
    }, def.defaultStyle);
    block.id = generateId();
    addBlock(block);
  };

  // Add navigation with categories
  const addNavWithCategories = (categories: CmsCategoryPreview[]) => {
    const def = getBlockDefinition('navigation');
    if (!def) return;
    const block = createBlock('navigation', 'Nav CMS', {
      ...def.defaultProps,
      logo: { type: 'text', value: connection.tenantName || 'Testata' },
      items: [
        { id: 'home', label: 'Home', url: '/', children: [] },
        ...categories.map(c => ({ id: c.id, label: c.name, url: `/categoria/${c.slug}`, children: [] })),
      ],
      sticky: true,
    }, def.defaultStyle);
    block.id = generateId();
    addBlock(block);
  };

  // Generate full page from CMS layout
  const generateFromLayout = async () => {
    setLoading(true);
    try {
      const layoutData = await fetchCmsData('layout', { page: 'homepage' });
      if (layoutData.slots) {
        // Create navigation from categories
        if (data?.categories) addNavWithCategories(data.categories);

        // Process each slot
        for (const slot of layoutData.slots as Array<{ slot_key: string; content_type: string; label: string; items: CmsArticlePreview[] }>) {
          if (slot.content_type === 'articles' && slot.items.length > 0) {
            addArticlesGrid(slot.items, slot.label);
          } else if (slot.content_type === 'breaking_news' && slot.items.length > 0) {
            addBreakingBlock(slot.items as unknown as CmsBreakingPreview[]);
          }
        }

        // Add footer
        const footerDef = getBlockDefinition('footer');
        if (footerDef) {
          const footer = createBlock('footer', 'Footer', footerDef.defaultProps, footerDef.defaultStyle);
          footer.id = generateId();
          addBlock(footer);
        }
      }
    } catch (err) {
      setError('Errore nel generare il layout dal CMS');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const sections = [
    { id: 'articles', label: 'Articoli', icon: Newspaper, count: data?.articles.length },
    { id: 'categories', label: 'Categorie', icon: Tag, count: data?.categories.length },
    { id: 'banners', label: 'Banner', icon: Megaphone, count: data?.banners.length },
    { id: 'breaking', label: 'Breaking News', icon: AlertTriangle, count: data?.breakingNews.length },
    { id: 'events', label: 'Eventi', icon: Calendar, count: data?.events.length },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-2xl border w-[90vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center gap-3">
            <Database size={20} style={{ color: 'var(--c-accent)' }} />
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--c-text-0)' }}>Connessione CMS</h2>
              <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>Collega il builder al CMS editoriale per importare contenuti reali</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--c-text-2)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-bg-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = '')}>×</button>
        </div>

        {/* Connection form */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-2)' }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input label="URL del CMS" value={connection.url} onChange={e => setConnection(c => ({ ...c, url: e.target.value }))} placeholder="http://localhost:3001" />
            </div>
            <div className="flex-1">
              <Input label="Tenant (slug)" value={connection.tenant} onChange={e => setConnection(c => ({ ...c, tenant: e.target.value }))} placeholder="mio-giornale" />
            </div>
            <Button variant="primary" onClick={testConnection} disabled={loading || !connection.url || !connection.tenant}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
              Connetti
            </Button>
          </div>

          {/* Status */}
          {connection.connected && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--c-success)' }}>
              <CheckCircle2 size={16} />
              Connesso a <strong>{connection.tenantName || connection.tenant}</strong>
              <button onClick={testConnection} className="ml-2 text-xs transition-colors" style={{ color: 'var(--c-accent)' }}><RefreshCw size={12} /></button>
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--c-danger)' }}>
              <XCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {connection.connected && data ? (
            <div className="flex h-full">
              {/* Sidebar sections */}
              <div className="w-48 shrink-0 border-r py-2" style={{ borderColor: 'var(--c-border)' }}>
                {/* Generate full page button */}
                <button
                  onClick={generateFromLayout}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors border-b"
                  style={{
                    color: 'var(--c-accent)',
                    background: 'var(--c-accent-soft)',
                    borderColor: 'var(--c-border)',
                  }}
                >
                  <Zap size={14} />
                  Genera pagina dal CMS
                </button>

                {sections.map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    onClick={() => setActiveSection(activeSection === id ? null : id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors"
                    style={{
                      background: activeSection === id ? 'var(--c-accent-soft)' : '',
                      color: activeSection === id ? 'var(--c-accent)' : 'var(--c-text-1)',
                      fontWeight: activeSection === id ? '600' : 'normal',
                    }}
                  >
                    <span className="flex items-center gap-2"><Icon size={13} />{label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>{count || 0}</span>
                  </button>
                ))}
              </div>

              {/* Data list */}
              <div className="flex-1 p-4 overflow-y-auto">
                {activeSection === 'articles' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Articoli pubblicati</h3>
                      <Button variant="outline" size="xs" onClick={() => addArticlesGrid(data.articles)}>
                        <Plus size={12} /> Aggiungi griglia
                      </Button>
                    </div>
                    {data.articles.map(article => (
                      <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        {article.cover_image_url ? (
                          <img src={article.cover_image_url} alt="" className="w-14 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-14 h-10 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"><Newspaper size={14} className="text-zinc-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{article.title}</div>
                          <div className="text-[10px] text-zinc-400">{article.categories?.name} · {article.published_at ? new Date(article.published_at).toLocaleDateString('it') : ''}</div>
                        </div>
                        <Button variant="ghost" size="xs" onClick={() => addArticleBlock(article)} title="Aggiungi al canvas">
                          <Plus size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'categories' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Categorie</h3>
                      <Button variant="outline" size="xs" onClick={() => addNavWithCategories(data.categories)}>
                        <Plus size={12} /> Crea nav
                      </Button>
                    </div>
                    {data.categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#999' }} />
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">/{cat.slug}</span>
                        <Button variant="ghost" size="xs" onClick={() => { const a = data.articles.filter(x => x.categories?.slug === cat.slug); if (a.length) addArticlesGrid(a, cat.name); }} className="ml-auto" title={`Aggiungi articoli ${cat.name}`}>
                          <Plus size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'banners' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Banner Attivi</h3>
                    {data.banners.length === 0 && <p className="text-xs text-zinc-400">Nessun banner attivo</p>}
                    {data.banners.map(banner => (
                      <div key={banner.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <Megaphone size={14} className="text-zinc-400" />
                        <div className="flex-1"><div className="text-xs font-medium">{banner.name}</div><div className="text-[10px] text-zinc-400">{banner.position} · {banner.type}</div></div>
                        <Button variant="ghost" size="xs" onClick={() => addBannerBlock(banner)}><Plus size={12} /></Button>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'breaking' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Breaking News</h3>
                      {data.breakingNews.length > 0 && (
                        <Button variant="outline" size="xs" onClick={() => addBreakingBlock(data.breakingNews)}>
                          <Plus size={12} /> Aggiungi hero
                        </Button>
                      )}
                    </div>
                    {data.breakingNews.length === 0 && <p className="text-xs text-zinc-400">Nessuna breaking news attiva</p>}
                    {data.breakingNews.map(bn => (
                      <div key={bn.id} className="p-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
                        <AlertTriangle size={12} className="inline mr-1" />{bn.text}
                      </div>
                    ))}
                  </div>
                )}

                {activeSection === 'events' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Prossimi Eventi</h3>
                    {data.events.length === 0 && <p className="text-xs text-zinc-400">Nessun evento in programma</p>}
                    {data.events.map(event => (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <Calendar size={14} className="text-zinc-400" />
                        <div className="flex-1"><div className="text-xs font-medium">{event.title}</div><div className="text-[10px] text-zinc-400">{new Date(event.starts_at).toLocaleDateString('it')} · {event.location}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Database size={40} className="mb-4 opacity-30" />
              <p className="text-sm font-medium mb-1">Connetti il CMS editoriale</p>
              <p className="text-xs max-w-sm text-center">Inserisci l&apos;URL del CMS e il tenant slug, poi clicca Connetti per importare articoli, categorie, banner e contenuti nel builder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
