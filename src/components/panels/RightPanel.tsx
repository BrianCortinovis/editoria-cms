'use client';

import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { StyleEditor } from './StyleEditor';
import { AnimationEditor } from './AnimationEditor';
import { SnapGridSettings, OverlayEditor, ButtonEditor, ShapeTools, PositionSizeEditor } from './AdvancedTools';
import { ColorPaletteManager } from '@/components/builder/ColorPaletteManager';
import { cn } from '@/lib/utils/cn';
import { Paintbrush, Settings2, Pentagon, Smartphone, Move, Palette, Layers, MousePointerClick, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';

export function RightPanel() {
  const { rightPanelTab, setRightPanelTab } = useUiStore();
  const { selectedBlockId, getSelectedBlock, updateBlock, updateBlockProps } = usePageStore();
  const projectPalette = useUiStore((s) => s.projectPalette);
  const setProjectPalette = useUiStore((s) => s.setProjectPalette);

  const block = getSelectedBlock();

  const tabs = [
    { id: 'properties' as const, icon: Settings2, label: 'Props' },
    { id: 'style' as const, icon: Paintbrush, label: 'Stile' },
    { id: 'animation' as const, icon: Sparkles, label: 'Anim' },
    { id: 'shape' as const, icon: Pentagon, label: 'Forma' },
    { id: 'position' as const, icon: Move, label: 'Pos.' },
    { id: 'tools' as const, icon: Layers, label: 'Tools' },
  ];

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
      <div className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
        {tabs.map(({ id, icon: Icon, label }) => (
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
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {rightPanelTab === 'properties' && <PropertiesEditor block={block} projectPalette={projectPalette} />}
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
import type { Block } from '@/lib/types';

function PropertiesEditor({ block, projectPalette }: { block: Block; projectPalette: string[] }) {
  const { updateBlockProps } = usePageStore();

  const props = block.props as Record<string, unknown>;
  const editableFields = Object.entries(props).filter(
    ([key, val]) => typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean'
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
    { value: 'curve', label: 'Curva' },
    { value: 'triangle', label: 'Triangolo' },
    { value: 'arrow', label: 'Freccia' },
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
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-1)' }}>{label}</h4>
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
          <ColorPicker label="Colore" value={config.color} onChange={(v) => updateConfig({ ...config, color: v })} />
          <div className="flex gap-4">
            <Toggle label="Ribalta" checked={config.flip} onChange={(v) => updateConfig({ ...config, flip: v })} size="sm" />
            <Toggle label="Inverti" checked={config.invert} onChange={(v) => updateConfig({ ...config, invert: v })} size="sm" />
          </div>
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
