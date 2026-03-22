'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Megaphone,
  Newspaper,
  Plus,
  RefreshCw,
  Tag,
  Tags,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { advNav, editorialNav, mainNav, systemNav } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/lib/store';
import { usePageStore } from '@/lib/stores/page-store';
import { createBlock, type Block } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import {
  loadEditorCmsDataset,
  type EditorCmsArticlePreview as CmsArticlePreview,
  type EditorCmsDataset as CmsData,
  type EditorCmsPagePreview as CmsPagePreview,
} from '@/lib/editor/cms-integration';
import { cn } from '@/lib/utils/cn';
import '@/lib/blocks/init';

interface CmsPanelProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

type SectionId =
  | 'articles'
  | 'categories'
  | 'pages'
  | 'tags'
  | 'banners'
  | 'breaking'
  | 'events';

function firstCategory(article: CmsArticlePreview) {
  return Array.isArray(article.categories) ? article.categories[0] ?? null : null;
}

function createEditorialBlock(type: Parameters<typeof getBlockDefinition>[0], overrides?: Partial<Block>): Block | null {
  const definition = getBlockDefinition(type);
  if (!definition) return null;
  const block = createBlock(definition.type, definition.label, definition.defaultProps, definition.defaultStyle);
  block.id = generateId();
  return {
    ...block,
    ...overrides,
    props: {
      ...block.props,
      ...(overrides?.props ?? {}),
    },
    style: {
      ...block.style,
      ...(overrides?.style ?? {}),
    },
    dataSource: overrides?.dataSource ?? block.dataSource,
  };
}

