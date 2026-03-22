'use client';

import { useEffect, useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { StyleEditor } from './StyleEditor';
import { AnimationEditor } from './AnimationEditor';
import { SnapGridSettings, OverlayEditor, ButtonEditor, ShapeTools, PositionSizeEditor } from './AdvancedTools';
import { ColorPaletteManager } from '@/components/builder/ColorPaletteManager';
import { cn } from '@/lib/utils/cn';
import { Paintbrush, Settings2, Pentagon, Move, Palette, Layers, Settings, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Textarea } from '@/components/ui/textarea';
import AIButton from '@/components/ai/AIButton';
import type { AICommand } from '@/components/ai/AIButton';
import type { Block } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

export function RightPanel() {
  const { rightPanelTab, setRightPanelTab, hiddenRightPanelTabs, toggleHiddenRightPanelTab } = useUiStore();
  const { selectedBlockId, updateBlock } = usePageStore();
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

  const projectPalette = useUiStore((s) => s.projectPalette);
  const setProjectPalette = useUiStore((s) => s.setProjectPalette);
  const [showTabMenu, setShowTabMenu] = useState(false);

  const tabs = [
    { id: 'properties' as const, icon: Settings2, label: 'Props' },
    { id: 'style' as const, icon: Paintbrush, label: 'Stile' },
    // { id: 'animation' as const, icon: Sparkles, label: 'Anim' }, // TODO: Implement animation rendering
    { id: 'shape' as const, icon: Pentagon, label: 'Forma' },
    { id: 'position' as const, icon: Move, label: 'Pos.' },
    { id: 'tools' as const, icon: Layers, label: 'Tools' },
  ];

  const visibleTabs = tabs.filter((t) => !hiddenRightPanelTabs.includes(t.id));

  if (!block) {
    return (
      <div className="h-full flex flex-col border-l" style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text-0)' }}>Strumenti</h3>
          <p className="text-[10px]" style={{ color: 'var(--c-text-2)' }}>Seleziona un blocco o usa gli strumenti globali</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    <div className="h-full flex flex-col border-l" style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}>
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

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanelTab === 'properties' && <PropertiesEditor block={block} />}
        {rightPanelTab === 'style' && <StyleEditor block={block} />}
        {rightPanelTab === 'animation' && <AnimationEditor block={block} />}
        {rightPanelTab === 'shape' && <ShapeTabContent block={block} />}
        {rightPanelTab === 'position' && <PositionSizeEditor block={block} />}
        {rightPanelTab === 'tools' && <ToolsTabContent block={block} projectPalette={projectPalette} onPaletteChange={setProjectPalette} />}
      </div>
    </div>
  );
}

// === Properties Editor ===
function PropertiesEditor({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  if (block.type === 'navigation') {
    return <NavigationProperties block={block} />;
  }

  if (block.type === 'footer') {
    return <FooterProperties block={block} />;
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

interface CmsFormOption {
  id: string;
  name: string;
  slug: string;
}

function NavigationProperties({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();
  const mode = String(block.props.mode || 'global');
  const menuKey = String(block.props.menuKey || 'primary');

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

  return (
    <div className="space-y-3">
      <Select
        label="Sorgente menu"
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value;
          updateBlockProps(block.id, { mode: nextMode });
          syncDataSource(nextMode, menuKey);
        }}
        options={[
          { value: 'global', label: 'Menu globale CMS' },
          { value: 'custom', label: 'Menu custom blocco' },
        ]}
      />
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
        label="Variante"
        value={String(block.props.variant || 'inline')}
        onChange={(event) => updateBlockProps(block.id, { variant: event.target.value })}
        options={[
          { value: 'inline', label: 'Inline' },
          { value: 'pills', label: 'Pills' },
          { value: 'underline', label: 'Underline' },
          { value: 'sidebar', label: 'Sidebar' },
          { value: 'floating', label: 'Floating' },
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
        label="Mostra descrizioni"
        checked={(block.props.showDescriptions as boolean) ?? false}
        onChange={(value) => updateBlockProps(block.id, { showDescriptions: value })}
      />
      {mode === 'custom' && (
        <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>
          In modalita custom il blocco usa le sue voci interne. Per una gestione editoriale centralizzata usa il modulo Menu del CMS.
        </p>
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
      <Select
        label="Layout"
        value={String(block.props.layout || 'stacked')}
        onChange={(event) => updateBlockProps(block.id, { layout: event.target.value })}
        options={[
          { value: 'stacked', label: 'Stacked' },
          { value: 'inline', label: 'Inline 2 colonne' },
        ]}
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
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
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
        key={`accordion-${JSON.stringify(block.props.items || [])}`}
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
        key={`tabs-${JSON.stringify(block.props.tabs || [])}`}
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
    </div>
  );
}

function TableProperties({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();

  return (
    <div className="space-y-3">
      <JsonTextareaField
        key={`table-headers-${JSON.stringify(block.props.headers || [])}`}
        label="Header colonne"
        value={block.props.headers || []}
        rows={4}
        helpText='Formato: ["Colonna 1","Colonna 2"]'
        onValidChange={(value) => updateBlockProps(block.id, { headers: value as unknown[] })}
      />
      <JsonTextareaField
        key={`table-rows-${JSON.stringify(block.props.rows || [])}`}
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
        key={`timeline-${JSON.stringify(block.props.events || [])}`}
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
        key={`highlight-${JSON.stringify(block.props.highlightLines || [])}`}
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
      <Textarea
        label="JavaScript"
        value={String(block.props.js || '')}
        rows={8}
        onChange={(event) => updateBlockProps(block.id, { js: event.target.value })}
      />
      <Toggle
        label="Sandbox iframe"
        checked={block.props.sandboxed !== false}
        onChange={(value) => updateBlockProps(block.id, { sandboxed: value })}
      />
    </div>
  );
}

// === Shape Tab ===
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
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

// === Tools Tab ===
function ToolsTabContent({ block, projectPalette, onPaletteChange }: { block: Block; projectPalette: string[]; onPaletteChange: (colors: string[]) => void }) {
  return (
    <div className="space-y-4">
      <SnapGridSettings />
      <OverlayEditor block={block} />
      <ButtonEditor block={block} />
      <div className="border rounded-lg p-3" style={{ borderColor: 'var(--c-border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: 'var(--c-text-1)' }}>
          <Palette size={12} /> Palette Colori
        </h4>
        <ColorPaletteManager currentPalette={projectPalette} onChange={onPaletteChange} />
      </div>
    </div>
  );
}
