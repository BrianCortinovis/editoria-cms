'use client';

import { useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import type { Block, BlockStyle } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { AiButton } from '@/components/ai/AiButton';
import { cn } from '@/lib/utils/cn';
import {
  ChevronDown, ChevronRight, MousePointer, Move, Magnet, Ruler,
  Type, Image, MousePointerClick, Layers, Box, Pentagon,
  Maximize2, Square, Circle, Triangle, Hexagon, Star, Heart,
  Sparkles
} from 'lucide-react';

// ============================
// SNAP & GRID SETTINGS
// ============================

export function SnapGridSettings() {
  const { showGrid, toggleGrid, showOutlines, toggleOutlines } = useUiStore();
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapSize, setSnapSize] = useState(1);
  const [showGuides, setShowGuides] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  return (
    <div className="space-y-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        <Magnet size={12} /> Griglia & Snap
      </h4>

      <Toggle label="Griglia visibile" checked={showGrid} onChange={toggleGrid} size="sm" />
      <Toggle label="Contorni blocchi" checked={showOutlines} onChange={toggleOutlines} size="sm" />
      <Toggle label="Magneti (snap)" checked={snapEnabled} onChange={setSnapEnabled} size="sm" />
      <Toggle label="Guide intelligenti" checked={showGuides} onChange={setShowGuides} size="sm" />
      <Toggle label="Righelli (rulers)" checked={showRulers} onChange={setShowRulers} size="sm" />

      {snapEnabled && (
        <div>
          <Slider
            label="Precisione snap"
            value={snapSize}
            onChange={setSnapSize}
            min={1}
            max={50}
            suffix="px"
          />
          <div className="flex gap-1 mt-2">
            {[1, 2, 5, 8, 10, 16, 20].map((v) => (
              <button
                key={v}
                onClick={() => setSnapSize(v)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono',
                  snapSize === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                )}
              >
                {v}px
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// TEXT OVERLAY ON IMAGES
// ============================

interface OverlayEditorProps {
  block: Block;
}

export function OverlayEditor({ block }: OverlayEditorProps) {
  const { updateBlockProps, updateBlockStyle } = usePageStore();
  const props = block.props as Record<string, unknown>;

  // Overlay text settings
  const overlayText = (props.overlayText as string) || '';
  const overlayPosition = (props.overlayPosition as string) || 'center';
  const overlayBg = (props.overlayBg as string) || 'rgba(0,0,0,0.5)';
  const overlayTextColor = (props.overlayTextColor as string) || '#ffffff';
  const overlayFontSize = (props.overlayFontSize as string) || '24px';
  const overlayFontWeight = (props.overlayFontWeight as string) || '700';
  const overlayBlur = (props.overlayBlur as number) || 0;

  return (
    <div className="space-y-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        <Layers size={12} /> Overlay Testo su Immagine
      </h4>

      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Input
            label="Testo overlay"
            value={overlayText}
            onChange={(e) => updateBlockProps(block.id, { overlayText: e.target.value })}
            placeholder="Testo sovrapposto all'immagine..."
          />
        </div>
        <div className="pt-4">
          <AiButton blockId={block.id} fieldName="overlayText" fieldValue={overlayText} size="sm" />
        </div>
      </div>

      <Select
        label="Posizione overlay"
        value={overlayPosition}
        onChange={(e) => updateBlockProps(block.id, { overlayPosition: e.target.value })}
        options={[
          { value: 'top-left', label: 'Alto Sinistra' },
          { value: 'top-center', label: 'Alto Centro' },
          { value: 'top-right', label: 'Alto Destra' },
          { value: 'center-left', label: 'Centro Sinistra' },
          { value: 'center', label: 'Centro' },
          { value: 'center-right', label: 'Centro Destra' },
          { value: 'bottom-left', label: 'Basso Sinistra' },
          { value: 'bottom-center', label: 'Basso Centro' },
          { value: 'bottom-right', label: 'Basso Destra' },
        ]}
      />

      <ColorPicker label="Sfondo overlay" value={overlayBg} onChange={(v) => updateBlockProps(block.id, { overlayBg: v })} />
      <ColorPicker label="Colore testo" value={overlayTextColor} onChange={(v) => updateBlockProps(block.id, { overlayTextColor: v })} />

      <Input
        label="Dimensione font"
        value={overlayFontSize}
        onChange={(e) => updateBlockProps(block.id, { overlayFontSize: e.target.value })}
        placeholder="24px"
      />

      <Select
        label="Peso font"
        value={overlayFontWeight}
        onChange={(e) => updateBlockProps(block.id, { overlayFontWeight: e.target.value })}
        options={[
          { value: '300', label: 'Light' },
          { value: '400', label: 'Regular' },
          { value: '600', label: 'Semibold' },
          { value: '700', label: 'Bold' },
          { value: '900', label: 'Black' },
        ]}
      />

      <Slider label="Blur sfondo" value={overlayBlur} onChange={(v) => updateBlockProps(block.id, { overlayBlur: v })} min={0} max={20} suffix="px" />
    </div>
  );
}

// ============================
// INTERACTIVE BUTTONS
// ============================

export function ButtonEditor({ block }: { block: Block }) {
  const { updateBlockProps } = usePageStore();
  const props = block.props as Record<string, unknown>;

  const buttons = (props.buttons as Array<{
    id: string; text: string; url: string; style: string;
    bgColor: string; textColor: string; borderRadius: string;
    size: string; icon: string; target: string;
  }>) || [];

  const addButton = () => {
    const newBtn = {
      id: Date.now().toString(),
      text: 'Click qui',
      url: '#',
      style: 'filled',
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: '8px',
      size: 'md',
      icon: '',
      target: '_self',
    };
    updateBlockProps(block.id, { buttons: [...buttons, newBtn] });
  };

  const updateButton = (btnId: string, updates: Record<string, string>) => {
    updateBlockProps(block.id, {
      buttons: buttons.map(b => b.id === btnId ? { ...b, ...updates } : b),
    });
  };

  const removeButton = (btnId: string) => {
    updateBlockProps(block.id, { buttons: buttons.filter(b => b.id !== btnId) });
  };

  return (
    <div className="space-y-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <MousePointerClick size={12} /> Pulsanti Interattivi
        </h4>
        <button onClick={addButton} className="text-[10px] text-blue-500 hover:text-blue-600 font-medium">+ Aggiungi</button>
      </div>

      {buttons.map((btn) => (
        <div key={btn.id} className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
          <div className="flex gap-2">
            <Input label="Testo" value={btn.text} onChange={(e) => updateButton(btn.id, { text: e.target.value })} />
            <Input label="URL" value={btn.url} onChange={(e) => updateButton(btn.id, { url: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Select
              label="Stile"
              value={btn.style}
              onChange={(e) => updateButton(btn.id, { style: e.target.value })}
              options={[
                { value: 'filled', label: 'Pieno' },
                { value: 'outline', label: 'Contorno' },
                { value: 'ghost', label: 'Ghost' },
                { value: 'gradient', label: 'Gradiente' },
              ]}
            />
            <Select
              label="Dimensione"
              value={btn.size}
              onChange={(e) => updateButton(btn.id, { size: e.target.value })}
              options={[
                { value: 'sm', label: 'Piccolo' },
                { value: 'md', label: 'Medio' },
                { value: 'lg', label: 'Grande' },
                { value: 'xl', label: 'Extra Large' },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><ColorPicker label="Sfondo" value={btn.bgColor} onChange={(v) => updateButton(btn.id, { bgColor: v })} /></div>
            <div className="flex-1"><ColorPicker label="Testo" value={btn.textColor} onChange={(v) => updateButton(btn.id, { textColor: v })} /></div>
          </div>
          <Input label="Border Radius" value={btn.borderRadius} onChange={(e) => updateButton(btn.id, { borderRadius: e.target.value })} placeholder="8px" />
          <button onClick={() => removeButton(btn.id)} className="text-[10px] text-red-500 hover:text-red-600">Rimuovi pulsante</button>
        </div>
      ))}
    </div>
  );
}

// ============================
// SHAPE TOOLS
// ============================

export function ShapeTools({ block }: { block: Block }) {
  const { updateBlockShape, updateBlockStyle } = usePageStore();

  const SHAPES = [
    { name: 'Rettangolo', icon: Square, clipPath: 'none' },
    { name: 'Cerchio', icon: Circle, clipPath: 'circle(50% at 50% 50%)' },
    { name: 'Ellisse', icon: Circle, clipPath: 'ellipse(50% 35% at 50% 50%)' },
    { name: 'Triangolo', icon: Triangle, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
    { name: 'Rombo', icon: Square, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    { name: 'Pentagono', icon: Pentagon, clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
    { name: 'Esagono', icon: Hexagon, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
    { name: 'Stella', icon: Star, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
    { name: 'Cuore', icon: Heart, clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")' },
    { name: 'Diag. Alto SX', icon: Square, clipPath: 'polygon(0 0, 100% 10%, 100% 100%, 0 100%)' },
    { name: 'Diag. Alto DX', icon: Square, clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' },
    { name: 'Diag. Basso SX', icon: Square, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 90%)' },
    { name: 'Diag. Basso DX', icon: Square, clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' },
    { name: 'Doppia diag.', icon: Square, clipPath: 'polygon(0 5%, 100% 0, 100% 95%, 0 100%)' },
    { name: 'Freccia giù', icon: Square, clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)' },
    { name: 'Freccia su', icon: Square, clipPath: 'polygon(50% 0, 100% 15%, 100% 100%, 0 100%, 0 15%)' },
    { name: 'Angolo SX', icon: Square, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 15%)' },
    { name: 'Angolo DX', icon: Square, clipPath: 'polygon(0 0, 85% 0, 100% 15%, 100% 100%, 0 100%)' },
    { name: 'Croce', icon: Square, clipPath: 'polygon(33% 0%, 66% 0%, 66% 33%, 100% 33%, 100% 66%, 66% 66%, 66% 100%, 33% 100%, 33% 66%, 0% 66%, 0% 33%, 33% 33%)' },
    { name: 'Inset Round', icon: Square, clipPath: 'inset(5% round 20px)' },
    { name: 'Trapezio', icon: Square, clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)' },
    { name: 'Parallelogramma', icon: Square, clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' },
  ];

  const currentClipPath = block.shape?.type === 'clip-path' ? block.shape.value : 'none';

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        <Pentagon size={12} /> Forme Blocco
      </h4>

      <div className="grid grid-cols-4 gap-1.5">
        {SHAPES.map((shape) => {
          const isActive = currentClipPath === shape.clipPath;
          return (
            <button
              key={shape.name}
              onClick={() => {
                if (shape.clipPath === 'none') {
                  updateBlockShape(block.id, null);
                } else {
                  updateBlockShape(block.id, {
                    type: 'clip-path',
                    value: shape.clipPath,
                    topDivider: block.shape?.topDivider,
                    bottomDivider: block.shape?.bottomDivider,
                  });
                }
              }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] transition-colors',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              )}
              title={shape.name}
            >
              <div
                className="w-6 h-6 bg-current rounded-sm"
                style={{ clipPath: shape.clipPath !== 'none' ? shape.clipPath : undefined }}
              />
              <span className="truncate w-full text-center">{shape.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom clip-path input */}
      <div className="flex items-center gap-1">
        <div className="flex-1">
          <Input
            label="Clip-path personalizzato"
            value={currentClipPath === 'none' ? '' : currentClipPath}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (!val || val === 'none') {
                updateBlockShape(block.id, null);
              } else {
                updateBlockShape(block.id, { type: 'clip-path', value: val });
              }
            }}
            placeholder="polygon(0 0, 100% 0, 100% 100%, 0 100%)"
          />
        </div>
        <div className="pt-4">
          <AiButton blockId={block.id} fieldName="clip-path" fieldValue={currentClipPath} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ============================
// POSITION & SIZE PRECISION
// ============================

export function PositionSizeEditor({ block }: { block: Block }) {
  const { updateBlockStyle } = usePageStore();
  const s = block.style;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
        <Move size={12} /> Posizione & Dimensione
      </h4>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Larghezza"
          value={s.layout.width}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, width: e.target.value } })}
          placeholder="100%"
        />
        <Input
          label="Max larghezza"
          value={s.layout.maxWidth}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, maxWidth: e.target.value } })}
          placeholder="1200px"
        />
        <Input
          label="Altezza min."
          value={s.layout.minHeight || ''}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, minHeight: e.target.value } })}
          placeholder="auto"
        />
        <Select
          label="Overflow"
          value={s.layout.overflow || 'visible'}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, overflow: e.target.value } })}
          options={[
            { value: 'visible', label: 'Visibile' },
            { value: 'hidden', label: 'Nascosto' },
            { value: 'auto', label: 'Auto scroll' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          label="Posizione"
          value={s.layout.position || 'static'}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, position: e.target.value } })}
          options={[
            { value: 'static', label: 'Statico' },
            { value: 'relative', label: 'Relativo' },
            { value: 'absolute', label: 'Assoluto' },
            { value: 'fixed', label: 'Fisso' },
            { value: 'sticky', label: 'Sticky' },
          ]}
        />
        <Input
          label="Z-Index"
          type="number"
          value={s.layout.zIndex || ''}
          onChange={(e) => updateBlockStyle(block.id, { layout: { ...s.layout, zIndex: Number(e.target.value) || undefined } })}
          placeholder="auto"
        />
      </div>

      {/* Fine-grained padding */}
      <div>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Padding (px precision)</span>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="text-center">
              <input
                value={s.layout.padding[side]}
                onChange={(e) => updateBlockStyle(block.id, {
                  layout: { ...s.layout, padding: { ...s.layout.padding, [side]: e.target.value } }
                })}
                className="w-full px-1 py-1 text-[10px] text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="0"
              />
              <span className="text-[8px] text-zinc-400">{side[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fine-grained margin */}
      <div>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Margine (px precision)</span>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="text-center">
              <input
                value={s.layout.margin[side]}
                onChange={(e) => updateBlockStyle(block.id, {
                  layout: { ...s.layout, margin: { ...s.layout.margin, [side]: e.target.value } }
                })}
                className="w-full px-1 py-1 text-[10px] text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="0"
              />
              <span className="text-[8px] text-zinc-400">{side[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
