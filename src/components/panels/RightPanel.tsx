'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { StyleEditor } from './StyleEditor';
import { AnimationEditor } from './AnimationEditor';
import { SnapGridSettings, ShapeTools, PositionSizeEditor } from './AdvancedTools';
import { ColorPaletteManager } from '@/components/builder/ColorPaletteManager';
import { cn } from '@/lib/utils/cn';
import { Paintbrush, Settings2, Pentagon, Move, Palette, Layers, Settings, Eye, EyeOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Textarea } from '@/components/ui/textarea';
import { ColorPicker } from '@/components/ui/color-picker';
import AIButton from '@/components/ai/AIButton';
import type { AICommand } from '@/components/ai/AIButton';
import type { Block, DataSource } from '@/lib/types';
import type { SiteMenuItem } from '@/lib/site/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { DEFAULT_PAGE_BACKGROUND, extractPageBackgroundSettings, upsertPageBackgroundMeta } from '@/lib/page-settings';
import { generateId } from '@/lib/utils/id';
import { NAVIGATION_TEMPLATES, cloneNavigationItems, getNavigationTemplate } from '@/lib/navigation/templates';
import { CMS_FORM_TEMPLATES, SOCIAL_BLOCK_TEMPLATES, getCmsFormTemplate, getSocialTemplate } from '@/lib/interactive/block-templates';
import { SOCIAL_PLATFORMS } from '@/lib/social/platforms';
import { ARTICLE_GRID_TEMPLATES, ARTICLE_HERO_TEMPLATES, BANNER_ZONE_TEMPLATES, CAROUSEL_TEMPLATES, HERO_TEMPLATES, IMAGE_GALLERY_TEMPLATES, SLIDESHOW_TEMPLATES, getContentBlockTemplate, type ContentBlockTemplate, type TemplateBlockStyle } from '@/lib/editor/content-block-templates';
import { useEditorBlockPreviewData } from '@/lib/editor/cms-integration';

type ArticleSourceMode = 'automatic' | 'placement' | 'manual' | 'mixed';
type ArticleAutoSource = 'latest' | 'featured' | 'category' | 'tag';
type BannerSourceMode = 'rotation' | 'specific' | 'custom';

interface EditorialArticleOption {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
}

interface EditorialBannerOption {
  id: string;
  name: string;
  position: string;
  type: string;
  image_url: string | null;
  html_content: string | null;
  advertiser_id: string | null;
  target_categories: string[];
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : [];
}

function normalizeArticleSourceMode(value: unknown): ArticleSourceMode {
  return value === 'placement' || value === 'manual' || value === 'mixed' ? value : 'automatic';
}

function normalizeArticleAutoSource(value: unknown, fallback: ArticleAutoSource): ArticleAutoSource {
  return value === 'featured' || value === 'category' || value === 'tag' || value === 'latest' ? value : fallback;
}

function normalizeBannerSourceMode(value: unknown): BannerSourceMode {
  return value === 'specific' || value === 'custom' ? value : 'rotation';
}

function getArticleEditorialConfig(block: Block) {
  const props = block.props as Record<string, unknown>;
  const fallbackAutoSource: ArticleAutoSource = block.type === 'article-hero' ? 'featured' : 'latest';
  const manualArticleIds = normalizeStringArray(props.manualArticleIds);
  const articleSlug = String(props.articleSlug || '');
  const placementSlotId = String(props.placementSlotId || '');
  const categorySlug = String(props.categorySlug || '');
  const tagSlug = String(props.tagSlug || '');

  let sourceMode = normalizeArticleSourceMode(props.sourceMode);
  if (!('sourceMode' in props)) {
    if (placementSlotId) {
      sourceMode = 'placement';
    } else if (manualArticleIds.length > 0 || articleSlug) {
      sourceMode = 'manual';
    } else {
      sourceMode = 'automatic';
    }
  }

  let autoSource = normalizeArticleAutoSource(props.autoSource, fallbackAutoSource);
  if (!('autoSource' in props)) {
    if (tagSlug) {
      autoSource = 'tag';
    } else if (categorySlug) {
      autoSource = 'category';
    } else if (block.type === 'article-hero' && props.useFeatured !== false) {
      autoSource = 'featured';
    } else {
      autoSource = fallbackAutoSource;
    }
  }

  return {
    sourceMode,
    autoSource,
    categorySlug,
    tagSlug,
    articleSlug,
    placementSlotId,
    manualArticleIds,
  };
}

function buildArticleDataSourceFromConfig(config: {
  sourceMode: ArticleSourceMode;
  autoSource: ArticleAutoSource;
  limit: number;
  categorySlug?: string;
  tagSlug?: string;
  articleSlug?: string;
  placementSlotId?: string;
  manualArticleIds?: string[];
}): DataSource {
  const limit = String(Math.max(1, config.limit || 1));
  const manualIds = (config.manualArticleIds || []).filter(Boolean);
  const sourceMode = config.sourceMode;
  const autoSource = config.autoSource;

  if (sourceMode === 'placement' && config.placementSlotId) {
    return {
      endpoint: 'articles',
      params: {
        slotId: config.placementSlotId,
        limit,
        sourceMode,
      },
    };
  }

  if (sourceMode === 'manual') {
    if (manualIds.length > 0) {
      return {
        endpoint: 'articles',
        params: {
          ids: manualIds.join(','),
          limit,
          sourceMode,
        },
      };
    }

    if (config.articleSlug) {
      return {
        endpoint: 'articles',
        params: {
          slug: config.articleSlug,
          limit,
          sourceMode,
        },
      };
    }
  }

  const params: Record<string, string> = {
    limit,
    sourceMode,
    autoSource,
  };

  if (sourceMode === 'mixed' && manualIds.length > 0) {
    params.ids = manualIds.join(',');
  }

  if (autoSource === 'featured') {
    params.featured = 'true';
  }

  if (autoSource === 'category' && config.categorySlug) {
    params.category = config.categorySlug;
    params.categorySlug = config.categorySlug;
  }

  if (autoSource === 'tag' && config.tagSlug) {
    params.tag = config.tagSlug;
  }

  return {
    endpoint: 'articles',
    params,
  };
}

function updateArticleEditorialBlock(
  block: Block,
  updateBlock: (blockId: string, updates: Partial<Block>) => void,
  updates: Record<string, unknown>,
  limitOverride?: number
) {
  const nextProps = {
    ...block.props,
    ...updates,
  };

  const config = getArticleEditorialConfig({
    ...block,
    props: nextProps,
  });
  const limit =
    limitOverride ||
    Number(nextProps.limit || (block.type === 'article-hero' ? 1 : 9)) ||
    (block.type === 'article-hero' ? 1 : 9);

  updateBlock(block.id, {
    props: nextProps,
    dataSource: buildArticleDataSourceFromConfig({
      ...config,
      limit,
    }),
  });
}

function buildBannerDataSourceFromProps(props: Record<string, unknown>): DataSource | undefined {
  const sourceMode = normalizeBannerSourceMode(props.sourceMode);

  if (sourceMode === 'custom') {
    return undefined;
  }

  const params: Record<string, string> = {
    sourceMode,
  };

  if (sourceMode === 'specific') {
    const bannerId = String(props.bannerId || '');
    if (!bannerId) {
      return undefined;
    }
    params.bannerId = bannerId;
    params.limit = '1';
    return {
      endpoint: 'banners',
      params,
    };
  }

  params.position = String(props.position || 'sidebar');
  if (props.advertiserId) {
    params.advertiserId = String(props.advertiserId);
  }
  if (props.targetCategorySlug) {
    params.targetCategory = String(props.targetCategorySlug);
  }

  return {
    endpoint: 'banners',
    params,
  };
}

function updateBannerBlock(
  block: Block,
  updateBlock: (blockId: string, updates: Partial<Block>) => void,
  updates: Record<string, unknown>
) {
  const nextProps = {
    ...block.props,
    ...updates,
  };

  updateBlock(block.id, {
    props: nextProps,
    dataSource: buildBannerDataSourceFromProps(nextProps),
  });
}

function goToCmsSection(path: string) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

function describeArticleEditorialConfig(config: ReturnType<typeof getArticleEditorialConfig>) {
  if (config.sourceMode === 'placement') {
    return 'Questo blocco usa un placement editoriale gestito dal CMS.';
  }

  if (config.sourceMode === 'manual') {
    return 'Questo blocco usa una selezione manuale di articoli definita nel CMS.';
  }

  if (config.sourceMode === 'mixed') {
    return 'Questo blocco combina articoli curati e regole automatiche gestite dal CMS.';
  }

  if (config.autoSource === 'category') {
    return `Questo blocco segue la categoria ${config.categorySlug || 'del CMS'}.`;
  }

  if (config.autoSource === 'tag') {
    return `Questo blocco segue il tag ${config.tagSlug || 'del CMS'}.`;
  }

  if (config.autoSource === 'featured') {
    return 'Questo blocco usa il featured corrente del CMS.';
  }

  return 'Questo blocco usa la regola automatica del CMS.';
}

function describeBannerEditorialConfig(sourceMode: BannerSourceMode) {
  if (sourceMode === 'specific') {
    return 'Questa zona usa un banner specifico gestito dal CMS advertising.';
  }

  if (sourceMode === 'custom') {
    return 'Questa zona usa una creativita legacy nel blocco. Per nuove creativita usa il CMS advertising.';
  }

  return 'Questa zona usa la rotazione ADV e i filtri decisi nel CMS.';
}

