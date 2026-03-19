'use client';

import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import cn from '@/lib/utils/cn';
import { Paintbrush, Settings2, Smartphone, Move, Layers } from 'lucide-react';
import { useState } from 'react';
import type { Block, BlockStyle, Spacing } from '@/lib/types/block';

const TABS = [
  { id: 'properties', label: 'Proprietà', icon: Settings2 },
  { id: 'style', label: 'Stile', icon: Paintbrush },
  { id: 'responsive', label: 'Responsive', icon: Smartphone },
  { id: 'position', label: 'Posizione', icon: Move },
] as const;

type TabId = typeof TABS[number]['id'];

export function RightPanel() {
  const { getSelectedBlock } = usePageStore();
  const [tab, setTab] = useState<TabId>('properties');
  const block = getSelectedBlock();

  if (!block) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-4">
        <div className="text-center">
          <Layers size={32} className="mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
          <p className="text-xs text-zinc-400">Seleziona un blocco per modificarlo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-1 pt-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] rounded-t transition',
              tab === id ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'properties' && <PropertiesPanel block={block} />}
        {tab === 'style' && <StylePanel block={block} />}
        {tab === 'responsive' && <ResponsivePanel block={block} />}
        {tab === 'position' && <PositionPanel block={block} />}
      </div>
    </div>
  );
}

