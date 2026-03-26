'use client';
import { useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import type { Block } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils/cn';
import { ClipPathEditor } from '@/components/shapes/ClipPathEditor';
import {
  Move, Magnet, Pentagon,
  Square, Circle, Triangle, Hexagon, Star, Heart,
} from 'lucide-react';

// ============================
// SNAP & GRID SETTINGS
// ============================

export function SnapGridSettings() {
  const {
    showGrid,
    toggleGrid,
    gridSize,
    setGridSize,
    showOutlines,
    toggleOutlines,
    snapEnabled,
    toggleSnapEnabled,
    snapToDocumentEdges,
    toggleSnapToDocumentEdges,
  } = useUiStore();

  return (
    <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--c-border)' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--c-text-1)' }}>
        <Magnet size={12} /> Griglia & Snap
      </h4>

      <Toggle label="Griglia visibile" checked={showGrid} onChange={toggleGrid} size="sm" />
      <Toggle label="Contorni blocchi" checked={showOutlines} onChange={toggleOutlines} size="sm" />
      <Toggle label="Magneti (snap)" checked={snapEnabled} onChange={toggleSnapEnabled} size="sm" />
      <Toggle label="Aggancio bordi pagina" checked={snapToDocumentEdges} onChange={toggleSnapToDocumentEdges} size="sm" />

      {showGrid && (
        <div>
          <Slider
            label="Dimensione griglia"
            value={gridSize}
            onChange={setGridSize}
            min={1}
            max={50}
            suffix="px"
          />
          <div className="flex gap-1 mt-2">
            {[1, 2, 5, 8, 10, 16, 20].map((v) => (
              <button
                key={v}
                onClick={() => setGridSize(v)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono transition-colors'
                )}
                style={gridSize === v ? { background: 'var(--c-accent)', color: 'white' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
                onMouseEnter={(e) => {
                  if (gridSize !== v) {
                    e.currentTarget.style.background = 'var(--c-accent-soft)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (gridSize !== v) {
                    e.currentTarget.style.background = 'var(--c-bg-1)';
                  }
                }}
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
// SHAPE TOOLS
// ============================

export function ShapeTools({ block }: { block: Block }) {
  const { updateBlockShape } = usePageStore();
  const [shapeTab, setShapeTab] = useState<'preset' | 'editor'>('preset');

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
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--c-text-1)' }}>
        <Pentagon size={12} /> Forme Blocco
      </h4>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--c-border)' }}>
        <button
          onClick={() => setShapeTab('preset')}
          className="px-3 py-1 text-xs font-medium border-b-2 transition-colors"
          style={{
            borderColor: shapeTab === 'preset' ? 'var(--c-accent)' : 'transparent',
            color: shapeTab === 'preset' ? 'var(--c-accent)' : 'var(--c-text-1)',
          }}
        >
          Preset
        </button>
        <button
          onClick={() => setShapeTab('editor')}
          className="px-3 py-1 text-xs font-medium border-b-2 transition-colors"
          style={{
            borderColor: shapeTab === 'editor' ? 'var(--c-accent)' : 'transparent',
            color: shapeTab === 'editor' ? 'var(--c-accent)' : 'var(--c-text-1)',
          }}
        >
          Editor
        </button>
      </div>

      {shapeTab === 'preset' && (
        <>
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
                    'flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] transition-colors'
                  )}
                  style={isActive ? { background: 'var(--c-accent-soft)', color: 'var(--c-accent)', boxShadow: '0 0 0 1px var(--c-accent)' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--c-accent-soft)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--c-bg-1)';
                    }
                  }}
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
            </div>
          </div>
        </>
      )}

      {shapeTab === 'editor' && (
        <ClipPathEditor block={block} />
      )}
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
      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--c-text-1)' }}>
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
        <span className="text-xs font-medium mb-1 block" style={{ color: 'var(--c-text-1)' }}>Padding (px precision)</span>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="text-center">
              <input
                value={s.layout.padding[side]}
                onChange={(e) => updateBlockStyle(block.id, {
                  layout: { ...s.layout, padding: { ...s.layout.padding, [side]: e.target.value } }
                })}
                className="w-full px-1 py-1 text-[10px] text-center rounded border"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'var(--c-bg-1)',
                  color: 'var(--c-text-0)',
                }}
                placeholder="0"
              />
              <span className="text-[8px]" style={{ color: 'var(--c-text-2)' }}>{side[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fine-grained margin */}
      <div>
        <span className="text-xs font-medium mb-1 block" style={{ color: 'var(--c-text-1)' }}>Margine (px precision)</span>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="text-center">
              <input
                value={s.layout.margin[side]}
                onChange={(e) => updateBlockStyle(block.id, {
                  layout: { ...s.layout, margin: { ...s.layout.margin, [side]: e.target.value } }
                })}
                className="w-full px-1 py-1 text-[10px] text-center rounded border"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'var(--c-bg-1)',
                  color: 'var(--c-text-0)',
                }}
                placeholder="0"
              />
              <span className="text-[8px]" style={{ color: 'var(--c-text-2)' }}>{side[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