function CmsPanelContent({ onClose }: { onClose?: () => void }) {
  const { currentTenant } = useAuthStore();
  const { addBlock } = usePageStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CmsData | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('articles');

  const loadCmsData = useCallback(async (mode: 'connect' | 'refresh' = 'connect') => {
    if (!currentTenant?.id) return;

    if (mode === 'connect') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const dataset = await loadEditorCmsDataset(currentTenant.id);
      setData({
        ...dataset,
        tenantName: currentTenant.name,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Errore di lettura dati CMS');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    if (currentTenant?.id) {
      void loadCmsData('connect');
    }
  }, [currentTenant?.id, loadCmsData]);

  const insertBlock = useCallback((block: Block | null) => {
    if (!block) return;
    addBlock(block);
  }, [addBlock]);

  const addArticleHero = useCallback((article: CmsArticlePreview) => {
    insertBlock(
      createEditorialBlock('article-hero', {
        label: `Hero articolo: ${article.title}`,
        props: {
          articleSlug: article.slug,
          useFeatured: false,
          showCategory: true,
          showAuthor: true,
          showDate: true,
          showExcerpt: true,
        },
        dataSource: {
          endpoint: 'articles',
          params: { slug: article.slug, limit: '1' },
        },
      })
    );
  }, [insertBlock]);

  const addArticleGrid = useCallback((categorySlug?: string, label?: string, limit = 6) => {
    insertBlock(
      createEditorialBlock('article-grid', {
        label: label || (categorySlug ? `Articoli ${categorySlug}` : 'Griglia articoli CMS'),
        props: {
          categorySlug: categorySlug || '',
          limit,
          columns: limit <= 3 ? limit : 3,
        },
        dataSource: {
          endpoint: 'articles',
          params: categorySlug
            ? { category: categorySlug, limit: String(limit), status: 'published' }
            : { limit: String(limit), status: 'published' },
        },
      })
    );
  }, [insertBlock]);

  const addCategoryNavigation = useCallback(() => {
    insertBlock(createEditorialBlock('category-nav', { label: 'Navigazione categorie CMS' }));
  }, [insertBlock]);

  const addBreakingTicker = useCallback(() => {
    insertBlock(createEditorialBlock('breaking-ticker', { label: 'Ticker breaking news CMS' }));
  }, [insertBlock]);

  const addEventList = useCallback(() => {
    insertBlock(createEditorialBlock('event-list', { label: 'Eventi CMS' }));
  }, [insertBlock]);

  const addBannerZone = useCallback((position?: string) => {
    insertBlock(
      createEditorialBlock('banner-zone', {
        label: `Banner ${position || 'sidebar'}`,
        props: {
          position: position || 'sidebar',
        },
        dataSource: {
          endpoint: 'banners',
          params: { position: position || 'sidebar' },
        },
      })
    );
  }, [insertBlock]);

  const addPageLinkBlock = useCallback((page: CmsPagePreview) => {
    const block = createEditorialBlock('text', {
      label: `Link pagina: ${page.title}`,
      props: {
        content: `<p><a href="/${page.slug}" target="_self">${page.title}</a></p>`,
      },
    });
    insertBlock(block);
  }, [insertBlock]);

  const addTagListBlock = useCallback(() => {
    const tagMarkup = (data?.tags || [])
      .slice(0, 12)
      .map((tag) => `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.08);margin:0 8px 8px 0;">#${tag.name}</span>`)
      .join('');

    insertBlock(
      createEditorialBlock('text', {
        label: 'Tag CMS',
        props: {
          content: `<div><h3>Tag redazionali</h3><div>${tagMarkup || '<p>Nessun tag disponibile.</p>'}</div></div>`,
        },
      })
    );
  }, [data?.tags, insertBlock]);

  const generateFromLayout = useCallback(() => {
    if (!data?.layoutSlots?.length) return;

    if (data.categories.length > 0) {
      addCategoryNavigation();
    }

    data.layoutSlots.forEach((slot) => {
      if (slot.label) {
        insertBlock(
          createEditorialBlock('text', {
            label: `Titolo slot: ${slot.label}`,
            props: {
              content: `<h2>${slot.label}</h2>`,
            },
          })
        );
      }

      if (slot.content_type === 'articles') {
        addArticleGrid(slot.category?.slug, slot.label, Math.max(1, Math.min(slot.items.length || 6, 9)));
      } else if (slot.content_type === 'breaking_news') {
        addBreakingTicker();
      } else if (slot.content_type === 'events') {
        addEventList();
      } else if (slot.content_type === 'banners') {
        addBannerZone(slot.slot_key);
      }
    });
  }, [addArticleGrid, addBannerZone, addBreakingTicker, addCategoryNavigation, addEventList, data, insertBlock]);

  const sections = useMemo(() => ([
    { id: 'articles' as const, label: 'Articoli', icon: Newspaper, count: data?.articles.length || 0 },
    { id: 'categories' as const, label: 'Categorie', icon: Tag, count: data?.categories.length || 0 },
    { id: 'pages' as const, label: 'Pagine', icon: FileText, count: data?.pages.length || 0 },
    { id: 'tags' as const, label: 'Tag', icon: Tags, count: data?.tags.length || 0 },
    { id: 'banners' as const, label: 'Banner', icon: Megaphone, count: data?.banners.length || 0 },
    { id: 'breaking' as const, label: 'Breaking', icon: AlertTriangle, count: data?.breakingNews.length || 0 },
    { id: 'events' as const, label: 'Eventi', icon: Calendar, count: data?.events.length || 0 },
  ]), [data]);

  const sidebarReferenceGroups = [
    {
      title: 'Principale',
      items: mainNav.filter((item) => item.href !== '/dashboard' && item.href !== '/dashboard/editor'),
    },
    {
      title: 'Editoriale',
      items: editorialNav,
    },
    {
      title: 'ADV',
      items: advNav,
    },
    {
      title: 'Sistema',
      items: systemNav.filter((item) =>
        ['/dashboard/testata', '/dashboard/tecnico', '/dashboard/seo', '/dashboard/redirect', '/dashboard/ia'].includes(item.href)
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--c-bg-0)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database size={16} style={{ color: 'var(--c-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                Contesto CMS nel Builder
              </h3>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--c-text-2)' }}>
              Qui non gestisci il CMS completo: usi i dati del CMS mentre costruisci la pagina. La gestione editoriale resta nelle sezioni principali del backoffice.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded"
              style={{ color: 'var(--c-text-2)', background: 'var(--c-bg-2)' }}
            >
              Chiudi
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--c-text-2)' }}>
            Programma unico
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>
            Builder interno al CMS
          </div>
          <div className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            Il pannello legge direttamente il tenant attivo e usa lo stesso modello dati del CMS. Le API restano come superficie di controllo per IA e client esterni, ma qui sei dentro lo stesso sistema.
          </div>
          {currentTenant && (
            <div className="mt-2 text-xs" style={{ color: 'var(--c-text-1)' }}>
              Tenant attivo: <strong>{currentTenant.name}</strong> ({currentTenant.slug})
            </div>
          )}
        </div>

        <div className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--c-text-2)' }}>
            Gestione completa
          </div>
          <div className="mt-2 space-y-3">
            {sidebarReferenceGroups.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  {group.title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => { window.location.href = item.href; }}
                        className="px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                        style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
                        title={`Apri ${item.label}`}
                      >
                        <Icon size={12} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => void loadCmsData('connect')} disabled={!currentTenant?.id || loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            Sincronizza
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadCmsData('refresh')} disabled={!currentTenant?.id || refreshing}>
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={generateFromLayout} disabled={!data?.layoutSlots?.length}>
            <Zap size={14} />
            Genera da Layout
          </Button>
        </div>

        {data && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-success)' }}>
            <CheckCircle2 size={14} />
            Connesso a <strong>{data.tenantName}</strong>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-danger)' }}>
            <XCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {data ? (
        <div className="flex-1 min-h-0 flex">
          <div className="w-36 shrink-0 border-r py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
            {sections.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs transition-colors"
                style={{
                  color: activeSection === id ? 'var(--c-accent)' : 'var(--c-text-1)',
                  background: activeSection === id ? 'var(--c-accent-soft)' : 'transparent',
                  fontWeight: activeSection === id ? 700 : 500,
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon size={13} />
                  {label}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {activeSection === 'articles' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Articoli Pubblicati</h4>
                  <Button variant="outline" size="xs" onClick={() => addArticleGrid(undefined, 'Ultimi articoli', 6)}>
                    <Plus size={12} />
                    Griglia articoli
                  </Button>
                </div>
                {data.articles.map((article) => {
                  const category = firstCategory(article);
                  return (
                    <div key={article.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                      <div className="flex items-start gap-3">
                        {article.cover_image_url ? (
                          <img src={article.cover_image_url} alt="" className="w-16 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-16 h-12 rounded flex items-center justify-center" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}>
                            <Newspaper size={14} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate" style={{ color: 'var(--c-text-0)' }}>{article.title}</div>
                          <div className="mt-1 text-[11px]" style={{ color: 'var(--c-text-2)' }}>
                            {category?.name || 'Senza categoria'}
                            {article.published_at ? ` · ${new Date(article.published_at).toLocaleDateString('it-IT')}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="ghost" size="xs" onClick={() => addArticleHero(article)}>
                          <Plus size={12} />
                          Hero
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => addArticleGrid(category?.slug, category?.name || article.title, 3)}>
                          <Plus size={12} />
                          Griglia correlata
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeSection === 'categories' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Categorie Editoriali</h4>
                  <Button variant="outline" size="xs" onClick={addCategoryNavigation}>
                    <Plus size={12} />
                    Nav categorie
                  </Button>
                </div>
                {data.categories.map((category) => (
                  <div key={category.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: category.color || 'var(--c-accent)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>{category.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>/categoria/{category.slug}</div>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => addArticleGrid(category.slug, category.name, 6)}>
                      <ChevronRight size={12} />
                    </Button>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'pages' && (
              <>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Pagine CMS</h4>
                {data.pages.map((page) => (
                  <div key={page.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                    <FileText size={14} style={{ color: 'var(--c-text-2)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>{page.title}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>/site/{currentTenant?.slug || data.tenantName}/{page.slug}</div>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => addPageLinkBlock(page)} title="Inserisci link alla pagina nel builder">
                      <Plus size={12} />
                    </Button>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'tags' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Tag</h4>
                  <Button variant="outline" size="xs" onClick={addTagListBlock}>
                    <Plus size={12} />
                    Lista tag
                  </Button>
                </div>
                {data.tags.map((tag) => (
                  <div key={tag.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                    <Tags size={14} style={{ color: 'var(--c-text-2)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>{tag.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>#{tag.slug}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'banners' && (
              <>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Banner Attivi</h4>
                {data.banners.map((banner) => (
                  <div key={banner.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                    <Megaphone size={14} style={{ color: 'var(--c-text-2)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>{banner.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>{banner.position} · {banner.type}</div>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => addBannerZone(banner.position)}>
                      <Plus size={12} />
                    </Button>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'breaking' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Breaking News</h4>
                  <Button variant="outline" size="xs" onClick={addBreakingTicker}>
                    <Plus size={12} />
                    Ticker
                  </Button>
                </div>
                {data.breakingNews.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>Nessuna breaking news attiva.</p>
                )}
                {data.breakingNews.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3" style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--c-danger)' }}>
                      <AlertTriangle size={12} />
                      Breaking
                    </div>
                    <p className="mt-2 text-xs leading-5" style={{ color: 'var(--c-text-0)' }}>{item.text}</p>
                  </div>
                ))}
              </>
            )}

            {activeSection === 'events' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Eventi</h4>
                  <Button variant="outline" size="xs" onClick={addEventList}>
                    <Plus size={12} />
                    Lista eventi
                  </Button>
                </div>
                {data.events.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3 flex items-center gap-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
                    <Calendar size={14} style={{ color: 'var(--c-text-2)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>{event.title}</div>
                      <div className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>
                        {new Date(event.starts_at).toLocaleDateString('it-IT')}
                        {event.location ? ` · ${event.location}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Database size={34} style={{ color: 'var(--c-text-2)', opacity: 0.5 }} />
          <p className="mt-4 text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>
            Collega il tenant editoriale all&apos;editor
          </p>
          <p className="mt-2 text-xs max-w-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            Questo pannello usa le API locali del CMS per generare blocchi editoriali compatibili con il renderer pubblico e con il layout del sito.
          </p>
        </div>
      )}
    </div>
  );
}

export function CmsPanel({ open = true, onClose, inline = false }: CmsPanelProps) {
  if (!inline && !open) {
    return null;
  }

  if (inline) {
    return <CmsPanelContent />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-[92vw] max-w-5xl h-[84vh] overflow-hidden rounded-2xl border shadow-2xl'
        )}
        style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}
      >
        <CmsPanelContent onClose={onClose} />
      </div>
    </div>
  );
}