function PropertiesPanel({ block }: { block: Block }) {
  const { updateBlockProps, updateBlock } = usePageStore();

  return (
    <div className="space-y-3">
      {/* Label */}
      <Field label="Etichetta">
        <input
          value={block.label}
          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      {/* Type */}
      <Field label="Tipo">
        <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{block.type}</span>
      </Field>

      {/* Block props */}
      {Object.entries(block.props).map(([key, value]) => (
        <Field key={key} label={key}>
          {typeof value === 'boolean' ? (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => updateBlockProps(block.id, { [key]: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-zinc-500">{value ? 'Attivo' : 'Disattivo'}</span>
            </label>
          ) : typeof value === 'number' ? (
            <input
              type="number"
              value={value}
              onChange={(e) => updateBlockProps(block.id, { [key]: Number(e.target.value) })}
              className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            />
          ) : (
            <input
              value={String(value || '')}
              onChange={(e) => updateBlockProps(block.id, { [key]: e.target.value })}
              className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            />
          )}
        </Field>
      ))}

      {/* Data source (for editorial blocks) */}
      {block.dataSource && (
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <h4 className="text-xs font-semibold mb-2 text-zinc-600 dark:text-zinc-400">Sorgente Dati</h4>
          <Field label="Endpoint">
            <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded">{block.dataSource.endpoint}</span>
          </Field>
          {Object.entries(block.dataSource.params).map(([k, v]) => (
            <Field key={k} label={k}>
              <span className="text-xs text-zinc-500">{v}</span>
            </Field>
          ))}
        </div>
      )}
    </div>
  );
}

function StylePanel({ block }: { block: Block }) {
  const { updateBlockStyle } = usePageStore();

  const updateLayout = (key: string, value: string) => {
    updateBlockStyle(block.id, { layout: { ...block.style.layout, [key]: value } } as Partial<BlockStyle>);
  };

  return (
    <div className="space-y-3">
      <Field label="Display">
        <select
          value={block.style.layout.display}
          onChange={(e) => updateLayout('display', e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="block">Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
        </select>
      </Field>

      {block.style.layout.display === 'flex' && (
        <Field label="Direzione">
          <select
            value={block.style.layout.flexDirection || 'row'}
            onChange={(e) => updateLayout('flexDirection', e.target.value)}
            className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
          >
            <option value="row">Orizzontale</option>
            <option value="column">Verticale</option>
          </select>
        </Field>
      )}

      <Field label="Gap">
        <input
          value={block.style.layout.gap || '0'}
          onChange={(e) => updateLayout('gap', e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      <Field label="Larghezza max">
        <input
          value={block.style.layout.maxWidth}
          onChange={(e) => updateLayout('maxWidth', e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      <h4 className="text-xs font-semibold mt-4 text-zinc-600 dark:text-zinc-400">Sfondo</h4>
      <Field label="Tipo">
        <select
          value={block.style.background.type}
          onChange={(e) => updateBlockStyle(block.id, { background: { ...block.style.background, type: e.target.value as 'none' | 'color' | 'gradient' | 'image' } })}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="none">Nessuno</option>
          <option value="color">Colore</option>
          <option value="gradient">Gradiente</option>
          <option value="image">Immagine</option>
        </select>
      </Field>
      {block.style.background.type !== 'none' && (
        <Field label="Valore">
          <input
            type={block.style.background.type === 'color' ? 'color' : 'text'}
            value={block.style.background.value}
            onChange={(e) => updateBlockStyle(block.id, { background: { ...block.style.background, value: e.target.value } })}
            className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
          />
        </Field>
      )}

      <SpacingEditor label="Padding" value={block.style.layout.padding} onChange={(v) => updateLayout('padding', v as unknown as string)} block={block} field="padding" />
    </div>
  );
}

function ResponsivePanel({ block }: { block: Block }) {
  const { updateBlockResponsive } = usePageStore();
  const [device, setDevice] = useState<'tablet' | 'mobile'>('tablet');

  const overrides = (block.responsive?.[device] || {}) as Partial<BlockStyle>;
  const layout = (overrides?.layout || {}) as Partial<BlockStyle['layout']>;

  const updateResponsiveLayout = (key: string, value: string) => {
    updateBlockResponsive(block.id, device, { layout: { [key]: value } } as unknown as Partial<BlockStyle>);
  };

  return (
    <div className="space-y-3">
      {/* Device selector */}
      <div className="flex gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
        {(['tablet', 'mobile'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDevice(d)}
            className={cn(
              'flex-1 py-1.5 text-xs rounded transition font-medium',
              device === d ? 'bg-white dark:bg-zinc-700 text-blue-500 shadow-sm' : 'text-zinc-500'
            )}
          >
            {d === 'tablet' ? '📱 Tablet' : '📲 Mobile'}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-zinc-400">
        Questi override si applicano solo su {device === 'tablet' ? 'tablet (≤1024px)' : 'mobile (≤768px)'}. Lasciali vuoti per ereditare dal desktop.
      </p>

      <Field label="Display">
        <select
          value={(layout.display as string) || ''}
          onChange={(e) => updateResponsiveLayout('display', e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="">Eredita</option>
          <option value="block">Block</option>
          <option value="flex">Flex</option>
          <option value="grid">Grid</option>
          <option value="none">Nascosto</option>
        </select>
      </Field>

      <Field label="Direzione Flex">
        <select
          value={(layout.flexDirection as string) || ''}
          onChange={(e) => updateResponsiveLayout('flexDirection', e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="">Eredita</option>
          <option value="row">Orizzontale</option>
          <option value="column">Verticale</option>
        </select>
      </Field>

      <Field label="Gap">
        <input
          value={(layout.gap as string) || ''}
          onChange={(e) => updateResponsiveLayout('gap', e.target.value)}
          placeholder="Eredita"
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      <Field label="Larghezza max">
        <input
          value={(layout.maxWidth as string) || ''}
          onChange={(e) => updateResponsiveLayout('maxWidth', e.target.value)}
          placeholder="Eredita"
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      <Field label="Altezza min">
        <input
          value={(layout.minHeight as string) || ''}
          onChange={(e) => updateResponsiveLayout('minHeight', e.target.value)}
          placeholder="Eredita"
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>

      <h4 className="text-xs font-semibold mt-4 text-zinc-600 dark:text-zinc-400">Padding</h4>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <input
            key={side}
            value={(layout.padding as Spacing)?.[side] || ''}
            onChange={(e) => {
              const currentPadding = (layout.padding as Spacing) || { top: '', right: '', bottom: '', left: '' };
              updateBlockResponsive(block.id, device, {
                layout: { padding: { ...currentPadding, [side]: e.target.value } },
              } as Partial<BlockStyle>);
            }}
            placeholder={side[0].toUpperCase()}
            className="px-1.5 py-1 text-[11px] text-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            title={side}
          />
        ))}
      </div>

      <h4 className="text-xs font-semibold mt-4 text-zinc-600 dark:text-zinc-400">Tipografia</h4>
      <Field label="Dimensione font">
        <input
          value={overrides?.typography?.fontSize || ''}
          onChange={(e) => updateBlockResponsive(block.id, device, { typography: { fontSize: e.target.value } } as Partial<BlockStyle>)}
          placeholder="Eredita"
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        />
      </Field>
      <Field label="Allineamento testo">
        <select
          value={overrides?.typography?.textAlign || ''}
          onChange={(e) => updateBlockResponsive(block.id, device, { typography: { textAlign: e.target.value } } as Partial<BlockStyle>)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="">Eredita</option>
          <option value="left">Sinistra</option>
          <option value="center">Centro</option>
          <option value="right">Destra</option>
        </select>
      </Field>
    </div>
  );
}

function PositionPanel({ block }: { block: Block }) {
  const { updateBlockStyle } = usePageStore();

  return (
    <div className="space-y-3">
      <Field label="Altezza min">
        <input
          value={block.style.layout.minHeight || ''}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...block.style.layout, minHeight: e.target.value } } as Partial<BlockStyle>)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
          placeholder="auto"
        />
      </Field>
      <Field label="Overflow">
        <select
          value={block.style.layout.overflow || 'visible'}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...block.style.layout, overflow: e.target.value } } as Partial<BlockStyle>)}
          className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
        >
          <option value="visible">Visibile</option>
          <option value="hidden">Nascosto</option>
          <option value="auto">Auto</option>
          <option value="scroll">Scroll</option>
        </select>
      </Field>
    </div>
  );
}

function SpacingEditor({ label, block, field }: { label: string; value: Spacing; onChange: (v: Spacing) => void; block: Block; field: 'padding' | 'margin' }) {
  const { updateBlockStyle } = usePageStore();
  const spacing = block.style.layout[field];

  const update = (side: keyof Spacing, val: string) => {
    const newSpacing = { ...spacing, [side]: val };
    updateBlockStyle(block.id, { layout: { ...block.style.layout, [field]: newSpacing } } as Partial<BlockStyle>);
  };

  return (
    <div>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="grid grid-cols-4 gap-1 mt-1">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <input
            key={side}
            value={spacing[side]}
            onChange={(e) => update(side, e.target.value)}
            placeholder={side[0].toUpperCase()}
            className="px-1.5 py-1 text-[11px] text-center rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            title={side}
          />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5 block">{label}</label>
      {children}
    </div>
  );
}