function CmsManagedNotice({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-2)' }}>
          Gestito dal CMS
        </div>
        <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
          {title}
        </div>
        <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="rounded-lg px-3 py-2 text-xs font-medium"
        style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function RightPanel() {
  const { rightPanelTab, setRightPanelTab, hiddenRightPanelTabs, toggleHiddenRightPanelTab, selectedInnerTarget, setSelectedInnerTarget } = useUiStore();
  const { selectedBlockId, updateBlock, pageMeta, updatePageMeta, moveBlockRelative, swapBlockWithSibling, getBlockLocation } = usePageStore();
  const blocks = usePageStore((s) => s.blocks);

  // Find the selected block from the blocks array
  const findBlock = (blocks: Block[], id: string): Block | null => {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children.length > 0) {
        const found = findBlock(block.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const block = selectedBlockId ? findBlock(blocks, selectedBlockId) : null;
  const blockLocation = selectedBlockId ? getBlockLocation(selectedBlockId) : null;

  const projectPalette = useUiStore((s) => s.projectPalette);
  const setProjectPalette = useUiStore((s) => s.setProjectPalette);
  const [showTabMenu, setShowTabMenu] = useState(false);

  const tabs = [
    { id: 'properties' as const, icon: Settings2, label: 'Props' },
    { id: 'style' as const, icon: Paintbrush, label: 'Stile' },
    { id: 'animation' as const, icon: Settings, label: 'Anim' },
    { id: 'shape' as const, icon: Pentagon, label: 'Forma' },
    { id: 'position' as const, icon: Move, label: 'Pos.' },
    { id: 'tools' as const, icon: Layers, label: 'Tools' },
  ];

  const visibleTabs = tabs.filter((t) => !hiddenRightPanelTabs.includes(t.id));
  const stopPanelEvent = (event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  if (!block) {
    return (
      <div
        data-editor-interactive-root="true"
        className="h-full flex flex-col border-l"
        style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}
        onMouseDown={stopPanelEvent}
        onPointerDown={stopPanelEvent}
        onClick={stopPanelEvent}
        onDoubleClick={stopPanelEvent}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text-0)' }}>Strumenti</h3>
          <p className="text-[10px]" style={{ color: 'var(--c-text-2)' }}>Seleziona un blocco o usa gli strumenti globali</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-40 space-y-4">
          <PageBackgroundEditor
            pageMeta={pageMeta}
            onChange={(updater) => updatePageMeta((current) => upsertPageBackgroundMeta(current, updater))}
          />
          <PageSeoEditor
            pageMeta={pageMeta}
            onChange={(updates) =>
              updatePageMeta((current) => ({
                ...current,
                ...updates,
              }))
            }
          />
          <SnapGridSettings />
          <div className="border rounded-lg p-3" style={{ borderColor: 'var(--c-border)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: 'var(--c-text-1)' }}>
              <Palette size={12} /> Palette Colori Progetto
            </h4>
            <ColorPaletteManager currentPalette={projectPalette} onChange={setProjectPalette} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-editor-interactive-root="true"
      className="h-full flex flex-col border-l"
      style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}
      onMouseDown={stopPanelEvent}
      onPointerDown={stopPanelEvent}
      onClick={stopPanelEvent}
      onDoubleClick={stopPanelEvent}
    >
      {/* Block header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <input
              value={block.label}
              onChange={(e) => updateBlock(block.id, { label: e.target.value })}
              className="text-sm font-semibold bg-transparent border-none outline-none w-full"
              style={{ color: 'var(--c-text-0)' }}
            />
            <span className="text-[10px] font-mono" style={{ color: 'var(--c-text-2)' }}>{block.type} · {block.id.slice(0, 6)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b items-center" style={{ borderColor: 'var(--c-border)' }}>
        {visibleTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setRightPanelTab(id as typeof rightPanelTab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1 px-1 py-2 text-[9px] font-medium transition-colors',
              rightPanelTab === id
                ? 'border-b-2 border-blue-600'
                : ''
            )}
            style={rightPanelTab !== id ? { color: 'var(--c-text-1)' } : undefined}
            title={label}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}

        {/* Tab visibility menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowTabMenu(!showTabMenu)}
            className="px-2 py-2 rounded transition-colors"
            style={{ color: 'var(--c-text-1)' }}
            title="Personalizza schede"
          >
            <Settings size={12} />
          </button>

          {showTabMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg z-50 p-2 space-y-1"
              style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
            >
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    toggleHiddenRightPanelTab(id);
                    // Switch to visible tab if current is hidden
                    if (hiddenRightPanelTabs.includes(id) && rightPanelTab === id) {
                      const firstVisible = tabs.find((t) => !hiddenRightPanelTabs.includes(t.id));
                      if (firstVisible) setRightPanelTab(firstVisible.id as typeof rightPanelTab);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors text-left"
                  style={{
                    background: hiddenRightPanelTabs.includes(id) ? 'var(--c-bg-2)' : 'var(--c-accent-soft)',
                    color: hiddenRightPanelTabs.includes(id) ? 'var(--c-text-1)' : 'var(--c-accent)',
                  }}
                >
                  {hiddenRightPanelTabs.includes(id) ? <EyeOff size={12} /> : <Eye size={12} />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReorderControls
        canMovePrev={Boolean(blockLocation && blockLocation.index > 0)}
        canMoveNext={Boolean(blockLocation && blockLocation.index < blockLocation.siblingsCount - 1)}
        onMovePrev={() => selectedBlockId && moveBlockRelative(selectedBlockId, -1)}
        onMoveNext={() => selectedBlockId && moveBlockRelative(selectedBlockId, 1)}
        onSwapPrev={() => selectedBlockId && swapBlockWithSibling(selectedBlockId, -1)}
        onSwapNext={() => selectedBlockId && swapBlockWithSibling(selectedBlockId, 1)}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-40">
        {rightPanelTab === 'properties' && <PropertiesEditor block={block} selectedInnerTarget={selectedInnerTarget} onClearInnerTarget={() => setSelectedInnerTarget(null)} />}
        {rightPanelTab === 'style' && <StyleEditor block={block} />}
        {rightPanelTab === 'animation' && <AnimationEditor block={block} />}
        {rightPanelTab === 'shape' && <ShapeTabContent block={block} />}
        {rightPanelTab === 'position' && <PositionSizeEditor block={block} />}
        {rightPanelTab === 'tools' && <ToolsTabContent block={block} projectPalette={projectPalette} onPaletteChange={setProjectPalette} />}
      </div>
    </div>
  );
}

function ReorderControls({
  canMovePrev,
  canMoveNext,
  onMovePrev,
  onMoveNext,
  onSwapPrev,
  onSwapNext,
}: {
  canMovePrev: boolean;
  canMoveNext: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
  onSwapPrev: () => void;
  onSwapNext: () => void;
}) {
  return (
    <div className="border-b px-3 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--c-text-2)' }}>
        Ordine Sezione
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onMovePrev}
          disabled={!canMovePrev}
          className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          title="Sposta prima, sopra o a sinistra"
        >
          <ArrowUp size={13} />
          <ArrowLeft size={13} />
          Prima
        </button>
        <button
          type="button"
          onClick={onMoveNext}
          disabled={!canMoveNext}
          className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          title="Sposta dopo, sotto o a destra"
        >
          Dopo
          <ArrowRight size={13} />
          <ArrowDown size={13} />
        </button>
        <button
          type="button"
          onClick={onSwapPrev}
          disabled={!canMovePrev}
          className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          title="Inverti con la sezione sopra o a sinistra"
        >
          <ArrowUpDown size={13} />
          Inverti su
        </button>
        <button
          type="button"
          onClick={onSwapNext}
          disabled={!canMoveNext}
          className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          title="Inverti con la sezione sotto o a destra"
        >
          <ArrowUpDown size={13} />
          Inverti giu
        </button>
      </div>
    </div>
  );
}

function PageBackgroundEditor({
  pageMeta,
  onChange,
}: {
  pageMeta: Record<string, unknown>;
  onChange: (updates: Partial<typeof DEFAULT_PAGE_BACKGROUND>) => void;
}) {
  const settings = extractPageBackgroundSettings(pageMeta);

  return (
    <div className="border rounded-lg p-3 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-1)' }}>
        Sfondo Pagina
      </h4>
      <div className="space-y-2">
        <label className="text-[11px] font-medium" style={{ color: 'var(--c-text-2)' }}>Tipo</label>
        <select
          value={settings.type}
          onChange={(e) => onChange({ type: e.target.value as typeof DEFAULT_PAGE_BACKGROUND.type })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
        >
          <option value="none">Nessuno</option>
          <option value="color">Colore</option>
          <option value="gradient">Gradiente</option>
          <option value="image">Immagine</option>
          <option value="slideshow">Slideshow</option>
          <option value="custom-css">CSS custom</option>
        </select>
      </div>

      {settings.type === 'color' && (
        <ColorPicker
          label="Colore sfondo"
          value={settings.value}
          onChange={(value) => onChange({ value })}
        />
      )}

      {(settings.type === 'gradient' || settings.type === 'image') && (
        <Input
          label={settings.type === 'image' ? 'URL sfondo' : 'Valore sfondo'}
          value={settings.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={settings.type === 'gradient' ? 'linear-gradient(...)' : settings.type === 'image' ? 'https://...' : '#ffffff'}
        />
      )}

      {settings.type === 'slideshow' && (
        <>
          <Textarea
            label="Immagini slideshow"
            value={settings.images.join('\n')}
            onChange={(e) => onChange({ images: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
            placeholder="Una URL per riga"
            rows={5}
          />
          <Input
            label="Durata totale (ms)"
            type="number"
            value={String(settings.slideshowDurationMs)}
            onChange={(e) => onChange({ slideshowDurationMs: Number(e.target.value) || DEFAULT_PAGE_BACKGROUND.slideshowDurationMs })}
          />
        </>
      )}

      {settings.type === 'custom-css' && (
        <Textarea
          label="CSS custom"
          value={settings.customCss}
          onChange={(e) => onChange({ customCss: e.target.value })}
          placeholder="Usa :scope per riferirti alla pagina"
          rows={6}
        />
      )}

      {settings.type !== 'none' && settings.type !== 'custom-css' && (
        <>
          <ColorPicker
            label="Overlay"
            value={settings.overlay}
            onChange={(overlay) => onChange({ overlay })}
          />
          <Input label="Size" value={settings.size} onChange={(e) => onChange({ size: e.target.value })} />
          <Input label="Position" value={settings.position} onChange={(e) => onChange({ position: e.target.value })} />
          <Input label="Repeat" value={settings.repeat} onChange={(e) => onChange({ repeat: e.target.value })} />
          <Toggle label="Sfondo fisso" checked={settings.fixed} onChange={(value) => onChange({ fixed: value })} />
        </>
      )}
    </div>
  );
}

function PageSeoEditor({
  pageMeta,
  onChange,
}: {
  pageMeta: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-1)' }}>
        SEO Pagina
      </h4>
      <Input
        label="Meta title"
        value={String(pageMeta.title || '')}
        onChange={(event) => onChange({ title: event.target.value })}
        placeholder="Titolo SEO max 60 caratteri"
      />
      <Textarea
        label="Meta description"
        value={String(pageMeta.description || '')}
        onChange={(event) => onChange({ description: event.target.value })}
        placeholder="Descrizione SEO max 155 caratteri"
        rows={4}
      />
      <Input
        label="Canonical path"
        value={String(pageMeta.canonicalPath || '')}
        onChange={(event) => onChange({ canonicalPath: event.target.value })}
        placeholder="/percorso-canonico"
      />
      <Input
        label="Focus keyword"
        value={String(pageMeta.focusKeyword || '')}
        onChange={(event) => onChange({ focusKeyword: event.target.value })}
        placeholder="keyword principale"
      />
      <Input
        label="Open Graph title"
        value={String(pageMeta.ogTitle || '')}
        onChange={(event) => onChange({ ogTitle: event.target.value })}
      />
      <Textarea
        label="Open Graph description"
        value={String(pageMeta.ogDescription || '')}
        onChange={(event) => onChange({ ogDescription: event.target.value })}
        rows={3}
      />
      <Select
        label="Schema type"
        value={String(pageMeta.schemaType || 'WebPage')}
        onChange={(event) => onChange({ schemaType: event.target.value })}
        options={[
          { value: 'WebPage', label: 'WebPage' },
          { value: 'CollectionPage', label: 'CollectionPage' },
          { value: 'AboutPage', label: 'AboutPage' },
          { value: 'ContactPage', label: 'ContactPage' },
          { value: 'NewsMediaOrganization', label: 'NewsMediaOrganization' },
        ]}
      />
      <Toggle
        label="Noindex"
        checked={Boolean(pageMeta.noindex)}
        onChange={(value) => onChange({ noindex: value })}
      />
      <Toggle
        label="Nofollow"
        checked={Boolean(pageMeta.nofollow)}
        onChange={(value) => onChange({ nofollow: value })}
      />
    </div>
  );
}

// === Properties Editor ===
function PropertiesEditor({
  block,
  selectedInnerTarget,
  onClearInnerTarget,
}: {
  block: Block;
  selectedInnerTarget: { blockId: string; part: string } | null;
  onClearInnerTarget: () => void;
}) {
  const { updateBlockProps } = usePageStore();
  const selectedPart = selectedInnerTarget?.blockId === block.id ? selectedInnerTarget.part : null;

  if (block.type === 'hero' && selectedPart === 'hero-cta') {
    return <HeroCtaProperties block={block} onBack={onClearInnerTarget} />;
  }

  if (block.type === 'text') {
    return <TextProperties block={block} />;
  }

  if (block.type === 'divider') {
    return <DividerProperties block={block} />;
  }

  if (block.type === 'banner-ad') {
    return <BannerAdProperties block={block} />;
  }

  if (block.type === 'quote') {
    return <QuoteProperties block={block} />;
  }

  if (block.type === 'section') {
    return <SectionProperties block={block} />;
  }

  if (block.type === 'container') {
    return <ContainerProperties block={block} />;
  }

  if (block.type === 'columns') {
    return <ColumnsProperties block={block} />;
  }

  if (block.type === 'navigation') {
    return <NavigationProperties block={block} />;
  }

  if (block.type === 'footer') {
    return <FooterProperties block={block} />;
  }

  if (block.type === 'social') {
    return <SocialProperties block={block} />;
  }

  if (block.type === 'search-bar') {
    return <SearchBarProperties block={block} />;
  }

  if (block.type === 'breaking-ticker') {
    return <BreakingTickerProperties block={block} />;
  }

  if (block.type === 'category-nav') {
    return <CategoryNavProperties block={block} />;
  }

  if (block.type === 'event-list') {
    return <EventListProperties block={block} />;
  }

  if (block.type === 'related-content') {
    return <RelatedContentProperties block={block} />;
  }

  if (block.type === 'sidebar') {
    return <SidebarProperties block={block} />;
  }

  if (block.type === 'author-bio') {
    return <AuthorBioProperties block={block} />;
  }

  if (block.type === 'hero') {
    return <HeroProperties block={block} />;
  }

  if (block.type === 'article-hero') {
    return <ArticleHeroProperties block={block} />;
  }

  if (block.type === 'article-grid') {
    return <ArticleGridProperties block={block} />;
  }

  if (block.type === 'slideshow') {
    return <SlideshowProperties block={block} />;
  }

  if (block.type === 'image-gallery') {
    return <ImageGalleryProperties block={block} />;
  }

  if (block.type === 'carousel') {
    return <CarouselProperties block={block} />;
  }

  if (block.type === 'banner-zone') {
    return <BannerZoneProperties block={block} />;
  }

  if (block.type === 'comparison') {
    return <ComparisonProperties block={block} />;
  }

  if (block.type === 'counter') {
    return <CounterProperties block={block} />;
  }

  if (block.type === 'audio') {
    return <AudioProperties block={block} />;
  }

  if (block.type === 'video') {
    return <VideoProperties block={block} />;
  }

  if (block.type === 'map') {
    return <MapProperties block={block} />;
  }

  if (block.type === 'cms-form') {
    return <CmsFormProperties block={block} />;
  }

  if (block.type === 'newsletter' || block.type === 'newsletter-signup') {
    return <NewsletterProperties block={block} />;
  }

  if (block.type === 'accordion') {
    return <AccordionProperties block={block} />;
  }

  if (block.type === 'tabs') {
    return <TabsProperties block={block} />;
  }

  if (block.type === 'table') {
    return <TableProperties block={block} />;
  }

  if (block.type === 'timeline') {
    return <TimelineProperties block={block} />;
  }

  if (block.type === 'code') {
    return <CodeProperties block={block} />;
  }

  if (block.type === 'custom-html') {
    return <CustomHtmlProperties block={block} />;
  }

  const props = block.props as Record<string, unknown>;
  const editableFields = Object.entries(props).filter(
    ([, val]) => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean'
  );

  return (
    <div className="space-y-3">
      {editableFields.map(([key, value]) => (
        <div key={key}>
          {typeof value === 'boolean' ? (
            <Toggle label={key} checked={value} onChange={(v) => updateBlockProps(block.id, { [key]: v })} />
          ) : typeof value === 'number' ? (
            <Input label={key} type="number" value={value} onChange={(e) => updateBlockProps(block.id, { [key]: Number(e.target.value) })} />
          ) : (
            <div className="flex items-center gap-1">
              <div className="flex-1">
                <Input label={key} value={value as string} onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })} />
              </div>
              <div className="pt-4">
              </div>
            </div>
          )}
        </div>
      ))}
      {editableFields.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--c-text-2)' }}>Nessuna proprieta semplice modificabile</p>
      )}
    </div>
  );
}

function TextProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Textarea
        label="Contenuto HTML"
        value={String(block.props.content || '')}
        rows={12}
        onChange={(event) => updateBlockProps(block.id, { content: event.target.value })}
      />
      <Input
        label="Colonne"
        type="number"
        value={Number(block.props.columns || 1)}
        onChange={(event) => updateBlockProps(block.id, { columns: Number(event.target.value) || 1 })}
      />
      <Toggle
        label="Drop cap"
        checked={Boolean(block.props.dropCap)}
        onChange={(value) => updateBlockProps(block.id, { dropCap: value })}
      />
    </div>
  );
}

function DividerProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Forma divisore"
        value={String(block.props.shape || 'wave')}
        onChange={(event) => updateBlockProps(block.id, { shape: event.target.value })}
        options={[
          { value: 'diagonal', label: 'Diagonale' },
          { value: 'wave', label: 'Onda' },
          { value: 'zigzag', label: 'Zigzag' },
          { value: 'zigzag-smooth', label: 'Zigzag smooth' },
          { value: 'curve', label: 'Curva' },
          { value: 'triangle', label: 'Triangolo' },
          { value: 'arrow', label: 'Freccia' },
          { value: 'staircase', label: 'Scalini' },
          { value: 'cloud', label: 'Nuvola' },
        ]}
      />
      <Input
        label="Altezza"
        type="number"
        value={Number(block.props.height || 80)}
        onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) || 80 })}
      />
      <ColorPicker
        label="Colore"
        value={String(block.props.color || '#ffffff')}
        onChange={(value) => updateBlockProps(block.id, { color: value })}
      />
      <ColorPicker
        label="Sfondo"
        value={String(block.props.backgroundColor || 'transparent')}
        onChange={(value) => updateBlockProps(block.id, { backgroundColor: value })}
      />
      <Toggle
        label="Flip"
        checked={Boolean(block.props.flip)}
        onChange={(value) => updateBlockProps(block.id, { flip: value })}
      />
      <Toggle
        label="Inverti"
        checked={Boolean(block.props.invert)}
        onChange={(value) => updateBlockProps(block.id, { invert: value })}
      />
    </div>
  );
}

function BannerAdProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Formato"
        value={String(block.props.format || 'leaderboard')}
        onChange={(event) => updateBlockProps(block.id, { format: event.target.value })}
        options={[
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'medium-rectangle', label: 'Medium Rectangle' },
          { value: 'skyscraper', label: 'Skyscraper' },
          { value: 'mobile-banner', label: 'Mobile Banner' },
          { value: 'billboard', label: 'Billboard' },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Larghezza"
          type="number"
          value={Number(block.props.width || 728)}
          onChange={(event) => updateBlockProps(block.id, { width: Number(event.target.value) || 728 })}
        />
        <Input
          label="Altezza"
          type="number"
          value={Number(block.props.height || 90)}
          onChange={(event) => updateBlockProps(block.id, { height: Number(event.target.value) || 90 })}
        />
      </div>
      <Input
        label="Label"
        value={String(block.props.label || 'Pubblicità')}
        onChange={(event) => updateBlockProps(block.id, { label: event.target.value })}
      />
      <Textarea
        label="Ad code"
        value={String(block.props.adCode || '')}
        rows={8}
        onChange={(event) => updateBlockProps(block.id, { adCode: event.target.value })}
      />
      <Input
        label="Fallback immagine"
        value={String(block.props.fallbackImage || '')}
        onChange={(event) => updateBlockProps(block.id, { fallbackImage: event.target.value })}
      />
      <Input
        label="Fallback URL"
        value={String(block.props.fallbackUrl || '')}
        onChange={(event) => updateBlockProps(block.id, { fallbackUrl: event.target.value })}
      />
      <Toggle
        label="Mostra label"
        checked={block.props.showLabel !== false}
        onChange={(value) => updateBlockProps(block.id, { showLabel: value })}
      />
      <Toggle
        label="Responsive"
        checked={block.props.responsive !== false}
        onChange={(value) => updateBlockProps(block.id, { responsive: value })}
      />
    </div>
  );
}

function QuoteProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Textarea
        label="Citazione"
        value={String(block.props.text || '')}
        rows={6}
        onChange={(event) => updateBlockProps(block.id, { text: event.target.value })}
      />
      <Input
        label="Autore"
        value={String(block.props.author || '')}
        onChange={(event) => updateBlockProps(block.id, { author: event.target.value })}
      />
      <Input
        label="Fonte"
        value={String(block.props.source || '')}
        onChange={(event) => updateBlockProps(block.id, { source: event.target.value })}
      />
      <Select
        label="Stile citazione"
        value={String(block.props.style || 'default')}
        onChange={(event) => updateBlockProps(block.id, { style: event.target.value })}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'pull', label: 'Pull quote' },
          { value: 'minimal', label: 'Minimal' },
        ]}
      />
    </div>
  );
}

function SectionProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Tag HTML"
        value={String(block.props.tag || 'section')}
        onChange={(event) => updateBlockProps(block.id, { tag: event.target.value })}
        options={[
          { value: 'section', label: 'section' },
          { value: 'header', label: 'header' },
          { value: 'main', label: 'main' },
          { value: 'footer', label: 'footer' },
          { value: 'aside', label: 'aside' },
          { value: 'div', label: 'div' },
        ]}
      />
      <Input
        label="Min height"
        value={String(block.style.layout.minHeight || '200px')}
        onChange={(event) =>
          updateBlock(block.id, {
            style: {
              ...block.style,
              layout: {
                ...block.style.layout,
                minHeight: event.target.value,
              },
            },
          })
        }
      />
      <Textarea
        label="Label descrittiva"
        value={String(block.label || '')}
        rows={2}
        onChange={(event) => updateBlock(block.id, { label: event.target.value })}
      />
    </div>
  );
}

function ContainerProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Tag HTML"
        value={String(block.props.tag || 'div')}
        onChange={(event) => updateBlockProps(block.id, { tag: event.target.value })}
        options={[
          { value: 'div', label: 'div' },
          { value: 'section', label: 'section' },
          { value: 'article', label: 'article' },
          { value: 'aside', label: 'aside' },
          { value: 'nav', label: 'nav' },
        ]}
      />
      <Input
        label="Max width"
        value={String(block.style.layout.maxWidth || '1200px')}
        onChange={(event) =>
          updateBlock(block.id, {
            style: {
              ...block.style,
              layout: {
                ...block.style.layout,
                maxWidth: event.target.value,
              },
            },
          })
        }
      />
      <Input
        label="Width"
        value={String(block.style.layout.width || '100%')}
        onChange={(event) =>
          updateBlock(block.id, {
            style: {
              ...block.style,
              layout: {
                ...block.style.layout,
                width: event.target.value,
              },
            },
          })
        }
      />
      <Textarea
        label="Label descrittiva"
        value={String(block.label || '')}
        rows={2}
        onChange={(event) => updateBlock(block.id, { label: event.target.value })}
      />
    </div>
  );
}

function ColumnsProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Numero colonne"
        type="number"
        value={Number(block.props.columnCount || 2)}
        onChange={(event) => updateBlockProps(block.id, { columnCount: Math.max(1, Number(event.target.value) || 2) })}
      />
      <JsonTextareaField
        key={`column-widths-${JSON.stringify(block.props.columnWidths || [])}`}
        label="Larghezze colonne"
        value={block.props.columnWidths || ['50%', '50%']}
        rows={4}
        helpText='Formato: ["25%","50%","25%"]'
        onValidChange={(value) => updateBlockProps(block.id, { columnWidths: value as unknown[] })}
      />
      <Input
        label="Gap"
        value={String(block.props.gap || block.style.layout.gap || '24px')}
        onChange={(event) => {
          updateBlockProps(block.id, { gap: event.target.value });
          updateBlock(block.id, {
            style: {
              ...block.style,
              layout: {
                ...block.style.layout,
                gap: event.target.value,
              },
            },
          });
        }}
      />
      <Toggle
        label="Stack su mobile"
        checked={block.props.stackOnMobile !== false}
        onChange={(value) => updateBlockProps(block.id, { stackOnMobile: value })}
      />
      <Select
        label="Align items"
        value={String(block.style.layout.alignItems || 'stretch')}
        onChange={(event) =>
          updateBlock(block.id, {
            style: {
              ...block.style,
              layout: {
                ...block.style.layout,
                alignItems: event.target.value,
              },
            },
          })
        }
        options={[
          { value: 'stretch', label: 'Stretch' },
          { value: 'flex-start', label: 'Top' },
          { value: 'center', label: 'Center' },
          { value: 'flex-end', label: 'Bottom' },
        ]}
      />
    </div>
  );
}

function SearchBarProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Placeholder"
        value={String(block.props.placeholder || '')}
        onChange={(event) => updateBlockProps(block.id, { placeholder: event.target.value })}
      />
      <div className="rounded-lg border p-3 text-xs leading-5" style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-2)' }}>
        Questo blocco usa la ricerca reale del sito e apre la pagina risultati del tenant. Le varianti `dropdown`, `inline` o `AI` ricompariranno qui solo quando avranno un renderer dedicato reale.
      </div>
    </div>
  );
}

function BreakingTickerProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Label"
        value={String(block.props.label || 'ULTIMA ORA')}
        onChange={(event) => updateBlockProps(block.id, { label: event.target.value })}
      />
      <Slider
        label="Velocità"
        value={Number(block.props.speed || 50)}
        onChange={(value) => updateBlockProps(block.id, { speed: value })}
        min={10}
        max={120}
      />
    </div>
  );
}

function CategoryNavProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Stile"
        value={String(block.props.style || 'pills')}
        onChange={(event) => updateBlockProps(block.id, { style: event.target.value })}
        options={[
          { value: 'pills', label: 'Pills' },
          { value: 'inline', label: 'Inline' },
          { value: 'sidebar', label: 'Sidebar' },
          { value: 'dropdown', label: 'Dropdown' },
        ]}
      />
      <Select
        label="Modalità colori"
        value={String(block.props.colorMode || 'category')}
        onChange={(event) => updateBlockProps(block.id, { colorMode: event.target.value })}
        options={[
          { value: 'category', label: 'Colori categoria' },
          { value: 'neutral', label: 'Neutrale' },
          { value: 'accent', label: 'Accent' },
        ]}
      />
    </div>
  );
}

function EventListProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Limite"
        type="number"
        value={Number(block.props.limit || 5)}
        onChange={(event) => updateBlockProps(block.id, { limit: Number(event.target.value) || 5 })}
      />
      <Select
        label="Layout"
        value={String(block.props.layout || 'list')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'list', label: 'Lista' },
          { value: 'cards', label: 'Card' },
          { value: 'compact', label: 'Compatto' },
        ]}
      />
      <Toggle
        label="Mostra luogo"
        checked={block.props.showLocation !== false}
        onChange={(value) => updateBlockProps(block.id, { showLocation: value })}
      />
      <Toggle
        label="Mostra prezzo"
        checked={Boolean(block.props.showPrice)}
        onChange={(value) => updateBlockProps(block.id, { showPrice: value })}
      />
    </div>
  );
}

function RelatedContentProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Titolo sezione"
        value={String(block.props.title || '')}
        onChange={(event) => updateBlockProps(block.id, { title: event.target.value })}
      />
      <Input
        label="Colonne"
        type="number"
        value={Number(block.props.columns || 3)}
        onChange={(event) => updateBlockProps(block.id, { columns: Number(event.target.value) || 3 })}
      />
      <Select
        label="Stile card"
        value={String(block.props.cardStyle || 'elevated')}
        onChange={(event) => updateBlockProps(block.id, { cardStyle: event.target.value })}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'elevated', label: 'Elevated' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'outline', label: 'Outline' },
        ]}
      />
      <Toggle
        label="Mostra immagine"
        checked={block.props.showImage !== false}
        onChange={(value) => updateBlockProps(block.id, { showImage: value })}
      />
      <Toggle
        label="Mostra excerpt"
        checked={block.props.showExcerpt !== false}
        onChange={(value) => updateBlockProps(block.id, { showExcerpt: value })}
      />
      <Toggle
        label="Mostra data"
        checked={block.props.showDate !== false}
        onChange={(value) => updateBlockProps(block.id, { showDate: value })}
      />
      <JsonTextareaField
        key={`related-${JSON.stringify(block.props.items || [])}`}
        label="Items correlati"
        value={block.props.items || []}
        rows={10}
        helpText='Formato: [{"id":"1","title":"Titolo","excerpt":"Testo","image":"","url":"#","date":"2026-03-01"}]'
        onValidChange={(value) => updateBlockProps(block.id, { items: value as unknown[] })}
      />
    </div>
  );
}

function SidebarProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Posizione"
        value={String(block.props.position || 'right')}
        onChange={(event) => updateBlockProps(block.id, { position: event.target.value })}
        options={[
          { value: 'left', label: 'Sinistra' },
          { value: 'right', label: 'Destra' },
        ]}
      />
      <Toggle
        label="Sticky"
        checked={block.props.sticky !== false}
        onChange={(value) => updateBlockProps(block.id, { sticky: value })}
      />
      <JsonTextareaField
        key={`sidebar-${JSON.stringify(block.props.widgets || [])}`}
        label="Widget sidebar"
        value={block.props.widgets || []}
        rows={14}
        helpText='Formato: [{"id":"1","type":"search","title":"Cerca","props":{"placeholder":"Cerca..."}}]'
        onValidChange={(value) => updateBlockProps(block.id, { widgets: value as unknown[] })}
      />
    </div>
  );
}

function AuthorBioProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Nome"
        value={String(block.props.name || '')}
        onChange={(event) => updateBlockProps(block.id, { name: event.target.value })}
      />
      <Input
        label="Ruolo"
        value={String(block.props.role || '')}
        onChange={(event) => updateBlockProps(block.id, { role: event.target.value })}
      />
      <Input
        label="Avatar"
        value={String(block.props.avatar || '')}
        onChange={(event) => updateBlockProps(block.id, { avatar: event.target.value })}
      />
      <Textarea
        label="Bio"
        value={String(block.props.bio || '')}
        rows={5}
        onChange={(event) => updateBlockProps(block.id, { bio: event.target.value })}
      />
      <Select
        label="Layout"
        value={String(block.props.layout || 'horizontal')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'horizontal', label: 'Orizzontale' },
          { value: 'vertical', label: 'Verticale' },
        ]}
      />
      <JsonTextareaField
        key={`author-social-${JSON.stringify(block.props.socialLinks || [])}`}
        label="Link social"
        value={block.props.socialLinks || []}
        rows={6}
        helpText='Formato: [{"platform":"twitter","url":"#"}]'
        onValidChange={(value) => updateBlockProps(block.id, { socialLinks: value as unknown[] })}
      />
    </div>
  );
}

function ComparisonProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Immagine prima"
        value={String(block.props.beforeImage || '')}
        onChange={(event) => updateBlockProps(block.id, { beforeImage: event.target.value })}
      />
      <Input
        label="Immagine dopo"
        value={String(block.props.afterImage || '')}
        onChange={(event) => updateBlockProps(block.id, { afterImage: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Label prima"
          value={String(block.props.beforeLabel || '')}
          onChange={(event) => updateBlockProps(block.id, { beforeLabel: event.target.value })}
        />
        <Input
          label="Label dopo"
          value={String(block.props.afterLabel || '')}
          onChange={(event) => updateBlockProps(block.id, { afterLabel: event.target.value })}
        />
      </div>
      <Slider
        label="Posizione iniziale"
        value={Number(block.props.initialPosition || 50)}
        onChange={(value) => updateBlockProps(block.id, { initialPosition: value })}
        min={0}
        max={100}
        suffix="%"
      />
      <Select
        label="Orientamento"
        value={String(block.props.orientation || 'horizontal')}
        onChange={(event) => updateBlockProps(block.id, { orientation: event.target.value })}
        options={[
          { value: 'horizontal', label: 'Orizzontale' },
          { value: 'vertical', label: 'Verticale' },
        ]}
      />
    </div>
  );
}

function CounterProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Toggle
        label="Animato"
        checked={block.props.animated !== false}
        onChange={(value) => updateBlockProps(block.id, { animated: value })}
      />
      <Toggle
        label="Trigger on scroll"
        checked={block.props.triggerOnScroll !== false}
        onChange={(value) => updateBlockProps(block.id, { triggerOnScroll: value })}
      />
      <JsonTextareaField
        key={`counters-${JSON.stringify(block.props.counters || [])}`}
        label="Contatori"
        value={block.props.counters || []}
        rows={10}
        helpText='Formato: [{"id":"1","value":1500,"label":"Clienti","prefix":"","suffix":"+","duration":2000}]'
        onValidChange={(value) => updateBlockProps(block.id, { counters: value as unknown[] })}
      />
    </div>
  );
}

function AudioProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Sorgente"
        value={String(block.props.source || 'file')}
        onChange={(event) => updateBlockProps(block.id, { source: event.target.value })}
        options={[
          { value: 'file', label: 'File' },
          { value: 'url', label: 'URL' },
          { value: 'podcast', label: 'Podcast' },
        ]}
      />
      <Input
        label="URL audio"
        value={String(block.props.url || '')}
        onChange={(event) => updateBlockProps(block.id, { url: event.target.value })}
      />
      <Input
        label="Titolo"
        value={String(block.props.title || '')}
        onChange={(event) => updateBlockProps(block.id, { title: event.target.value })}
      />
      <Input
        label="Artista"
        value={String(block.props.artist || '')}
        onChange={(event) => updateBlockProps(block.id, { artist: event.target.value })}
      />
      <Input
        label="Cover"
        value={String(block.props.coverImage || '')}
        onChange={(event) => updateBlockProps(block.id, { coverImage: event.target.value })}
      />
      <Toggle
        label="Autoplay"
        checked={Boolean(block.props.autoplay)}
        onChange={(value) => updateBlockProps(block.id, { autoplay: value })}
      />
      <Toggle
        label="Loop"
        checked={Boolean(block.props.loop)}
        onChange={(value) => updateBlockProps(block.id, { loop: value })}
      />
      <Toggle
        label="Waveform"
        checked={block.props.showWaveform !== false}
        onChange={(value) => updateBlockProps(block.id, { showWaveform: value })}
      />
    </div>
  );
}

function VideoProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Select
        label="Sorgente"
        value={String(block.props.source || 'youtube')}
        onChange={(event) => updateBlockProps(block.id, { source: event.target.value })}
        options={[
          { value: 'youtube', label: 'YouTube' },
          { value: 'vimeo', label: 'Vimeo' },
          { value: 'file', label: 'File' },
        ]}
      />
      <Input
        label="URL"
        value={String(block.props.url || '')}
        onChange={(event) => updateBlockProps(block.id, { url: event.target.value })}
      />
      <Input
        label="Video ID"
        value={String(block.props.videoId || '')}
        onChange={(event) => updateBlockProps(block.id, { videoId: event.target.value })}
      />
      <Input
        label="Poster"
        value={String(block.props.poster || '')}
        onChange={(event) => updateBlockProps(block.id, { poster: event.target.value })}
      />
      <Input
        label="Aspect ratio"
        value={String(block.props.aspectRatio || '16/9')}
        onChange={(event) => updateBlockProps(block.id, { aspectRatio: event.target.value })}
      />
      <Select
        label="Object fit"
        value={String(block.props.objectFit || 'cover')}
        onChange={(event) => updateBlockProps(block.id, { objectFit: event.target.value })}
        options={[
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
        ]}
      />
      <Textarea
        label="Caption"
        value={String(block.props.caption || '')}
        rows={3}
        onChange={(event) => updateBlockProps(block.id, { caption: event.target.value })}
      />
      <Toggle label="Autoplay" checked={Boolean(block.props.autoplay)} onChange={(value) => updateBlockProps(block.id, { autoplay: value })} />
      <Toggle label="Loop" checked={Boolean(block.props.loop)} onChange={(value) => updateBlockProps(block.id, { loop: value })} />
      <Toggle label="Muted" checked={Boolean(block.props.muted)} onChange={(value) => updateBlockProps(block.id, { muted: value })} />
      <Toggle label="Controls" checked={block.props.controls !== false} onChange={(value) => updateBlockProps(block.id, { controls: value })} />
      <Toggle label="Picture in Picture" checked={Boolean(block.props.pip)} onChange={(value) => updateBlockProps(block.id, { pip: value })} />
      <JsonTextareaField
        key={`video-overlay-${JSON.stringify(block.props.overlay || {})}`}
        label="Overlay video"
        value={block.props.overlay || {}}
        rows={8}
        helpText='Formato: {"enabled":true,"title":"Video","description":"","playButtonStyle":"circle","playButtonSize":"large","color":"rgba(0,0,0,0.4)","position":"center"}'
        onValidChange={(value) => updateBlockProps(block.id, { overlay: value as Record<string, unknown> })}
      />
      <JsonTextareaField
        key={`video-thumbnail-${JSON.stringify(block.props.thumbnail || {})}`}
        label="Thumbnail"
        value={block.props.thumbnail || {}}
        rows={5}
        helpText='Formato: {"show":true,"text":"Guarda il video","style":"overlay"}'
        onValidChange={(value) => updateBlockProps(block.id, { thumbnail: value as Record<string, unknown> })}
      />
      <JsonTextareaField
        key={`video-chapters-${JSON.stringify(block.props.chapters || [])}`}
        label="Chapters"
        value={block.props.chapters || []}
        rows={6}
        helpText='Formato: [{"time":"00:00","title":"Intro"}]'
        onValidChange={(value) => updateBlockProps(block.id, { chapters: value as unknown[] })}
      />
    </div>
  );
}

function MapProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Indirizzo"
        value={String(block.props.address || '')}
        onChange={(event) => updateBlockProps(block.id, { address: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Lat"
          type="number"
          value={Number(block.props.lat || 45.4642)}
          onChange={(event) => updateBlockProps(block.id, { lat: Number(event.target.value) || 0 })}
        />
        <Input
          label="Lng"
          type="number"
          value={Number(block.props.lng || 9.19)}
          onChange={(event) => updateBlockProps(block.id, { lng: Number(event.target.value) || 0 })}
        />
      </div>
      <Input
        label="Zoom"
        type="number"
        value={Number(block.props.zoom || 14)}
        onChange={(event) => updateBlockProps(block.id, { zoom: Number(event.target.value) || 14 })}
      />
      <Input
        label="Altezza"
        value={String(block.props.height || '400px')}
        onChange={(event) => updateBlockProps(block.id, { height: event.target.value })}
      />
      <Select
        label="Map type"
        value={String(block.props.mapType || 'roadmap')}
        onChange={(event) => updateBlockProps(block.id, { mapType: event.target.value })}
        options={[
          { value: 'roadmap', label: 'Roadmap' },
          { value: 'satellite', label: 'Satellite' },
          { value: 'terrain', label: 'Terrain' },
        ]}
      />
      <Input
        label="Titolo marker"
        value={String(block.props.markerTitle || '')}
        onChange={(event) => updateBlockProps(block.id, { markerTitle: event.target.value })}
      />
      <Toggle
        label="Mostra marker"
        checked={block.props.showMarker !== false}
        onChange={(value) => updateBlockProps(block.id, { showMarker: value })}
      />
    </div>
  );
}

interface CmsFormOption {
  id: string;
  name: string;
  slug: string;
}

function mergeNavigationStyle(block: Block, style: TemplateBlockStyle): Block['style'] {
  return {
    layout: { ...block.style.layout, ...style.layout },
    background: { ...block.style.background, ...style.background },
    typography: { ...block.style.typography, ...style.typography },
    border: { ...block.style.border, ...style.border },
    shadow: style.shadow ?? block.style.shadow,
    opacity: style.opacity ?? block.style.opacity,
    transform: style.transform ?? block.style.transform,
    transition: style.transition ?? block.style.transition,
    filter: style.filter ?? block.style.filter,
    backdropFilter: style.backdropFilter ?? block.style.backdropFilter,
    mixBlendMode: style.mixBlendMode ?? block.style.mixBlendMode,
    textShadow: style.textShadow ?? block.style.textShadow,
    customCss: style.customCss ?? block.style.customCss,
    effects: style.effects ?? block.style.effects,
  };
}

function BlockTemplateSection({
  title,
  templates,
  activeTemplateId,
  onApply,
}: {
  title: string;
  templates: ContentBlockTemplate[];
  activeTemplateId: string;
  onApply: (templateId: string) => void;
}) {
  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-2)' }}>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
        {title}
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onApply(template.id)}
            className="text-left rounded-lg p-2 border transition-colors"
            style={{
              borderColor: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-border)',
              background: activeTemplateId === template.id ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
              color: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-text-1)',
            }}
          >
            <div className="text-xs font-semibold">{template.name}</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function applyContentTemplate(
  block: Block,
  updateBlock: (blockId: string, updates: Partial<Block>) => void,
  templateId: string,
  blockType: string,
  afterApply?: (template: ContentBlockTemplate) => void
) {
  const template = getContentBlockTemplate(blockType, templateId);
  if (!template) return;

  updateBlock(block.id, {
    props: {
      ...block.props,
      ...template.props,
      templateId,
    },
    style: mergeNavigationStyle(block, template.style),
  });

  afterApply?.(template);
}

function HeroProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const activeTemplateId = String(block.props.templateId || 'hero-editorial-impact');

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template hero"
        templates={HERO_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) => applyContentTemplate(block, updateBlock, templateId, 'hero')}
      />
      <Input label="Eyebrow" value={String(block.props.eyebrow || '')} onChange={(event) => updateBlockProps(block.id, { eyebrow: event.target.value })} />
      <Input label="Titolo" value={String(block.props.title || '')} onChange={(event) => updateBlockProps(block.id, { title: event.target.value })} />
      <Textarea label="Sottotitolo" value={String(block.props.subtitle || '')} rows={3} onChange={(event) => updateBlockProps(block.id, { subtitle: event.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Input label="CTA testo" value={String(block.props.ctaText || '')} onChange={(event) => updateBlockProps(block.id, { ctaText: event.target.value })} />
        <Input label="CTA URL" value={String(block.props.ctaUrl || '')} onChange={(event) => updateBlockProps(block.id, { ctaUrl: event.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Stile CTA"
          value={String(block.props.ctaStyle || 'primary')}
          onChange={(event) => updateBlockProps(block.id, { ctaStyle: event.target.value })}
          options={[
            { value: 'primary', label: 'Primary' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'outline', label: 'Outline' },
            { value: 'ghost', label: 'Ghost' },
          ]}
        />
        <Select
          label="Tag titolo"
          value={String(block.props.titleTag || 'h1')}
          onChange={(event) => updateBlockProps(block.id, { titleTag: event.target.value })}
          options={[
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
            { value: 'div', label: 'Div' },
          ]}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="CTA pad X" type="number" value={Number(block.props.ctaPaddingX || 22)} onChange={(event) => updateBlockProps(block.id, { ctaPaddingX: Number(event.target.value) })} />
        <Input label="CTA pad Y" type="number" value={Number(block.props.ctaPaddingY || 12)} onChange={(event) => updateBlockProps(block.id, { ctaPaddingY: Number(event.target.value) })} />
        <Input label="CTA raggio" type="number" value={Number(block.props.ctaRadius || 14)} onChange={(event) => updateBlockProps(block.id, { ctaRadius: Number(event.target.value) })} />
      </div>
      <Toggle label="CTA tutta larghezza" checked={Boolean(block.props.ctaFullWidth)} onChange={(value) => updateBlockProps(block.id, { ctaFullWidth: value })} />
      <div className="grid grid-cols-3 gap-2">
        <ColorPicker label="CTA sfondo" value={String(block.props.ctaBgColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaBgColor: value })} />
        <ColorPicker label="CTA testo" value={String(block.props.ctaTextColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaTextColor: value })} />
        <ColorPicker label="CTA bordo" value={String(block.props.ctaBorderColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaBorderColor: value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Allineamento testo"
          value={String(block.props.textAlign || 'center')}
          onChange={(event) => updateBlockProps(block.id, { textAlign: event.target.value })}
          options={[{ value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }]}
        />
        <Select
          label="Posizione contenuto"
          value={String(block.props.contentPosition || 'center')}
          onChange={(event) => updateBlockProps(block.id, { contentPosition: event.target.value })}
          options={[{ value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Larghezza contenuto" value={String(block.props.contentWidth || '800px')} onChange={(event) => updateBlockProps(block.id, { contentWidth: event.target.value })} />
        <Input label="Altezza hero" value={String(block.props.height || '60vh')} onChange={(event) => updateBlockProps(block.id, { height: event.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="Pad contenuto X" type="number" value={Number(block.props.contentPaddingX || 32)} onChange={(event) => updateBlockProps(block.id, { contentPaddingX: Number(event.target.value) })} />
        <Input label="Pad contenuto Y" type="number" value={Number(block.props.contentPaddingY || 32)} onChange={(event) => updateBlockProps(block.id, { contentPaddingY: Number(event.target.value) })} />
        <Input label="Gap interno" type="number" value={Number(block.props.contentGap || 16)} onChange={(event) => updateBlockProps(block.id, { contentGap: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset contenuto X" type="number" value={Number(block.props.contentOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetX: Number(event.target.value) })} />
        <Input label="Offset contenuto Y" type="number" value={Number(block.props.contentOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetY: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset CTA X" type="number" value={Number(block.props.ctaOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { ctaOffsetX: Number(event.target.value) })} />
        <Input label="Offset CTA Y" type="number" value={Number(block.props.ctaOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { ctaOffsetY: Number(event.target.value) })} />
      </div>
      <Select
        label="Stile pannello"
        value={String(block.props.panelStyle || 'none')}
        onChange={(event) => updateBlockProps(block.id, { panelStyle: event.target.value })}
        options={[
          { value: 'none', label: 'Nessuno' },
          { value: 'glass', label: 'Glass' },
          { value: 'solid-dark', label: 'Dark panel' },
          { value: 'solid-light', label: 'Light panel' },
        ]}
      />
      <Input label="URL sfondo" value={String(block.props.backgroundImage || '')} onChange={(event) => updateBlockProps(block.id, { backgroundImage: event.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <ColorPicker label="Eyebrow sfondo" value={String(block.props.eyebrowBgColor || '')} onChange={(value) => updateBlockProps(block.id, { eyebrowBgColor: value })} />
        <ColorPicker label="Eyebrow testo" value={String(block.props.eyebrowTextColor || '')} onChange={(value) => updateBlockProps(block.id, { eyebrowTextColor: value })} />
      </div>
      <ColorPicker label="Colore overlay" value={String(block.props.overlayColor || '#000000')} onChange={(value) => updateBlockProps(block.id, { overlayColor: value })} />
      <Slider label="Overlay" value={Math.round(Number(block.props.overlayOpacity || 0.5) * 100)} onChange={(value) => updateBlockProps(block.id, { overlayOpacity: value / 100 })} min={0} max={100} suffix="%" />
    </div>
  );
}

function HeroCtaProperties({ block, onBack }: { block: Block; onBack: () => void }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>Elemento interno</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>CTA Hero selezionato</div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
        >
          Torna al blocco
        </button>
      </div>

      <Input label="CTA testo" value={String(block.props.ctaText || '')} onChange={(event) => updateBlockProps(block.id, { ctaText: event.target.value })} />
      <Input label="CTA URL" value={String(block.props.ctaUrl || '')} onChange={(event) => updateBlockProps(block.id, { ctaUrl: event.target.value })} />
      <Select
        label="Stile CTA"
        value={String(block.props.ctaStyle || 'primary')}
        onChange={(event) => updateBlockProps(block.id, { ctaStyle: event.target.value })}
        options={[
          { value: 'primary', label: 'Primary' },
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input label="CTA pad X" type="number" value={Number(block.props.ctaPaddingX || 22)} onChange={(event) => updateBlockProps(block.id, { ctaPaddingX: Number(event.target.value) })} />
        <Input label="CTA pad Y" type="number" value={Number(block.props.ctaPaddingY || 12)} onChange={(event) => updateBlockProps(block.id, { ctaPaddingY: Number(event.target.value) })} />
        <Input label="CTA raggio" type="number" value={Number(block.props.ctaRadius || 14)} onChange={(event) => updateBlockProps(block.id, { ctaRadius: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset CTA X" type="number" value={Number(block.props.ctaOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { ctaOffsetX: Number(event.target.value) })} />
        <Input label="Offset CTA Y" type="number" value={Number(block.props.ctaOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { ctaOffsetY: Number(event.target.value) })} />
      </div>
      <Toggle label="CTA tutta larghezza" checked={Boolean(block.props.ctaFullWidth)} onChange={(value) => updateBlockProps(block.id, { ctaFullWidth: value })} />
      <div className="grid grid-cols-3 gap-2">
        <ColorPicker label="CTA sfondo" value={String(block.props.ctaBgColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaBgColor: value })} />
        <ColorPicker label="CTA testo" value={String(block.props.ctaTextColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaTextColor: value })} />
        <ColorPicker label="CTA bordo" value={String(block.props.ctaBorderColor || '')} onChange={(value) => updateBlockProps(block.id, { ctaBorderColor: value })} />
      </div>
    </div>
  );
}

function ArticleHeroProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const { currentTenant } = useAuthStore();
  const activeTemplateId = String(block.props.templateId || 'article-hero-cover-story');
  const config = getArticleEditorialConfig(block);
  const heroPreviewSource = buildArticleDataSourceFromConfig({
    ...config,
    limit: 1,
  });
  const { data: previewData, loading: previewLoading } = useEditorBlockPreviewData(currentTenant?.id, heroPreviewSource);
  const previewArticles = previewData as EditorialArticleOption[];

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template hero articolo"
        templates={ARTICLE_HERO_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) =>
          applyContentTemplate(block, updateBlock, templateId, 'article-hero', (template) => {
            updateArticleEditorialBlock(block, updateBlock, {
              ...template.props,
              templateId,
            }, 1);
          })
        }
      />

      <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <CmsManagedNotice
          title="Sorgente hero editoriale"
          description={`${describeArticleEditorialConfig(config)} Per cambiare categoria, placement o articolo sorgente usa il CMS online.`}
          actionLabel="Apri CMS contenuti"
          onAction={() => goToCmsSection('/dashboard/layout/content')}
        />

        <Input label="Altezza" value={String(block.props.height || '500px')} onChange={(event) => updateBlockProps(block.id, { height: event.target.value })} />

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-2)' }}>
            Anteprima Contenuto
          </div>
          {previewLoading ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>Caricamento anteprima CMS...</p>
          ) : previewArticles[0] ? (
            <div className="mt-2 space-y-1">
              <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>{previewArticles[0].title}</div>
              <div className="text-xs" style={{ color: 'var(--c-text-2)' }}>
                {describeArticleEditorialConfig(config)}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>
              Nessun articolo trovato con la regola attuale.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Allineamento contenuto"
          value={String(block.props.contentAlign || 'left')}
          onChange={(event) => updateBlockProps(block.id, { contentAlign: event.target.value })}
          options={[{ value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }]}
        />
        <Input label="Larghezza contenuto" value={String(block.props.contentWidth || '780px')} onChange={(event) => updateBlockProps(block.id, { contentWidth: event.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset contenuto X" type="number" value={Number(block.props.contentOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetX: Number(event.target.value) })} />
        <Input label="Offset contenuto Y" type="number" value={Number(block.props.contentOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetY: Number(event.target.value) })} />
      </div>
      <Select
        label="Stile pannello"
        value={String(block.props.panelStyle || 'none')}
        onChange={(event) => updateBlockProps(block.id, { panelStyle: event.target.value })}
        options={[
          { value: 'none', label: 'Nessuno' },
          { value: 'glass', label: 'Glass' },
          { value: 'solid-dark', label: 'Dark panel' },
        ]}
      />
      <Slider label="Overlay" value={Math.round(Number(block.props.overlayOpacity || 0.5) * 100)} onChange={(value) => updateBlockProps(block.id, { overlayOpacity: value / 100 })} min={0} max={100} suffix="%" />
      <Toggle label="Usa featured" checked={(block.props.useFeatured as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { useFeatured: value })} />
      <Toggle label="Categoria" checked={(block.props.showCategory as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showCategory: value })} />
      <Toggle label="Autore" checked={(block.props.showAuthor as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showAuthor: value })} />
      <Toggle label="Data" checked={(block.props.showDate as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showDate: value })} />
      <Toggle label="Excerpt" checked={(block.props.showExcerpt as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showExcerpt: value })} />
    </div>
  );
}

function ArticleGridProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const { currentTenant } = useAuthStore();
  const activeTemplateId = String(block.props.templateId || 'article-grid-newsroom-3');
  const config = getArticleEditorialConfig(block);
  const limit = Math.max(1, Number(block.props.limit || 9));
  const gridPreviewSource = buildArticleDataSourceFromConfig({
    ...config,
    limit,
  });
  const { data: previewData, loading: previewLoading } = useEditorBlockPreviewData(currentTenant?.id, gridPreviewSource);
  const previewArticles = previewData as EditorialArticleOption[];

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template griglia articoli"
        templates={ARTICLE_GRID_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) =>
          applyContentTemplate(block, updateBlock, templateId, 'article-grid', (template) => {
            updateArticleEditorialBlock(block, updateBlock, {
              ...template.props,
              templateId,
            });
          })
        }
      />

      <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <CmsManagedNotice
          title="Sorgente griglia editoriale"
          description={`${describeArticleEditorialConfig(config)} Categoria, tag, placement e selezione manuale ora si gestiscono solo dal CMS online.`}
          actionLabel="Apri CMS contenuti"
          onAction={() => goToCmsSection('/dashboard/layout/content')}
        />

        <Input
          label="Numero articoli"
          type="number"
          value={limit}
          onChange={(event) => {
            const nextLimit = Number(event.target.value) || 1;
            updateArticleEditorialBlock(block, updateBlock, { limit: nextLimit }, nextLimit);
          }}
        />

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-2)' }}>
            Anteprima Contenuti
          </div>
          {previewLoading ? (
            <p className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>Caricamento anteprima CMS...</p>
          ) : previewArticles.length > 0 ? (
            <div className="mt-2 space-y-2">
              {previewArticles.slice(0, 4).map((article, index) => (
                <div key={article.id || `${article.title}-${index}`} className="text-xs">
                  <div className="font-semibold" style={{ color: 'var(--c-text-0)' }}>{article.title}</div>
                  <div style={{ color: 'var(--c-text-2)' }}>
                    {config.sourceMode === 'mixed' && index < config.manualArticleIds.length ? 'Curato manualmente dal CMS' : describeArticleEditorialConfig(config)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>
              Nessun articolo disponibile con i filtri correnti.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Colonne" type="number" value={Number(block.props.columns || 3)} onChange={(event) => updateBlockProps(block.id, { columns: Number(event.target.value) })} />
        <Select
          label="Card style"
          value={String(block.props.cardStyle || 'default')}
          onChange={(event) => updateBlockProps(block.id, { cardStyle: event.target.value })}
          options={[
            { value: 'default', label: 'Default' },
            { value: 'magazine', label: 'Magazine' },
            { value: 'compact', label: 'Compatta' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'overlay', label: 'Overlay' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Aspect ratio" value={String(block.props.imageAspectRatio || '16/9')} onChange={(event) => updateBlockProps(block.id, { imageAspectRatio: event.target.value })} />
        <Input label="Padding card" value={String(block.props.cardPadding || '16px')} onChange={(event) => updateBlockProps(block.id, { cardPadding: event.target.value })} />
      </div>
      <Toggle label="Immagine" checked={(block.props.showImage as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showImage: value })} />
      <Toggle label="Excerpt" checked={(block.props.showExcerpt as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showExcerpt: value })} />
      <Toggle label="Categoria" checked={(block.props.showCategory as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showCategory: value })} />
      <Toggle label="Autore" checked={(block.props.showAuthor as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showAuthor: value })} />
      <Toggle label="Data" checked={(block.props.showDate as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showDate: value })} />
    </div>
  );
}

function SlideshowProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const activeTemplateId = String(block.props.templateId || 'slideshow-editorial-hero');
  const slides = Array.isArray(block.props.slides) ? (block.props.slides as Array<Record<string, unknown>>) : [];
  const updateSlide = (index: number, updater: (slide: Record<string, unknown>) => Record<string, unknown>) => {
    updateBlockProps(block.id, {
      slides: slides.map((slide, slideIndex) => (slideIndex === index ? updater(slide) : slide)),
    });
  };

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template slideshow"
        templates={SLIDESHOW_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) => applyContentTemplate(block, updateBlock, templateId, 'slideshow')}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Altezza" value={String(block.props.height || '500px')} onChange={(event) => updateBlockProps(block.id, { height: event.target.value })} />
        <Input label="Intervallo ms" type="number" value={Number(block.props.interval || 5000)} onChange={(event) => updateBlockProps(block.id, { interval: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Posizione contenuto"
          value={String(block.props.contentPosition || 'bottom-left')}
          onChange={(event) => updateBlockProps(block.id, { contentPosition: event.target.value })}
          options={[
            { value: 'bottom-left', label: 'Bottom left' },
            { value: 'center-left', label: 'Center left' },
            { value: 'center', label: 'Center' },
          ]}
        />
        <Select
          label="Stile frecce"
          value={String(block.props.arrowStyle || 'circle')}
          onChange={(event) => updateBlockProps(block.id, { arrowStyle: event.target.value })}
          options={[
            { value: 'circle', label: 'Circle' },
            { value: 'square', label: 'Square' },
            { value: 'minimal', label: 'Minimal' },
          ]}
        />
      </div>
      <Select
        label="Pannello testo"
        value={String(block.props.panelStyle || 'none')}
        onChange={(event) => updateBlockProps(block.id, { panelStyle: event.target.value })}
        options={[
          { value: 'none', label: 'Nessuno' },
          { value: 'glass', label: 'Glass' },
          { value: 'solid-dark', label: 'Dark panel' },
          { value: 'solid-light', label: 'Light panel' },
        ]}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
            Slide reali
          </h4>
          <button
            type="button"
            onClick={() =>
              updateBlockProps(block.id, {
                slides: [
                  ...slides,
                  {
                    id: generateId(),
                    image: '',
                    title: 'Nuova slide',
                    description: '',
                    overlay: { enabled: true, color: 'rgba(2,6,23,0.28)' },
                    buttons: [{ id: generateId(), text: 'Apri', url: '#', style: 'primary' }],
                  },
                ],
              })
            }
            className="rounded-lg px-2 py-1 text-xs font-medium"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          >
            + Aggiungi
          </button>
        </div>
        {slides.map((slide, index) => {
          const buttons = Array.isArray(slide.buttons) ? (slide.buttons as Array<Record<string, unknown>>) : [];
          const primaryButton = buttons[0] || {};
          return (
            <div key={String(slide.id || index)} className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>
                  Slide {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => updateBlockProps(block.id, { slides: slides.filter((_, slideIndex) => slideIndex !== index) })}
                  className="rounded px-2 py-1 text-[11px]"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                >
                  Rimuovi
                </button>
              </div>
              <Input
                label="Titolo slide"
                value={String(slide.title || '')}
                onChange={(event) => updateSlide(index, (current) => ({ ...current, title: event.target.value }))}
              />
              <Textarea
                label="Descrizione slide"
                rows={3}
                value={String(slide.description || '')}
                onChange={(event) => updateSlide(index, (current) => ({ ...current, description: event.target.value }))}
              />
              <Input
                label="Immagine"
                value={String(slide.image || '')}
                onChange={(event) => updateSlide(index, (current) => ({ ...current, image: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="CTA testo"
                  value={String(primaryButton.text || '')}
                  onChange={(event) =>
                    updateSlide(index, (current) => ({
                      ...current,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), text: event.target.value }],
                    }))
                  }
                />
                <Input
                  label="CTA URL"
                  value={String(primaryButton.url || '')}
                  onChange={(event) =>
                    updateSlide(index, (current) => ({
                      ...current,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), url: event.target.value }],
                    }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <JsonTextareaField
        label="Slide JSON avanzato"
        value={block.props.slides || []}
        rows={12}
        helpText='Formato: [{"id":"1","image":"https://...","title":"Titolo","description":"Testo","buttons":[{"id":"cta1","text":"Apri","url":"#","style":"primary"}]}]'
        onValidChange={(value) => updateBlockProps(block.id, { slides: value as unknown[] })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset contenuto X" type="number" value={Number(block.props.contentOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetX: Number(event.target.value) })} />
        <Input label="Offset contenuto Y" type="number" value={Number(block.props.contentOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { contentOffsetY: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset pulsanti X" type="number" value={Number(block.props.buttonsOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { buttonsOffsetX: Number(event.target.value) })} />
        <Input label="Offset pulsanti Y" type="number" value={Number(block.props.buttonsOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { buttonsOffsetY: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="CTA pad X" type="number" value={Number(block.props.buttonPaddingX || 16)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })} />
        <Input label="CTA pad Y" type="number" value={Number(block.props.buttonPaddingY || 12)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })} />
        <Input label="CTA raggio" type="number" value={Number(block.props.buttonRadius || 12)} onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ColorPicker label="CTA sfondo" value={String(block.props.buttonBgColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBgColor: value })} />
        <ColorPicker label="CTA testo" value={String(block.props.buttonTextColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonTextColor: value })} />
        <ColorPicker label="CTA bordo" value={String(block.props.buttonBorderColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBorderColor: value })} />
      </div>
      <Toggle label="Autoplay" checked={Boolean(block.props.autoplay)} onChange={(value) => updateBlockProps(block.id, { autoplay: value })} />
      <Toggle label="Dots" checked={(block.props.showDots as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showDots: value })} />
      <Toggle label="Arrows" checked={(block.props.showArrows as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showArrows: value })} />
    </div>
  );
}

function ImageGalleryProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const activeTemplateId = String(block.props.templateId || 'gallery-editorial-grid');
  const items = Array.isArray(block.props.items || block.props.images) ? ((block.props.items || block.props.images) as Array<Record<string, unknown>>) : [];
  const updateItem = (index: number, updater: (item: Record<string, unknown>) => Record<string, unknown>) => {
    updateBlockProps(block.id, {
      items: items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)),
    });
  };

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template galleria"
        templates={IMAGE_GALLERY_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) => applyContentTemplate(block, updateBlock, templateId, 'image-gallery')}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Layout"
          value={String(block.props.layout || 'grid')}
          onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
          options={[{ value: 'grid', label: 'Grid' }, { value: 'masonry', label: 'Masonry' }]}
        />
        <Input label="Colonne" type="number" value={Number(block.props.columns || 3)} onChange={(event) => updateBlockProps(block.id, { columns: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Gap" value={String(block.props.gap || '12px')} onChange={(event) => updateBlockProps(block.id, { gap: event.target.value })} />
        <Input label="Aspect ratio" value={String(block.props.aspectRatio || '4/3')} onChange={(event) => updateBlockProps(block.id, { aspectRatio: event.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input label="Raggio" value={String(block.props.borderRadius || '8px')} onChange={(event) => updateBlockProps(block.id, { borderRadius: event.target.value })} />
        <Select
          label="Hover"
          value={String(block.props.hoverEffect || 'zoom')}
          onChange={(event) => updateBlockProps(block.id, { hoverEffect: event.target.value })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'zoom', label: 'Zoom' },
            { value: 'fade', label: 'Fade' },
          ]}
        />
      </div>
      <Toggle label="Mostra caption" checked={(block.props.showCaptions as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showCaptions: value })} />
      <Select
        label="Posizione caption"
        value={String(block.props.captionPosition || 'below')}
        onChange={(event) => updateBlockProps(block.id, { captionPosition: event.target.value })}
        options={[
          { value: 'below', label: 'Sotto' },
          { value: 'overlay', label: 'Overlay' },
        ]}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input label="CTA pad X" type="number" value={Number(block.props.buttonPaddingX || 14)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })} />
        <Input label="CTA pad Y" type="number" value={Number(block.props.buttonPaddingY || 10)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })} />
        <Input label="CTA raggio" type="number" value={Number(block.props.buttonRadius || 12)} onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ColorPicker label="CTA sfondo" value={String(block.props.buttonBgColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBgColor: value })} />
        <ColorPicker label="CTA testo" value={String(block.props.buttonTextColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonTextColor: value })} />
        <ColorPicker label="CTA bordo" value={String(block.props.buttonBorderColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBorderColor: value })} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
            Elementi reali
          </h4>
          <button
            type="button"
            onClick={() =>
              updateBlockProps(block.id, {
                items: [
                  ...items,
                  {
                    id: generateId(),
                    src: '',
                    caption: 'Nuova immagine',
                    link: '#',
                    badge: '',
                    overlay: { enabled: false, title: '', description: '', position: 'bottom' },
                    buttons: [{ id: generateId(), text: 'Apri', url: '#', style: 'primary' }],
                  },
                ],
              })
            }
            className="rounded-lg px-2 py-1 text-xs font-medium"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          >
            + Aggiungi
          </button>
        </div>
        {items.map((item, index) => {
          const overlay = (typeof item.overlay === 'object' && item.overlay !== null ? item.overlay : {}) as Record<string, unknown>;
          const buttons = Array.isArray(item.buttons) ? (item.buttons as Array<Record<string, unknown>>) : [];
          const primaryButton = buttons[0] || {};
          return (
            <div key={String(item.id || index)} className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>
                  Elemento {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => updateBlockProps(block.id, { items: items.filter((_, itemIndex) => itemIndex !== index) })}
                  className="rounded px-2 py-1 text-[11px]"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                >
                  Rimuovi
                </button>
              </div>
              <Input
                label="Immagine"
                value={String(item.src || item.url || '')}
                onChange={(event) => updateItem(index, (current) => ({ ...current, src: event.target.value, url: event.target.value }))}
              />
              <Input
                label="Didascalia"
                value={String(item.caption || '')}
                onChange={(event) => updateItem(index, (current) => ({ ...current, caption: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Link"
                  value={String(item.link || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, link: event.target.value }))}
                />
                <Input
                  label="Badge"
                  value={String(item.badge || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, badge: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Overlay titolo"
                  value={String(overlay.title || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, overlay: { ...overlay, enabled: true, title: event.target.value } }))}
                />
                <Input
                  label="CTA testo"
                  value={String(primaryButton.text || '')}
                  onChange={(event) =>
                    updateItem(index, (current) => ({
                      ...current,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), text: event.target.value }],
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Textarea
                  label="Overlay descrizione"
                  rows={2}
                  value={String(overlay.description || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, overlay: { ...overlay, enabled: true, description: event.target.value } }))}
                />
                <Input
                  label="CTA URL"
                  value={String(primaryButton.url || '')}
                  onChange={(event) =>
                    updateItem(index, (current) => ({
                      ...current,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), url: event.target.value }],
                    }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <JsonTextareaField
        label="Elementi galleria JSON avanzato"
        value={block.props.items || block.props.images || []}
        rows={12}
        helpText='Formato: [{"id":"1","src":"https://...","caption":"Didascalia","link":"#","badge":"VIDEO","overlay":{"enabled":true,"title":"Titolo","description":"Testo","position":"bottom"},"buttons":[{"id":"b1","text":"Apri","url":"#","style":"primary"}]}]'
        onValidChange={(value) => updateBlockProps(block.id, { items: value as unknown[] })}
      />
    </div>
  );
}

function CarouselProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const activeTemplateId = String(block.props.templateId || 'carousel-editorial-rail');
  const items = Array.isArray(block.props.items) ? (block.props.items as Array<Record<string, unknown>>) : [];
  const updateItem = (index: number, updater: (item: Record<string, unknown>) => Record<string, unknown>) => {
    updateBlockProps(block.id, {
      items: items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)),
    });
  };

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template carosello"
        templates={CAROUSEL_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) => applyContentTemplate(block, updateBlock, templateId, 'carousel')}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Larghezza card" value={String(block.props.cardWidth || '300px')} onChange={(event) => updateBlockProps(block.id, { cardWidth: event.target.value })} />
        <Input label="Gap" value={String(block.props.gap || '1rem')} onChange={(event) => updateBlockProps(block.id, { gap: event.target.value })} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
            Card reali
          </h4>
          <button
            type="button"
            onClick={() =>
              updateBlockProps(block.id, {
                items: [
                  ...items,
                  {
                    id: generateId(),
                    title: 'Nuova card',
                    excerpt: '',
                    image: '',
                    category: '',
                    badge: '',
                    url: '#',
                    buttons: [{ id: generateId(), text: 'Apri', url: '#', style: 'primary' }],
                  },
                ],
              })
            }
            className="rounded-lg px-2 py-1 text-xs font-medium"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          >
            + Aggiungi
          </button>
        </div>
        {items.map((item, index) => {
          const buttons = Array.isArray(item.buttons) ? (item.buttons as Array<Record<string, unknown>>) : [];
          const primaryButton = buttons[0] || {};
          return (
            <div key={String(item.id || index)} className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold" style={{ color: 'var(--c-text-1)' }}>
                  Card {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => updateBlockProps(block.id, { items: items.filter((_, itemIndex) => itemIndex !== index) })}
                  className="rounded px-2 py-1 text-[11px]"
                  style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
                >
                  Rimuovi
                </button>
              </div>
              <Input
                label="Titolo card"
                value={String(item.title || '')}
                onChange={(event) => updateItem(index, (current) => ({ ...current, title: event.target.value }))}
              />
              <Textarea
                label="Excerpt"
                rows={3}
                value={String(item.excerpt || '')}
                onChange={(event) => updateItem(index, (current) => ({ ...current, excerpt: event.target.value }))}
              />
              <Input
                label="Immagine"
                value={String(item.image || '')}
                onChange={(event) => updateItem(index, (current) => ({ ...current, image: event.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Categoria"
                  value={String(item.category || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, category: event.target.value }))}
                />
                <Input
                  label="Badge"
                  value={String(item.badge || '')}
                  onChange={(event) => updateItem(index, (current) => ({ ...current, badge: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="CTA testo"
                  value={String(primaryButton.text || '')}
                  onChange={(event) =>
                    updateItem(index, (current) => ({
                      ...current,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), text: event.target.value }],
                    }))
                  }
                />
                <Input
                  label="CTA URL"
                  value={String(primaryButton.url || item.url || '')}
                  onChange={(event) =>
                    updateItem(index, (current) => ({
                      ...current,
                      url: event.target.value,
                      buttons: [{ ...primaryButton, id: String(primaryButton.id || generateId()), url: event.target.value }],
                    }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
      <JsonTextareaField
        label="Card carosello JSON avanzato"
        value={block.props.items || []}
        rows={12}
        helpText='Formato: [{"id":"1","title":"Titolo","excerpt":"Testo","image":"https://...","url":"#","badge":"NEW","buttons":[{"id":"cta1","text":"Leggi","url":"#","style":"primary"}]}]'
        onValidChange={(value) => updateBlockProps(block.id, { items: value as unknown[] })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Offset comandi X" type="number" value={Number(block.props.controlsOffsetX || 0)} onChange={(event) => updateBlockProps(block.id, { controlsOffsetX: Number(event.target.value) })} />
        <Input label="Offset comandi Y" type="number" value={Number(block.props.controlsOffsetY || 0)} onChange={(event) => updateBlockProps(block.id, { controlsOffsetY: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="CTA pad X" type="number" value={Number(block.props.buttonPaddingX || 14)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })} />
        <Input label="CTA pad Y" type="number" value={Number(block.props.buttonPaddingY || 10)} onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })} />
        <Input label="CTA raggio" type="number" value={Number(block.props.buttonRadius || 12)} onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ColorPicker label="CTA sfondo" value={String(block.props.buttonBgColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBgColor: value })} />
        <ColorPicker label="CTA testo" value={String(block.props.buttonTextColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonTextColor: value })} />
        <ColorPicker label="CTA bordo" value={String(block.props.buttonBorderColor || '')} onChange={(value) => updateBlockProps(block.id, { buttonBorderColor: value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Card style"
          value={String(block.props.cardStyle || 'elevated')}
          onChange={(event) => updateBlockProps(block.id, { cardStyle: event.target.value })}
          options={[
            { value: 'elevated', label: 'Elevated' },
            { value: 'compact', label: 'Compatto' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <Select
          label="Frecce"
          value={String(block.props.arrowStyle || 'circle')}
          onChange={(event) => updateBlockProps(block.id, { arrowStyle: event.target.value })}
          options={[
            { value: 'circle', label: 'Circle' },
            { value: 'square', label: 'Square' },
            { value: 'minimal', label: 'Minimal' },
          ]}
        />
      </div>
      <Toggle label="Arrows" checked={(block.props.showArrows as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showArrows: value })} />
      <Toggle label="Dots" checked={(block.props.showDots as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showDots: value })} />
      <Toggle label="Categoria" checked={(block.props.showCategory as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showCategory: value })} />
      <Toggle label="Data" checked={(block.props.showDate as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showDate: value })} />
      <Toggle label="Autore" checked={(block.props.showAuthor as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showAuthor: value })} />
      <Toggle label="Excerpt" checked={(block.props.showExcerpt as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showExcerpt: value })} />
    </div>
  );
}

function BannerZoneProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const { currentTenant } = useAuthStore();
  const activeTemplateId = String(block.props.templateId || 'banner-sidebar-single');
  const props = block.props as Record<string, unknown>;
  const sourceMode = normalizeBannerSourceMode(props.sourceMode);
  const previewSource = buildBannerDataSourceFromProps(props);
  const { data: previewData, loading: previewLoading } = useEditorBlockPreviewData(currentTenant?.id, previewSource);
  const previewBanners = previewData as EditorialBannerOption[];
  const customImageUrl = String(props.customImageUrl || '');
  const customHtml = String(props.customHtml || '');

  return (
    <div className="space-y-3">
      <BlockTemplateSection
        title="Template zona banner"
        templates={BANNER_ZONE_TEMPLATES}
        activeTemplateId={activeTemplateId}
        onApply={(templateId) =>
          applyContentTemplate(block, updateBlock, templateId, 'banner-zone', (template) => {
            updateBannerBlock(block, updateBlock, {
              ...template.props,
              templateId,
            });
          })
        }
      />

      <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <CmsManagedNotice
          title="Sorgente advertising"
          description={`${describeBannerEditorialConfig(sourceMode)} Posizioni, clienti, categorie banner e creativita ora si governano dal CMS online.`}
          actionLabel="Apri CMS ADV"
          onAction={() => goToCmsSection('/dashboard/banner')}
        />

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--c-text-2)' }}>
            Anteprima ADV
          </div>
          {sourceMode === 'custom' ? (
            customImageUrl || customHtml ? (
              <div className="mt-2 text-xs" style={{ color: 'var(--c-text-0)' }}>
                Creativita fissa pronta nel blocco{customImageUrl ? ' con immagine caricata' : ' con HTML personalizzato'}.
              </div>
            ) : (
              <div className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>
                Nessuna creativita fissa caricata ancora.
              </div>
            )
          ) : previewLoading ? (
            <div className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>Caricamento banner...</div>
          ) : previewBanners.length > 0 ? (
            <div className="mt-2 space-y-1">
              {previewBanners.slice(0, 3).map((banner) => (
                <div key={banner.id} className="text-xs" style={{ color: 'var(--c-text-0)' }}>
                  {banner.name} <span style={{ color: 'var(--c-text-2)' }}>· {banner.position}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs" style={{ color: 'var(--c-text-2)' }}>
              Nessun banner attivo trovato con i filtri attuali.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Max visibili" type="number" value={Number(block.props.maxVisible || 1)} onChange={(event) => updateBlockProps(block.id, { maxVisible: Number(event.target.value) })} />
        <Input label="Gap px" type="number" value={Number(block.props.gap || 12)} onChange={(event) => updateBlockProps(block.id, { gap: Number(event.target.value) })} />
      </div>
      <Input label="Min larghezza item" type="number" value={Number(block.props.minItemWidth || 220)} onChange={(event) => updateBlockProps(block.id, { minItemWidth: Number(event.target.value) })} />
      <Toggle label="Riga scorrevole" checked={Boolean(block.props.scrollingRow)} onChange={(value) => updateBlockProps(block.id, { scrollingRow: value })} />
      <Toggle label="Frame card" checked={Boolean(block.props.cardFrame)} onChange={(value) => updateBlockProps(block.id, { cardFrame: value })} />
      <Textarea label="Fallback HTML" value={String(block.props.fallbackHtml || '')} rows={5} onChange={(event) => updateBlockProps(block.id, { fallbackHtml: event.target.value })} />
    </div>
  );
}

function NavigationProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const mode = String(block.props.mode || 'custom');
  const menuKey = String(block.props.menuKey || 'primary');
  const items = Array.isArray(block.props.items) ? (block.props.items as SiteMenuItem[]) : [];
  const layout = String(block.props.layout || 'horizontal');
  const activeTemplateId = String(block.props.templateId || 'top-classic');
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const groupedTemplates = {
    top: NAVIGATION_TEMPLATES.filter((template) => template.group === 'top'),
    bottom: NAVIGATION_TEMPLATES.filter((template) => template.group === 'bottom'),
    side: NAVIGATION_TEMPLATES.filter((template) => template.group === 'side'),
    mixed: NAVIGATION_TEMPLATES.filter((template) => template.group === 'mixed'),
  };

  const syncDataSource = (nextMode: string, nextMenuKey: string) => {
    updateBlock(block.id, {
      dataSource: nextMode === 'global'
        ? {
            endpoint: 'site-navigation',
            params: { menu: nextMenuKey },
          }
        : undefined,
    });
  };

  const switchToCustomMode = () => {
    updateBlock(block.id, {
      props: {
        ...block.props,
        mode: 'custom',
      },
      dataSource: undefined,
    });
  };

  const switchToGlobalMode = () => {
    updateBlock(block.id, {
      props: {
        ...block.props,
        mode: 'global',
      },
      dataSource: {
        endpoint: 'site-navigation',
        params: { menu: menuKey },
      },
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = getNavigationTemplate(templateId);
    if (!template) return;

    updateBlock(block.id, {
      props: {
        ...block.props,
        ...template.props,
        templateId,
        mode: 'custom',
        menuKey,
        items: cloneNavigationItems(template.items),
      },
      style: mergeNavigationStyle(block, template.style),
      dataSource: undefined,
    });
  };

  const updateCustomItems = (nextItems: SiteMenuItem[]) => {
    updateBlockProps(block.id, { items: nextItems });
  };

  const reorderCustomItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const nextItems = [...items];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);
    updateCustomItems(nextItems);
    setSelectedItemIndex(toIndex);
  };

  const updateCustomItem = (index: number, updates: Partial<SiteMenuItem>) => {
    updateCustomItems(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)));
  };

  const duplicateCustomItem = (index: number) => {
    const item = items[index];
    if (!item) return;
    const duplicate = {
      ...item,
      id: generateId(),
      label: `${item.label} copia`,
    };
    const nextItems = [...items];
    nextItems.splice(index + 1, 0, duplicate);
    updateCustomItems(nextItems);
    setSelectedItemIndex(index + 1);
  };

  const removeCustomItem = (index: number) => {
    updateCustomItems(items.filter((_, itemIndex) => itemIndex !== index));
    setSelectedItemIndex((current) => Math.max(0, Math.min(current, items.length - 2)));
  };

  const normalizedSelectedItemIndex = items.length === 0 ? 0 : Math.min(selectedItemIndex, items.length - 1);
  const selectedItem = items[normalizedSelectedItemIndex] || null;
  const isHorizontalMenu = layout === 'horizontal';
  const backwardLabel = isHorizontalMenu ? 'Sinistra' : 'Su';
  const forwardLabel = isHorizontalMenu ? 'Destra' : 'Giu';

  return (
    <div className="space-y-3">
      <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--c-text-2)' }}>
            Template menu
          </div>
          <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
            20 preset pronti tra topbar, bottom bar, sidebar e layout misti.
          </p>
        </div>
        {Object.entries(groupedTemplates).map(([group, templates]) => (
          <div key={group} className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
              {group === 'top' ? 'Top' : group === 'bottom' ? 'Bottom' : group === 'side' ? 'Sidebar' : 'Misti'}
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="text-left rounded-lg p-2 border transition-colors"
                  style={{
                    borderColor: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-border)',
                    background: activeTemplateId === template.id ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
                    color: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-text-1)',
                  }}
                >
                  <div className="text-xs font-semibold">{template.name}</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Select
        label="Sorgente menu"
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value;
          if (nextMode === 'custom') {
            switchToCustomMode();
            return;
          }
          switchToGlobalMode();
        }}
        options={[
          { value: 'global', label: 'Menu globale CMS' },
          { value: 'custom', label: 'Menu custom blocco' },
        ]}
      />
      {mode === 'global' ? (
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-accent)' }}>
            Menu globale collegato
          </div>
          <p className="text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            In questa modalita la barra legge i pulsanti dal modulo `Menu` del CMS. Se vuoi trascinare, riordinare e modificare i pulsanti direttamente qui, passa a `Menu custom blocco`.
          </p>
          <button
            type="button"
            onClick={switchToCustomMode}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--c-accent)', color: 'white' }}
          >
            Rendi il menu modificabile nel blocco
          </button>
        </div>
      ) : (
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-2)', border: '1px solid var(--c-border)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
            Menu custom interattivo
          </div>
          <p className="text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            Template, drag col mouse, frecce tastiera, ordine fine e preset agiscono davvero sugli elementi del blocco.
          </p>
          <button
            type="button"
            onClick={switchToGlobalMode}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' }}
          >
            Riaggancia al menu globale CMS
          </button>
        </div>
      )}
      <Select
        label="Menu globale"
        value={menuKey}
        onChange={(event) => {
          const nextMenuKey = event.target.value;
          updateBlockProps(block.id, { menuKey: nextMenuKey });
          syncDataSource(mode, nextMenuKey);
        }}
        options={[
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondario' },
          { value: 'mobile', label: 'Mobile' },
          { value: 'footer', label: 'Footer menu' },
        ]}
      />
      <Select
        label="Layout"
        value={String(block.props.layout || 'horizontal')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'horizontal', label: 'Orizzontale' },
          { value: 'vertical', label: 'Verticale' },
        ]}
      />
      <Select
        label="Placement"
        value={String(block.props.placement || 'top')}
        onChange={(event) => updateBlockProps(block.id, { placement: event.target.value })}
        options={[
          { value: 'top', label: 'Alto' },
          { value: 'bottom', label: 'Basso' },
          { value: 'left', label: 'Sidebar sinistra' },
          { value: 'right', label: 'Sidebar destra' },
          { value: 'inline', label: 'Inline' },
        ]}
      />
      <Select
        label="Variante"
        value={String(block.props.variant || 'inline')}
        onChange={(event) => updateBlockProps(block.id, { variant: event.target.value })}
        options={[
          { value: 'inline', label: 'Inline' },
          { value: 'pills', label: 'Pills' },
          { value: 'underline', label: 'Underline' },
          { value: 'sidebar', label: 'Sidebar' },
          { value: 'floating', label: 'Floating' },
          { value: 'boxed', label: 'Boxed' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'rail', label: 'Rail' },
        ]}
      />
      <Select
        label="Logo placement"
        value={String(block.props.logoPosition || 'left')}
        onChange={(event) => updateBlockProps(block.id, { logoPosition: event.target.value })}
        options={[
          { value: 'left', label: 'Sinistra' },
          { value: 'top', label: 'Sopra menu' },
          { value: 'stacked', label: 'Stacked' },
        ]}
      />
      <Input
        label="Logo testo"
        value={String(block.props.logoText || '')}
        onChange={(event) => updateBlockProps(block.id, { logoText: event.target.value })}
      />
      <Input
        label="Logo URL"
        value={String(block.props.logoUrl || '')}
        onChange={(event) => updateBlockProps(block.id, { logoUrl: event.target.value })}
      />
      <Input
        label="Testo CTA"
        value={String(block.props.ctaText || '')}
        onChange={(event) => updateBlockProps(block.id, { ctaText: event.target.value })}
      />
      <Input
        label="URL CTA"
        value={String(block.props.ctaUrl || '')}
        onChange={(event) => updateBlockProps(block.id, { ctaUrl: event.target.value })}
      />
      <Input
        label="Gap elementi"
        type="number"
        value={Number(block.props.itemGap || 24)}
        onChange={(event) => updateBlockProps(block.id, { itemGap: Number(event.target.value) })}
      />
      <Toggle
        label="Sticky"
        checked={(block.props.sticky as boolean) ?? true}
        onChange={(value) => updateBlockProps(block.id, { sticky: value })}
      />
      <Toggle
        label="Mostra icone"
        checked={(block.props.showIcons as boolean) ?? true}
        onChange={(value) => updateBlockProps(block.id, { showIcons: value })}
      />
      <Toggle
        label="Mostra badge"
        checked={(block.props.showBadges as boolean) ?? true}
        onChange={(value) => updateBlockProps(block.id, { showBadges: value })}
      />
      <Toggle
        label="Solo icone"
        checked={(block.props.iconOnly as boolean) ?? false}
        onChange={(value) => updateBlockProps(block.id, { iconOnly: value })}
      />
      <Toggle
        label="Compatto"
        checked={(block.props.compact as boolean) ?? false}
        onChange={(value) => updateBlockProps(block.id, { compact: value })}
      />
      <Toggle
        label="Mostra descrizioni"
        checked={(block.props.showDescriptions as boolean) ?? false}
        onChange={(value) => updateBlockProps(block.id, { showDescriptions: value })}
      />
      <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
          Pulsanti menu
        </div>
        <Select
          label="Forma pulsanti"
          value={String(block.props.buttonShape || 'auto')}
          onChange={(event) => updateBlockProps(block.id, { buttonShape: event.target.value })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'square', label: 'Quadrati' },
          ]}
        />
        <Select
          label="Dimensione pulsanti"
          value={String(block.props.buttonSize || 'medium')}
          onChange={(event) => updateBlockProps(block.id, { buttonSize: event.target.value })}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Padding X"
            type="number"
            value={Number(block.props.buttonPaddingX || 16)}
            onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })}
          />
          <Input
            label="Padding Y"
            type="number"
            value={Number(block.props.buttonPaddingY || 10)}
            onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Raggio"
            type="number"
            value={Number(block.props.buttonRadius || 12)}
            onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })}
          />
          <Input
            label="Icona px"
            type="number"
            value={Number(block.props.iconSize || 15)}
            onChange={(event) => updateBlockProps(block.id, { iconSize: Number(event.target.value) })}
          />
        </div>
      </div>
      <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
          Pulsante CTA
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="CTA Padding X"
            type="number"
            value={Number(block.props.ctaPaddingX || 18)}
            onChange={(event) => updateBlockProps(block.id, { ctaPaddingX: Number(event.target.value) })}
          />
          <Input
            label="CTA Padding Y"
            type="number"
            value={Number(block.props.ctaPaddingY || 11)}
            onChange={(event) => updateBlockProps(block.id, { ctaPaddingY: Number(event.target.value) })}
          />
        </div>
        <Input
          label="CTA Raggio"
          type="number"
          value={Number(block.props.ctaRadius || 12)}
          onChange={(event) => updateBlockProps(block.id, { ctaRadius: Number(event.target.value) })}
        />
      </div>
      {mode === 'custom' && (
        <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                Voci custom
              </div>
              <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
                Per menu globali centralizzati usa il modulo `Menu` del CMS.
              </p>
            </div>
            <button
              onClick={() => updateBlockProps(block.id, {
                items: [
                  ...items,
                  { id: generateId(), label: 'Nuova voce', url: '#', icon: 'menu', children: [] },
                ],
              })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
            >
              + Voce
            </button>
          </div>
          {selectedItem && (
            <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                Voce selezionata: {selectedItem.label}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => reorderCustomItem(normalizedSelectedItemIndex, 0)}
                  disabled={normalizedSelectedItemIndex === 0}
                  className="px-2 py-1.5 rounded text-xs font-medium disabled:opacity-40"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  Prima
                </button>
                <button
                  type="button"
                  onClick={() => reorderCustomItem(normalizedSelectedItemIndex, items.length - 1)}
                  disabled={normalizedSelectedItemIndex === items.length - 1}
                  className="px-2 py-1.5 rounded text-xs font-medium disabled:opacity-40"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  Ultima
                </button>
                <button
                  type="button"
                  onClick={() => reorderCustomItem(normalizedSelectedItemIndex, normalizedSelectedItemIndex - 1)}
                  disabled={normalizedSelectedItemIndex === 0}
                  className="px-2 py-1.5 rounded text-xs font-medium disabled:opacity-40"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  {backwardLabel}
                </button>
                <button
                  type="button"
                  onClick={() => reorderCustomItem(normalizedSelectedItemIndex, normalizedSelectedItemIndex + 1)}
                  disabled={normalizedSelectedItemIndex === items.length - 1}
                  className="px-2 py-1.5 rounded text-xs font-medium disabled:opacity-40"
                  style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                >
                  {forwardLabel}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateCustomItem(normalizedSelectedItemIndex)}
                  className="px-2 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                >
                  Duplica
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomItem(normalizedSelectedItemIndex)}
                  className="px-2 py-1.5 rounded text-xs font-medium"
                  style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--c-danger)' }}
                >
                  Rimuovi
                </button>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>
                Puoi anche trascinare le voci col mouse o usare le frecce della tastiera quando una voce e selezionata.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id || `${item.url}-${index}`}
                draggable
                tabIndex={0}
                onClick={() => setSelectedItemIndex(index)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/navigation-item-index', String(index));
                  setSelectedItemIndex(index);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromIndex = Number(event.dataTransfer.getData('text/navigation-item-index'));
                  if (Number.isFinite(fromIndex)) {
                    reorderCustomItem(fromIndex, index);
                  }
                }}
                onKeyDown={(event) => {
                  setSelectedItemIndex(index);
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    reorderCustomItem(index, index - 1);
                  }
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    reorderCustomItem(index, index + 1);
                  }
                  if ((event.key === 'Backspace' || event.key === 'Delete') && items.length > 1) {
                    event.preventDefault();
                    removeCustomItem(index);
                  }
                  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
                    event.preventDefault();
                    duplicateCustomItem(index);
                  }
                }}
                className="rounded-lg p-3 space-y-2 cursor-move outline-none"
                style={{
                  background: selectedItemIndex === index ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
                  border: selectedItemIndex === index ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
                    Pulsante {index + 1}
                  </div>
                  <div
                    className="px-2 py-1 rounded text-[11px] font-medium"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
                  >
                    Drag o frecce
                  </div>
                </div>
                <Input
                  label={`Etichetta ${index + 1}`}
                  value={item.label}
                  onChange={(event) => updateCustomItem(index, { label: event.target.value })}
                />
                <Input
                  label="URL"
                  value={item.url}
                  onChange={(event) => updateCustomItem(index, { url: event.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Icona"
                    value={item.icon || ''}
                    onChange={(event) => updateCustomItem(index, { icon: event.target.value })}
                  />
                  <Input
                    label="Badge"
                    value={item.badge || ''}
                    onChange={(event) => updateCustomItem(index, { badge: event.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => reorderCustomItem(index, index - 1)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    {backwardLabel}
                  </button>
                  <button
                    onClick={() => reorderCustomItem(index, index + 1)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    {forwardLabel}
                  </button>
                  <button
                    onClick={() => duplicateCustomItem(index)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                  >
                    Duplica
                  </button>
                  <button
                    onClick={() => removeCustomItem(index)}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--c-danger)' }}
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FooterProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const mode = String(block.props.mode || 'global');

  return (
    <div className="space-y-3">
      <Select
        label="Sorgente footer"
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value;
          updateBlockProps(block.id, { mode: nextMode });
          updateBlock(block.id, {
            dataSource: nextMode === 'global'
              ? {
                  endpoint: 'site-footer',
                  params: {},
                }
              : undefined,
          });
        }}
        options={[
          { value: 'global', label: 'Footer globale CMS' },
          { value: 'custom', label: 'Footer custom blocco' },
        ]}
      />
      <Select
        label="Variante"
        value={String(block.props.variant || 'columns')}
        onChange={(event) => updateBlockProps(block.id, { variant: event.target.value })}
        options={[
          { value: 'columns', label: 'Colonne' },
          { value: 'compact', label: 'Compatto' },
          { value: 'minimal', label: 'Minimale' },
        ]}
      />
      <Input
        label="Logo URL"
        value={String(block.props.logoUrl || '')}
        onChange={(event) => updateBlockProps(block.id, { logoUrl: event.target.value })}
      />
      <Textarea
        label="Descrizione"
        value={String(block.props.description || '')}
        onChange={(event) => updateBlockProps(block.id, { description: event.target.value })}
        rows={4}
      />
      <Textarea
        label="Copyright"
        value={String(block.props.copyright || '')}
        onChange={(event) => updateBlockProps(block.id, { copyright: event.target.value })}
        rows={3}
      />
      <Toggle
        label="Newsletter footer"
        checked={Boolean((block.props.newsletter as { enabled?: boolean } | undefined)?.enabled)}
        onChange={(value) =>
          updateBlockProps(block.id, {
            newsletter: {
              ...(block.props.newsletter as Record<string, unknown> || {}),
              enabled: value,
            },
          })
        }
      />
      {mode === 'custom' && (
        <>
          <JsonTextareaField
            label="Colonne footer"
            value={block.props.columns || []}
            rows={10}
            helpText='Formato: [{"title":"Chi siamo","text":"Testo","links":[{"label":"Contatti","url":"#"}]}]'
            onValidChange={(value) => updateBlockProps(block.id, { columns: value as unknown[] })}
          />
          <JsonTextareaField
            label="Link footer bassi"
            value={block.props.links || []}
            rows={6}
            helpText='Formato: [{"label":"Privacy","url":"#","target":"_self"}]'
            onValidChange={(value) => updateBlockProps(block.id, { links: value as unknown[] })}
          />
          <JsonTextareaField
            label="Social footer"
            value={block.props.socialLinks || []}
            rows={6}
            helpText='Formato: [{"platform":"facebook","url":"#"}]'
            onValidChange={(value) => updateBlockProps(block.id, { socialLinks: value as unknown[] })}
          />
          {Boolean((block.props.newsletter as { enabled?: boolean } | undefined)?.enabled) && (
            <>
              <Input
                label="Titolo newsletter footer"
                value={String(((block.props.newsletter as Record<string, unknown>) || {}).title || '')}
                onChange={(event) =>
                  updateBlockProps(block.id, {
                    newsletter: {
                      ...(block.props.newsletter as Record<string, unknown> || {}),
                      title: event.target.value,
                    },
                  })
                }
              />
              <Textarea
                label="Descrizione newsletter footer"
                value={String(((block.props.newsletter as Record<string, unknown>) || {}).description || '')}
                rows={3}
                onChange={(event) =>
                  updateBlockProps(block.id, {
                    newsletter: {
                      ...(block.props.newsletter as Record<string, unknown> || {}),
                      description: event.target.value,
                    },
                  })
                }
              />
            </>
          )}
        </>
      )}
      {mode === 'custom' && (
        <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
          Per una gestione centrale di colonne, link, social e newsletter usa la pagina Footer del CMS.
        </p>
      )}
    </div>
  );
}

function CmsFormProperties({ block }: { block: Block }) {
  const { currentTenant } = useAuthStore();
  const { updateBlockProps, updateBlock } = usePageStore();
  const [forms, setForms] = useState<CmsFormOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadForms = async () => {
      if (!currentTenant?.id) {
        if (!cancelled) {
          setForms([]);
        }
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('site_forms')
        .select('id, name, slug')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('name');

      if (!cancelled) {
        setForms(error ? [] : ((data || []) as CmsFormOption[]));
      }
    };

    void loadForms();

    return () => {
      cancelled = true;
    };
  }, [currentTenant?.id]);

  const formSlug = String(block.props.formSlug || '');
  const activeTemplateId = String(block.props.templateId || 'form-editorial-card');

  const applyTemplate = (templateId: string) => {
    const template = getCmsFormTemplate(templateId);
    if (!template) return;
    updateBlock(block.id, {
      props: {
        ...block.props,
        ...template.props,
        templateId,
      },
      style: mergeNavigationStyle(block, template.style),
    });
  };

  const handleFormChange = (nextSlug: string) => {
    updateBlockProps(block.id, { formSlug: nextSlug });
    updateBlock(block.id, {
      dataSource: {
        endpoint: 'forms',
        params: nextSlug ? { slug: nextSlug } : {},
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-2)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
          Template contatti
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {CMS_FORM_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className="text-left rounded-lg p-2 border transition-colors"
              style={{
                borderColor: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-border)',
                background: activeTemplateId === template.id ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
                color: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-text-1)',
              }}
            >
              <div className="text-xs font-semibold">{template.name}</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>{template.description}</div>
            </button>
          ))}
        </div>
      </div>
      <Select
        label="Form CMS"
        value={formSlug}
        onChange={(event) => handleFormChange(event.target.value)}
        options={[
          { value: '', label: forms.length > 0 ? 'Seleziona un form' : 'Nessun form disponibile' },
          ...forms.map((form) => ({ value: form.slug, label: `${form.name} (${form.slug})` })),
        ]}
      />
      <Input
        label="Testo pulsante"
        value={String(block.props.submitButtonText || '')}
        placeholder="Invia"
        onChange={(event) => updateBlockProps(block.id, { submitButtonText: event.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label="CTA pad X"
          type="number"
          value={Number(block.props.buttonPaddingX || 20)}
          onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })}
        />
        <Input
          label="CTA pad Y"
          type="number"
          value={Number(block.props.buttonPaddingY || 14)}
          onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })}
        />
        <Input
          label="CTA raggio"
          type="number"
          value={Number(block.props.buttonRadius || 12)}
          onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })}
        />
      </div>
      <Select
        label="Layout"
        value={String(block.props.layout || 'stacked')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'stacked', label: 'Stacked' },
          { value: 'inline', label: 'Inline 2 colonne' },
          { value: 'split', label: 'Split contenuto + form' },
        ]}
      />
      <Select
        label="Visual style"
        value={String(block.props.visualStyle || 'editorial')}
        onChange={(event) => updateBlockProps(block.id, { visualStyle: event.target.value })}
        options={[
          { value: 'editorial', label: 'Editorial' },
          { value: 'split', label: 'Split' },
          { value: 'glass', label: 'Glass' },
          { value: 'compact', label: 'Compact' },
          { value: 'dark', label: 'Dark' },
          { value: 'minimal', label: 'Minimal' },
        ]}
      />
      <Input
        label="Badge intro"
        value={String(block.props.introBadge || '')}
        onChange={(event) => updateBlockProps(block.id, { introBadge: event.target.value })}
      />
      <Textarea
        label="Testo supporto"
        value={String(block.props.supportText || '')}
        onChange={(event) => updateBlockProps(block.id, { supportText: event.target.value })}
        rows={3}
      />
      <Toggle
        label="Mostra titolo"
        checked={(block.props.showTitle as boolean) ?? true}
        onChange={(value) => updateBlockProps(block.id, { showTitle: value })}
      />
      <Toggle
        label="Mostra descrizione"
        checked={(block.props.showDescription as boolean) ?? true}
        onChange={(value) => updateBlockProps(block.id, { showDescription: value })}
      />
      {forms.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
          Il blocco è pronto, ma il modulo Form del database dev non è ancora inizializzato oppure non contiene form attivi.
        </p>
      )}
    </div>
  );
}

function SocialProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const platforms = Array.isArray(block.props.platforms) ? (block.props.platforms as Array<Record<string, unknown>>) : [];
  const activeTemplateId = String(block.props.templateId || 'social-editorial-row');
  const updatePlatformAt = (index: number, updates: Record<string, unknown>) => {
    updateBlockProps(block.id, {
      platforms: platforms.map((platform, platformIndex) =>
        platformIndex === index ? { ...platform, ...updates } : platform
      ),
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = getSocialTemplate(templateId);
    if (!template) return;
    updateBlock(block.id, {
      props: {
        ...block.props,
        ...template.props,
        templateId,
        platforms: block.props.platforms || template.props.platforms,
      },
      style: mergeNavigationStyle(block, template.style),
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-2)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
          Template social
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {SOCIAL_BLOCK_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              className="text-left rounded-lg p-2 border transition-colors"
              style={{
                borderColor: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-border)',
                background: activeTemplateId === template.id ? 'var(--c-accent-soft)' : 'var(--c-bg-1)',
                color: activeTemplateId === template.id ? 'var(--c-accent)' : 'var(--c-text-1)',
              }}
            >
              <div className="text-xs font-semibold">{template.name}</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--c-text-2)' }}>{template.description}</div>
            </button>
          ))}
        </div>
      </div>
      <Input
        label="Titolo"
        value={String(block.props.title || '')}
        onChange={(event) => updateBlockProps(block.id, { title: event.target.value })}
      />
      <Textarea
        label="Descrizione"
        value={String(block.props.description || '')}
        onChange={(event) => updateBlockProps(block.id, { description: event.target.value })}
        rows={3}
      />
      <Select
        label="Layout social"
        value={String(block.props.layoutStyle || 'pill')}
        onChange={(event) => updateBlockProps(block.id, { layoutStyle: event.target.value })}
        options={[
          { value: 'pill', label: 'Pill' },
          { value: 'card', label: 'Card' },
          { value: 'glass', label: 'Glass' },
          { value: 'toolbar', label: 'Toolbar' },
          { value: 'icon-only', label: 'Icon only' },
        ]}
      />
      <Select
        label="Dimensione"
        value={String(block.props.size || 'medium')}
        onChange={(event) => updateBlockProps(block.id, { size: event.target.value })}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />
      <Select
        label="Color mode"
        value={String(block.props.colorMode || 'brand')}
        onChange={(event) => updateBlockProps(block.id, { colorMode: event.target.value })}
        options={[
          { value: 'brand', label: 'Brand' },
          { value: 'mono', label: 'Mono' },
          { value: 'soft', label: 'Soft' },
        ]}
      />
      <Select
        label="Allineamento"
        value={String(block.props.alignment || 'center')}
        onChange={(event) => updateBlockProps(block.id, { alignment: event.target.value })}
        options={[
          { value: 'left', label: 'Sinistra' },
          { value: 'center', label: 'Centro' },
          { value: 'right', label: 'Destra' },
          { value: 'stretch', label: 'Stretch' },
        ]}
      />
      <Toggle label="Mostra label" checked={(block.props.showLabels as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showLabels: value })} />
      <Toggle label="Mostra handle" checked={(block.props.showHandles as boolean) ?? false} onChange={(value) => updateBlockProps(block.id, { showHandles: value })} />
      <Toggle label="Mostra badge" checked={(block.props.showBadges as boolean) ?? true} onChange={(value) => updateBlockProps(block.id, { showBadges: value })} />
      <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
          Dimensioni social
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Gap"
            type="number"
            value={Number(block.props.itemGap || 14)}
            onChange={(event) => updateBlockProps(block.id, { itemGap: Number(event.target.value) })}
          />
          <Input
            label="Icona px"
            type="number"
            value={Number(block.props.iconSize || 46)}
            onChange={(event) => updateBlockProps(block.id, { iconSize: Number(event.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Padding X"
            type="number"
            value={Number(block.props.paddingX || 14)}
            onChange={(event) => updateBlockProps(block.id, { paddingX: Number(event.target.value) })}
          />
          <Input
            label="Padding Y"
            type="number"
            value={Number(block.props.paddingY || 10)}
            onChange={(event) => updateBlockProps(block.id, { paddingY: Number(event.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Larghezza card"
            type="number"
            value={Number(block.props.itemWidth || 320)}
            onChange={(event) => updateBlockProps(block.id, { itemWidth: Number(event.target.value) })}
          />
          <Input
            label="Raggio card"
            type="number"
            value={Number(block.props.itemRadius || 16)}
            onChange={(event) => updateBlockProps(block.id, { itemRadius: Number(event.target.value) })}
          />
        </div>
        <Select
          label="Forma icona"
          value={String(block.props.iconShape || 'auto')}
          onChange={(event) => updateBlockProps(block.id, { iconShape: event.target.value })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'square', label: 'Quadrata' },
          ]}
        />
      </div>

      <div className="rounded-lg p-3 space-y-3" style={{ background: 'var(--c-bg-2)' }}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>
            Canali
          </div>
          <button
            type="button"
            onClick={() =>
              updateBlockProps(block.id, {
                platforms: [
                  ...platforms,
                  {
                    id: generateId(),
                    platform: 'instagram',
                    label: 'Instagram',
                    handle: '@testata',
                    badge: '',
                    url: '#',
                    enabled: true,
                  },
                ],
              })
            }
            className="rounded-md px-2 py-1 text-[11px] font-semibold"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          >
            + Canale
          </button>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {platforms.map((platform, index) => {
            return (
              <div key={String(platform.id || platform.platform || index)} className="rounded-lg p-3 space-y-2" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Piattaforma"
                    value={String(platform.platform || 'instagram')}
                    onChange={(event) => {
                      const selectedPlatform = event.target.value;
                      const spec = SOCIAL_PLATFORMS.find((item) => item.key === selectedPlatform);
                      updatePlatformAt(index, {
                        platform: selectedPlatform,
                        label: String(platform.label || spec?.label || selectedPlatform),
                      });
                    }}
                    options={SOCIAL_PLATFORMS.map((item) => ({ value: item.key, label: item.label }))}
                  />
                  <Input
                    label="Label"
                    value={String(platform.label || '')}
                    onChange={(event) => updatePlatformAt(index, { label: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Handle"
                    value={String(platform.handle || '')}
                    onChange={(event) => updatePlatformAt(index, { handle: event.target.value })}
                  />
                  <Input
                    label="Badge"
                    value={String(platform.badge || '')}
                    onChange={(event) => updatePlatformAt(index, { badge: event.target.value })}
                  />
                </div>
                <Input
                  label="URL"
                  value={String(platform.url || '')}
                  onChange={(event) => updatePlatformAt(index, { url: event.target.value })}
                />
                <Toggle
                  label="Attivo"
                  checked={platform.enabled !== false}
                  onChange={(value) => updatePlatformAt(index, { enabled: value })}
                />
                <button
                  type="button"
                  onClick={() => updateBlockProps(block.id, { platforms: platforms.filter((_, itemIndex) => itemIndex !== index) })}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold"
                  style={{ background: 'rgba(220,38,38,0.12)', color: '#b91c1c' }}
                >
                  Rimuovi canale
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NewsletterProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const mode = String(block.props.mode || 'global');

  const syncDataSource = (nextMode: string) => {
    updateBlock(block.id, {
      dataSource: nextMode === 'global'
        ? {
            endpoint: 'site-newsletter',
            params: {},
          }
        : undefined,
    });
  };

  return (
    <div className="space-y-3">
      <Select
        label="Sorgente newsletter"
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value;
          updateBlockProps(block.id, { mode: nextMode });
          syncDataSource(nextMode);
        }}
        options={[
          { value: 'global', label: 'Modulo Newsletter CMS' },
          { value: 'custom', label: 'Config custom blocco' },
        ]}
      />
      <Input
        label="Titolo"
        value={String(block.props.title || '')}
        onChange={(event) => updateBlockProps(block.id, { title: event.target.value })}
      />
      <Textarea
        label="Descrizione"
        value={String(block.props.description || '')}
        rows={4}
        onChange={(event) => updateBlockProps(block.id, { description: event.target.value })}
      />
      <Input
        label="Placeholder email"
        value={String(block.props.placeholder || '')}
        onChange={(event) => updateBlockProps(block.id, { placeholder: event.target.value })}
      />
      <Input
        label="Testo bottone"
        value={String(block.props.buttonText || '')}
        onChange={(event) => updateBlockProps(block.id, { buttonText: event.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          label="CTA pad X"
          type="number"
          value={Number(block.props.buttonPaddingX || 20)}
          onChange={(event) => updateBlockProps(block.id, { buttonPaddingX: Number(event.target.value) })}
        />
        <Input
          label="CTA pad Y"
          type="number"
          value={Number(block.props.buttonPaddingY || 14)}
          onChange={(event) => updateBlockProps(block.id, { buttonPaddingY: Number(event.target.value) })}
        />
        <Input
          label="CTA raggio"
          type="number"
          value={Number(block.props.buttonRadius || 12)}
          onChange={(event) => updateBlockProps(block.id, { buttonRadius: Number(event.target.value) })}
        />
      </div>
      <Input
        label="Slug form CMS"
        value={String(block.props.formSlug || '')}
        onChange={(event) => updateBlockProps(block.id, { formSlug: event.target.value })}
      />
      <Input
        label="Form action provider"
        value={String(block.props.formAction || '')}
        onChange={(event) => updateBlockProps(block.id, { formAction: event.target.value })}
      />
      <Textarea
        label="Privacy text"
        value={String(block.props.privacyText || '')}
        rows={3}
        onChange={(event) => updateBlockProps(block.id, { privacyText: event.target.value })}
      />
      <Textarea
        label="Messaggio successo"
        value={String(block.props.successMessage || '')}
        rows={3}
        onChange={(event) => updateBlockProps(block.id, { successMessage: event.target.value })}
      />
      <Select
        label="Layout"
        value={String(block.props.layout || 'inline')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'inline', label: 'Inline' },
          { value: 'stacked', label: 'Stacked' },
        ]}
      />
      <Toggle
        label="Compatto"
        checked={Boolean(block.props.compact)}
        onChange={(value) => updateBlockProps(block.id, { compact: value })}
      />
      {mode === 'global' && (
        <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
          Il blocco usa il modulo Newsletter del CMS. Per provider, digest, posizionamenti e segmenti vai nella nuova sezione Newsletter in sidebar.
        </p>
      )}
    </div>
  );
}

function JsonTextareaField({
  label,
  value,
  onValidChange,
  rows = 8,
  helpText,
}: {
  label: string;
  value: unknown;
  onValidChange: (nextValue: unknown) => void;
  rows?: number;
  helpText?: string;
}) {
  const initialDraft = JSON.stringify(value, null, 2);

  return (
    <JsonTextareaFieldEditor
      key={initialDraft}
      label={label}
      initialDraft={initialDraft}
      onValidChange={onValidChange}
      rows={rows}
      helpText={helpText}
    />
  );
}

function JsonTextareaFieldEditor({
  label,
  initialDraft,
  onValidChange,
  rows,
  helpText,
}: {
  label: string;
  initialDraft: string;
  onValidChange: (nextValue: unknown) => void;
  rows: number;
  helpText?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState('');

  return (
    <div className="space-y-1.5">
      <Textarea
        label={label}
        value={draft}
        rows={rows}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          try {
            onValidChange(JSON.parse(nextDraft));
            setError('');
          } catch {
            setError('JSON non valido');
          }
        }}
      />
      {helpText && (
        <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function AccordionProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <JsonTextareaField
        label="Items accordion"
        value={block.props.items || []}
        rows={10}
        helpText='Formato: [{"id":"1","title":"Domanda","content":"<p>Risposta</p>","open":false}]'
        onValidChange={(value) => updateBlockProps(block.id, { items: value as unknown[] })}
      />
      <Toggle
        label="Consenti multipli aperti"
        checked={Boolean(block.props.allowMultiple)}
        onChange={(value) => updateBlockProps(block.id, { allowMultiple: value })}
      />
    </div>
  );
}

function TabsProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <JsonTextareaField
        label="Schede"
        value={block.props.tabs || []}
        rows={10}
        helpText='Formato: [{"id":"1","title":"Tab","content":"<p>Contenuto</p>"}]'
        onValidChange={(value) => updateBlockProps(block.id, { tabs: value as unknown[] })}
      />
      <Input
        label="Tab attiva"
        value={String(block.props.activeTab || '')}
        onChange={(event) => updateBlockProps(block.id, { activeTab: event.target.value })}
      />
      <Select
        label="Stile tab"
        value={String(block.props.style || 'default')}
        onChange={(event) => updateBlockProps(block.id, { style: event.target.value })}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'pills', label: 'Pills' },
          { value: 'underline', label: 'Underline' },
        ]}
      />
      <Select
        label="Allineamento"
        value={String(block.props.alignment || 'left')}
        onChange={(event) => updateBlockProps(block.id, { alignment: event.target.value })}
        options={[
          { value: 'left', label: 'Sinistra' },
          { value: 'center', label: 'Centro' },
          { value: 'right', label: 'Destra' },
        ]}
      />
    </div>
  );
}

function TableProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <JsonTextareaField
        label="Header colonne"
        value={block.props.headers || []}
        rows={4}
        helpText='Formato: ["Colonna 1","Colonna 2"]'
        onValidChange={(value) => updateBlockProps(block.id, { headers: value as unknown[] })}
      />
      <JsonTextareaField
        label="Righe"
        value={block.props.rows || []}
        rows={10}
        helpText='Formato: [["A1","B1"],["A2","B2"]]'
        onValidChange={(value) => updateBlockProps(block.id, { rows: value as unknown[] })}
      />
      <Toggle
        label="Righe alternate"
        checked={block.props.striped !== false}
        onChange={(value) => updateBlockProps(block.id, { striped: value })}
      />
      <Toggle
        label="Bordi"
        checked={block.props.bordered !== false}
        onChange={(value) => updateBlockProps(block.id, { bordered: value })}
      />
      <Toggle
        label="Hover righe"
        checked={block.props.hoverable !== false}
        onChange={(value) => updateBlockProps(block.id, { hoverable: value })}
      />
      <Toggle
        label="Responsive"
        checked={block.props.responsive !== false}
        onChange={(value) => updateBlockProps(block.id, { responsive: value })}
      />
    </div>
  );
}

function TimelineProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <JsonTextareaField
        label="Eventi timeline"
        value={block.props.events || []}
        rows={10}
        helpText='Formato: [{"id":"1","date":"2026","title":"Evento","description":"Testo"}]'
        onValidChange={(value) => updateBlockProps(block.id, { events: value as unknown[] })}
      />
      <Select
        label="Layout"
        value={String(block.props.layout || 'alternating')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'alternating', label: 'Alternato' },
          { value: 'stacked', label: 'Verticale' },
        ]}
      />
      <Input
        label="Colore linea"
        value={String(block.props.lineColor || '#e63946')}
        onChange={(event) => updateBlockProps(block.id, { lineColor: event.target.value })}
      />
    </div>
  );
}

function CodeProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <Input
        label="Filename"
        value={String(block.props.filename || '')}
        onChange={(event) => updateBlockProps(block.id, { filename: event.target.value })}
      />
      <Input
        label="Linguaggio"
        value={String(block.props.language || '')}
        onChange={(event) => updateBlockProps(block.id, { language: event.target.value })}
      />
      <Textarea
        label="Codice"
        value={String(block.props.code || '')}
        rows={14}
        onChange={(event) => updateBlockProps(block.id, { code: event.target.value })}
      />
      <JsonTextareaField
        label="Highlight righe"
        value={block.props.highlightLines || []}
        rows={3}
        helpText='Formato: [2,5,8]'
        onValidChange={(value) => updateBlockProps(block.id, { highlightLines: value as unknown[] })}
      />
      <Toggle
        label="Numeri riga"
        checked={block.props.showLineNumbers !== false}
        onChange={(value) => updateBlockProps(block.id, { showLineNumbers: value })}
      />
    </div>
  );
}

function CustomHtmlProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 text-xs leading-5" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)', color: 'var(--c-text-2)' }}>
        Questo blocco accetta HTML e CSS avanzato, anche con animazioni CSS, ma resta sempre in iframe sicuro.
        JavaScript libero e disattivazione del sandbox non sono consentiti.
      </div>
      <Textarea
        label="HTML"
        value={String(block.props.html || '')}
        rows={10}
        onChange={(event) => updateBlockProps(block.id, { html: event.target.value })}
      />
      <Textarea
        label="CSS"
        value={String(block.props.css || '')}
        rows={8}
        onChange={(event) => updateBlockProps(block.id, { css: event.target.value })}
      />
    </div>
  );
}

import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { DividerConfig, DividerShape } from '@/lib/types';

function ShapeTabContent({ block }: { block: Block }) {
  return (
    <div className="space-y-4">
      <ShapeTools block={block} />

      <DividerSection label="Divisore Superiore" config={block.shape?.topDivider || null} block={block} position="top" />
      <DividerSection label="Divisore Inferiore" config={block.shape?.bottomDivider || null} block={block} position="bottom" />
    </div>
  );
}

function DividerSection({ label, config, block, position }: { label: string; config: DividerConfig | null; block: Block; position: 'top' | 'bottom' }) {
  const { updateBlockShape } = usePageStore();

  const shapes: { value: DividerShape; label: string }[] = [
    { value: 'diagonal', label: 'Diagonale' },
    { value: 'wave', label: 'Onda' },
    { value: 'zigzag', label: 'Zigzag' },
    { value: 'zigzag-smooth', label: 'Zigzag Arrotondato' },
    { value: 'curve', label: 'Curva' },
    { value: 'triangle', label: 'Triangolo' },
    { value: 'arrow', label: 'Freccia' },
    { value: 'staircase', label: 'Scalini' },
    { value: 'cloud', label: 'Nuvola' },
  ];

  const updateConfig = (newConfig: DividerConfig | null) => {
    updateBlockShape(block.id, {
      type: block.shape?.type || 'clip-path',
      value: block.shape?.value || 'none',
      topDivider: position === 'top' ? (newConfig || undefined) : block.shape?.topDivider,
      bottomDivider: position === 'bottom' ? (newConfig || undefined) : block.shape?.bottomDivider,
    });
  };

  return (
    <div className="space-y-2 border rounded-lg p-3" style={{ borderColor: 'var(--c-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-1)' }}>{label}</h4>
        <AIButton
          blockId={block.id}
          fieldName={`divider-${position}`}
          contextData={JSON.stringify({ position, blockType: block.type, currentConfig: config })}
          actions={[
            {
              id: 'suggest-divider',
              label: 'Suggerisci',
              prompt: `Suggest a beautiful divider shape for the ${position} of this block: {context}. Return JSON with shape, height (20-200), color (hex), opacity (0-1), flip (boolean).`,
            },
          ]}
          onCommand={(cmd: AICommand) => {
            if (cmd.action === 'updateDivider' && cmd.position === position) {
              const newConfig: DividerConfig = {
                shape: cmd.shape as DividerShape || config?.shape || 'wave',
                height: cmd.height ?? config?.height ?? 80,
                flip: cmd.flip ?? config?.flip ?? false,
                invert: config?.invert ?? false,
                color: cmd.gradient?.stops?.[0]?.color || cmd.gradient?.stops?.[1]?.color || config?.color || '#ffffff',
                opacity: cmd.opacity ?? config?.opacity,
                blendWithSection: config?.blendWithSection,
                blendColor: config?.blendColor,
              };
              updateConfig(newConfig);
            }
          }}
          compact
        />
      </div>
      <Select
        label="Forma"
        value={config?.shape || 'none'}
        onChange={(e) => {
          if (e.target.value === 'none') updateConfig(null);
          else updateConfig({ shape: e.target.value as DividerShape, height: config?.height || 80, flip: false, invert: false, color: '#ffffff' });
        }}
        options={[{ value: 'none', label: 'Nessuno' }, ...shapes.map(s => ({ value: s.value, label: s.label }))]}
      />
      {config && (
        <>
          <Slider label="Altezza" value={config.height} onChange={(v) => updateConfig({ ...config, height: v })} min={20} max={200} suffix="px" />
          <Slider
            label="Opacità"
            value={(config.opacity ?? 1) * 100}
            onChange={(v) => updateConfig({ ...config, opacity: v / 100 })}
            min={0}
            max={100}
            suffix="%"
          />
          <ColorPicker label="Colore" value={config.color} onChange={(v) => updateConfig({ ...config, color: v })} />

          {/* Gradient Controls */}
          <Toggle
            label="Sfumatura"
            checked={config.gradient?.enabled || false}
            onChange={(v) => updateConfig({ ...config, gradient: { ...config.gradient, enabled: v, colorStart: config.gradient?.colorStart || config.color, colorEnd: config.gradient?.colorEnd || 'transparent', direction: config.gradient?.direction || 'vertical' } })}
            size="sm"
          />
          {config.gradient?.enabled && (
            <>
              <ColorPicker
                label="Colore inizio"
                value={config.gradient?.colorStart || config.color}
                onChange={(v) => updateConfig({ ...config, gradient: { enabled: true, colorStart: v, colorEnd: config.gradient?.colorEnd || 'transparent', direction: config.gradient?.direction || 'vertical' } })}
              />
              <ColorPicker
                label="Colore fine"
                value={config.gradient?.colorEnd || 'transparent'}
                onChange={(v) => updateConfig({ ...config, gradient: { enabled: true, colorStart: config.gradient?.colorStart || config.color, colorEnd: v, direction: config.gradient?.direction || 'vertical' } })}
              />
              <Select
                label="Direzione sfumatura"
                value={config.gradient?.direction || 'vertical'}
                onChange={(e) => updateConfig({ ...config, gradient: { enabled: true, colorStart: config.gradient?.colorStart || config.color, colorEnd: config.gradient?.colorEnd || 'transparent', direction: e.target.value as 'vertical' | 'horizontal' | 'diagonal' } })}
                options={[
                  { value: 'vertical', label: 'Verticale' },
                  { value: 'horizontal', label: 'Orizzontale' },
                  { value: 'diagonal', label: 'Diagonale' },
                ]}
              />
            </>
          )}

          <div className="flex gap-4">
            <Toggle label="Ribalta" checked={config.flip} onChange={(v) => updateConfig({ ...config, flip: v })} size="sm" />
            <Toggle label="Inverti" checked={config.invert} onChange={(v) => updateConfig({ ...config, invert: v })} size="sm" />
          </div>

          {/* Blend Mode */}
          <Toggle
            label="Fusione sezione"
            checked={config.blendWithSection || false}
            onChange={(v) => updateConfig({ ...config, blendWithSection: v })}
            size="sm"
          />
          {config.blendWithSection && (
            <ColorPicker
              label="Colore fusione"
              value={config.blendColor || '#000000'}
              onChange={(v) => updateConfig({ ...config, blendColor: v })}
            />
          )}
        </>
      )}
    </div>
  );
}

function AlignmentTools({ block }: { block: Block }) {
  const { updateBlockStyle } = usePageStore();
  const blocks = usePageStore((s) => s.blocks);

  // Find parent block info for snapping relative to parent
  const findBlockAndParent = (blocks: Block[], id: string, parent: Block | null = null): { block: Block | null; parent: Block | null } => {
    for (const b of blocks) {
      if (b.id === id) return { block: b, parent };
      const result = findBlockAndParent(b.children, id, b);
      if (result.block) return result;
    }
    return { block: null, parent: null };
  };

  const { parent } = findBlockAndParent(blocks, block.id);

  const centerOnPage = () => {
    if (!block.style?.layout) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        position: 'relative',
        margin: { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' },
        width: block.style.layout.width || '100%',
      },
    });
  };

  const centerOnParent = () => {
    if (!block.style?.layout || !parent) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        margin: { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' },
      },
    });
  };

  const alignLeft = () => {
    if (!block.style?.layout) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        margin: { ...block.style.layout.margin, left: '0', right: 'auto' },
      },
    });
  };

  const alignRight = () => {
    if (!block.style?.layout) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        margin: { ...block.style.layout.margin, right: '0', left: 'auto' },
      },
    });
  };

  const alignTop = () => {
    if (!block.style?.layout) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        margin: { ...block.style.layout.margin, top: '0', bottom: 'auto' },
      },
    });
  };

  const alignBottom = () => {
    if (!block.style?.layout) return;
    updateBlockStyle(block.id, {
      layout: {
        ...block.style.layout,
        margin: { ...block.style.layout.margin, bottom: '0', top: 'auto' },
      },
    });
  };

  return (
    <div className="border rounded-lg p-3 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--c-text-1)' }}>
        <Move size={12} /> Allineamento & Snap
      </h4>

      <div className="space-y-2">
        <button
          onClick={centerOnPage}
          className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="Centra il blocco sulla pagina (auto margin)"
        >
          Centra sulla pagina
        </button>

        {parent && (
          <button
            onClick={centerOnParent}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            title="Centra il blocco nella sezione genitore"
          >
            Centra sulla sezione
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={alignLeft}
          className="px-2 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-accent-soft)';
            e.currentTarget.style.color = 'var(--c-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-bg-2)';
            e.currentTarget.style.color = 'var(--c-text-0)';
          }}
          title="Allinea a sinistra"
        >
          <ArrowLeft size={14} />
        </button>

        <button
          onClick={alignTop}
          className="px-2 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-accent-soft)';
            e.currentTarget.style.color = 'var(--c-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-bg-2)';
            e.currentTarget.style.color = 'var(--c-text-0)';
          }}
          title="Allinea in alto"
        >
          <ArrowUp size={14} />
        </button>

        <button
          onClick={alignRight}
          className="px-2 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-accent-soft)';
            e.currentTarget.style.color = 'var(--c-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-bg-2)';
            e.currentTarget.style.color = 'var(--c-text-0)';
          }}
          title="Allinea a destra"
        >
          <ArrowRight size={14} />
        </button>

        <button
          onClick={alignBottom}
          className="col-span-3 px-2 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--c-accent-soft)';
            e.currentTarget.style.color = 'var(--c-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--c-bg-2)';
            e.currentTarget.style.color = 'var(--c-text-0)';
          }}
          title="Allinea in basso"
        >
          <ArrowDown size={14} />
        </button>
      </div>
    </div>
  );
}

function ToolsTabContent({ block, projectPalette, onPaletteChange }: { block: Block | null; projectPalette: string[]; onPaletteChange: (colors: string[]) => void }) {
  return (
    <div className="space-y-4">
      <SnapGridSettings />
      {block && <AlignmentTools block={block} />}
      <div className="border rounded-lg p-3 space-y-1.5" style={{ borderColor: 'var(--c-border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--c-text-1)' }}>
          <Layers size={12} /> Tools blocco
        </h4>
        <p className="text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
          Il pannello strumenti ora mostra solo comandi nativi del CMS. Per questo blocco usa `Props`, `Stile`, `Forma` e `Pos.` per modifiche reali e persistenti.
        </p>
      </div>
      <div className="border rounded-lg p-3" style={{ borderColor: 'var(--c-border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: 'var(--c-text-1)' }}>
          <Palette size={12} /> Palette Colori
        </h4>
        <ColorPaletteManager currentPalette={projectPalette} onChange={onPaletteChange} />
      </div>
    </div>
  );
}
