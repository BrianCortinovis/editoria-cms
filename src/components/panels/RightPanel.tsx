'use client';

import { useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { StyleEditor } from './StyleEditor';
import { AnimationEditor } from './AnimationEditor';
import { SnapGridSettings, OverlayEditor, ButtonEditor, ShapeTools, PositionSizeEditor } from './AdvancedTools';
import { ColorPaletteManager } from '@/components/builder/ColorPaletteManager';
import { cn } from '@/lib/utils/cn';
import { Paintbrush, Settings2, Pentagon, Smartphone, Move, Palette, Layers, MousePointerClick, Sparkles, Settings, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import AIButton from '@/components/ai/AIButton';
import type { AICommand } from '@/components/ai/AIButton';
import type { Block } from '@/lib/types';

export function RightPanel() {
  const { rightPanelTab, setRightPanelTab, hiddenRightPanelTabs, toggleHiddenRightPanelTab } = useUiStore();
  const { selectedBlockId, updateBlock, updateBlockProps } = usePageStore();
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
import type { DividerConfig, DividerShape, DividerGradient } from '@/lib/types';

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
                value={config.gradient.colorStart || config.color}
                onChange={(v) => updateConfig({ ...config, gradient: { ...config.gradient, colorStart: v } })}
              />
              <ColorPicker
                label="Colore fine"
                value={config.gradient.colorEnd || 'transparent'}
                onChange={(v) => updateConfig({ ...config, gradient: { ...config.gradient, colorEnd: v } })}
              />
              <Select
                label="Direzione sfumatura"
                value={config.gradient.direction || 'vertical'}
                onChange={(e) => updateConfig({ ...config, gradient: { ...config.gradient, direction: e.target.value as 'vertical' | 'horizontal' | 'diagonal' } })}
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
