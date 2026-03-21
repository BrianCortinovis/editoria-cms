'use client';

import { usePageStore } from '@/lib/stores/page-store';
import type { Block, BlockStyle } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GradientEditor } from './GradientEditor';
import { EffectsEditor } from './EffectsEditor';
import AIButton from '@/components/ai/AIButton';

interface StyleEditorProps {
  block: Block;
}

function Section({ title, defaultOpen = false, children, blockId, fieldName, contextData }: { title: string; defaultOpen?: boolean; children: React.ReactNode; blockId?: string; fieldName?: string; contextData?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b pb-3 mb-3" style={{ borderColor: 'var(--c-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full transition-colors"
        style={{ color: 'var(--c-text-1)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-0)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-1)')}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {title}
        </span>
        {open && blockId && fieldName && contextData && (
          <AIButton
            blockId={blockId}
            fieldName={fieldName}
            contextData={contextData}
            actions={[
              {
                id: `suggest-${fieldName}`,
                label: 'Suggerisci',
                prompt: `Suggest styling improvements for the ${title} section of this block: {context}. Return JSON with relevant CSS properties.`,
              },
            ]}
            compact
          />
        )}
      </button>
      {open && <div className="space-y-3 mt-3">{children}</div>}
    </div>
  );
}

function SpacingInput({ label, value, onChange }: {
  label: string;
  value: { top: string; right: string; bottom: string; left: string };
  onChange: (v: { top: string; right: string; bottom: string; left: string }) => void;
}) {
  return (
    <div>
      <span className="text-xs font-medium mb-1 block" style={{ color: 'var(--c-text-1)' }}>{label}</span>
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <input
            key={side}
            value={value[side]}
            onChange={(e) => onChange({ ...value, [side]: e.target.value })}
            placeholder={side[0].toUpperCase()}
            className="px-2 py-1 text-xs text-center rounded border"
            style={{
              borderColor: 'var(--c-border)',
              background: 'var(--c-bg-1)',
              color: 'var(--c-text-0)',
            }}
            title={side}
          />
        ))}
      </div>
    </div>
  );
}

export function StyleEditor({ block }: StyleEditorProps) {
  const { updateBlockStyle } = usePageStore();

  const s = block.style;

  const updateLayout = (updates: Partial<BlockStyle['layout']>) => {
    updateBlockStyle(block.id, { layout: { ...s.layout, ...updates } });
  };

  const updateBg = (updates: Partial<BlockStyle['background']>) => {
    updateBlockStyle(block.id, { background: { ...s.background, ...updates } });
  };

  const updateTypo = (updates: Partial<BlockStyle['typography']>) => {
    updateBlockStyle(block.id, { typography: { ...s.typography, ...updates } });
  };

  const updateBorder = (updates: Partial<BlockStyle['border']>) => {
    updateBlockStyle(block.id, { border: { ...s.border, ...updates } });
  };

  return (
    <div>
      {/* Layout */}
      <Section
        title="Layout"
        defaultOpen
        blockId={block.id}
        fieldName="layout"
        contextData={JSON.stringify({ layout: s.layout, blockType: block.type })}
      >
        <Select
          label="Display"
          value={s.layout.display}
          onChange={(e) => updateLayout({ display: e.target.value })}
          options={[
            { value: 'block', label: 'Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'grid', label: 'Grid' },
            { value: 'inline-flex', label: 'Inline Flex' },
          ]}
        />
        {(s.layout.display === 'flex' || s.layout.display === 'inline-flex') && (
          <>
            <Select
              label="Direzione"
              value={s.layout.flexDirection || 'row'}
              onChange={(e) => updateLayout({ flexDirection: e.target.value })}
              options={[
                { value: 'row', label: 'Riga' },
                { value: 'column', label: 'Colonna' },
                { value: 'row-reverse', label: 'Riga inversa' },
                { value: 'column-reverse', label: 'Colonna inversa' },
              ]}
            />
            <Select
              label="Allineamento"
              value={s.layout.alignItems || 'stretch'}
              onChange={(e) => updateLayout({ alignItems: e.target.value })}
              options={[
                { value: 'stretch', label: 'Stretch' },
                { value: 'flex-start', label: 'Inizio' },
                { value: 'center', label: 'Centro' },
                { value: 'flex-end', label: 'Fine' },
              ]}
            />
            <Select
              label="Giustificazione"
              value={s.layout.justifyContent || 'flex-start'}
              onChange={(e) => updateLayout({ justifyContent: e.target.value })}
              options={[
                { value: 'flex-start', label: 'Inizio' },
                { value: 'center', label: 'Centro' },
                { value: 'flex-end', label: 'Fine' },
                { value: 'space-between', label: 'Space Between' },
                { value: 'space-around', label: 'Space Around' },
              ]}
            />
            <Input label="Gap" value={s.layout.gap || ''} onChange={(e) => updateLayout({ gap: e.target.value })} placeholder="16px" />
          </>
        )}
        <Input label="Larghezza" value={s.layout.width} onChange={(e) => updateLayout({ width: e.target.value })} />
        <Input label="Max Larghezza" value={s.layout.maxWidth} onChange={(e) => updateLayout({ maxWidth: e.target.value })} />
        <Input label="Altezza Minima" value={s.layout.minHeight || ''} onChange={(e) => updateLayout({ minHeight: e.target.value })} />
        <SpacingInput label="Padding" value={s.layout.padding} onChange={(v) => updateLayout({ padding: v })} />
        <SpacingInput label="Margine" value={s.layout.margin} onChange={(v) => updateLayout({ margin: v })} />
      </Section>

      {/* Background */}
      <Section
        title="Sfondo"
        blockId={block.id}
        fieldName="background"
        contextData={JSON.stringify({ background: s.background, blockType: block.type })}
      >
        <Select
          label="Tipo"
          value={s.background.type}
          onChange={(e) => updateBg({ type: e.target.value as BlockStyle['background']['type'] })}
          options={[
            { value: 'none', label: 'Nessuno' },
            { value: 'color', label: 'Colore' },
            { value: 'gradient', label: 'Gradiente' },
            { value: 'image', label: 'Immagine' },
          ]}
        />
        {s.background.type === 'color' && (
          <ColorPicker label="Colore" value={s.background.value} onChange={(v) => updateBg({ value: v })} />
        )}
        {s.background.type === 'gradient' && (
          <Input label="Gradiente CSS" value={s.background.value} onChange={(e) => updateBg({ value: e.target.value })} placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
        )}
        {s.background.type === 'image' && (
          <>
            <Input label="URL Immagine" value={s.background.value} onChange={(e) => updateBg({ value: e.target.value })} />
            <Input label="Dimensione" value={s.background.size || 'cover'} onChange={(e) => updateBg({ size: e.target.value })} />
            <Input label="Posizione" value={s.background.position || 'center'} onChange={(e) => updateBg({ position: e.target.value })} />
            <Toggle label="Parallax" checked={s.background.parallax || false} onChange={(v) => updateBg({ parallax: v })} />
          </>
        )}
        {(s.background.type === 'image' || s.background.type === 'video') && (
          <Input label="Overlay (rgba)" value={s.background.overlay || ''} onChange={(e) => updateBg({ overlay: e.target.value })} placeholder="rgba(0,0,0,0.5)" />
        )}
      </Section>

      {/* Advanced Gradient Editor */}
      <GradientEditor block={block} />

      {/* Advanced Effects Editor */}
      <EffectsEditor block={block} />

      {/* Typography */}
      <Section
        title="Tipografia"
        blockId={block.id}
        fieldName="typography"
        contextData={JSON.stringify({ typography: s.typography, blockType: block.type })}
      >
        <Input label="Font Family" value={s.typography.fontFamily || ''} onChange={(e) => updateTypo({ fontFamily: e.target.value })} placeholder="Inter, sans-serif" />
        <Input label="Dimensione" value={s.typography.fontSize || ''} onChange={(e) => updateTypo({ fontSize: e.target.value })} placeholder="16px" />
        <Select
          label="Peso"
          value={s.typography.fontWeight || '400'}
          onChange={(e) => updateTypo({ fontWeight: e.target.value })}
          options={[
            { value: '300', label: 'Light' },
            { value: '400', label: 'Regular' },
            { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' },
            { value: '700', label: 'Bold' },
            { value: '800', label: 'Extra Bold' },
          ]}
        />
        <Input label="Interlinea" value={s.typography.lineHeight || ''} onChange={(e) => updateTypo({ lineHeight: e.target.value })} placeholder="1.5" />
        <Input label="Spaziatura lettere" value={s.typography.letterSpacing || ''} onChange={(e) => updateTypo({ letterSpacing: e.target.value })} placeholder="0.5px" />
        <ColorPicker label="Colore testo" value={s.typography.color || ''} onChange={(v) => updateTypo({ color: v })} />
        <Select
          label="Allineamento"
          value={s.typography.textAlign || 'left'}
          onChange={(e) => updateTypo({ textAlign: e.target.value })}
          options={[
            { value: 'left', label: 'Sinistra' },
            { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Destra' },
            { value: 'justify', label: 'Giustificato' },
          ]}
        />
      </Section>

      {/* Border */}
      <Section
        title="Bordo"
        blockId={block.id}
        fieldName="border"
        contextData={JSON.stringify({ border: s.border, blockType: block.type })}
      >
        <Input label="Spessore" value={s.border.width || ''} onChange={(e) => updateBorder({ width: e.target.value })} placeholder="1px" />
        <Select
          label="Stile"
          value={s.border.style || 'none'}
          onChange={(e) => updateBorder({ style: e.target.value })}
          options={[
            { value: 'none', label: 'Nessuno' },
            { value: 'solid', label: 'Solido' },
            { value: 'dashed', label: 'Tratteggiato' },
            { value: 'dotted', label: 'Punteggiato' },
          ]}
        />
        <ColorPicker label="Colore bordo" value={s.border.color || ''} onChange={(v) => updateBorder({ color: v })} />
        <Input label="Raggio" value={s.border.radius || ''} onChange={(e) => updateBorder({ radius: e.target.value })} placeholder="8px" />
      </Section>

      {/* Effects */}
      <Section title="Effetti & Filtri">
        <Input label="Ombra box" value={s.shadow || ''} onChange={(e) => updateBlockStyle(block.id, { shadow: e.target.value })} placeholder="0 4px 6px rgba(0,0,0,0.1)" />
        <Slider label="Opacita" value={(s.opacity ?? 1) * 100} onChange={(v) => updateBlockStyle(block.id, { opacity: v / 100 })} min={0} max={100} suffix="%" />
        <Input label="Transform" value={s.transform || ''} onChange={(e) => updateBlockStyle(block.id, { transform: e.target.value })} placeholder="rotate(5deg) scale(1.05)" />
        <Input label="Transition" value={s.transition || ''} onChange={(e) => updateBlockStyle(block.id, { transition: e.target.value })} placeholder="all 0.3s ease" />

        <h5 className="text-[10px] font-semibold uppercase mt-3 mb-1" style={{ color: 'var(--c-text-2)' }}>Filtri CSS</h5>
        <Input label="Filtro" value={s.filter || ''} onChange={(e) => updateBlockStyle(block.id, { filter: e.target.value })} placeholder="blur(4px) brightness(1.2)" />
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            { label: 'Blur 2px', val: 'blur(2px)' },
            { label: 'Blur 5px', val: 'blur(5px)' },
            { label: 'Blur 10px', val: 'blur(10px)' },
            { label: 'Luminoso', val: 'brightness(1.3)' },
            { label: 'Scuro', val: 'brightness(0.7)' },
            { label: 'Contrasto', val: 'contrast(1.5)' },
            { label: 'Grigio', val: 'grayscale(1)' },
            { label: 'Seppia', val: 'sepia(1)' },
            { label: 'Saturato', val: 'saturate(2)' },
            { label: 'Invertito', val: 'invert(1)' },
            { label: 'Hue 90', val: 'hue-rotate(90deg)' },
            { label: 'Nessuno', val: '' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => updateBlockStyle(block.id, { filter: f.val })}
              className={cn('px-1.5 py-0.5 text-[9px] rounded transition-colors')}
              style={s.filter === f.val ? { background: '#3b82f6', color: 'white' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
              onMouseEnter={(e) => {
                if (s.filter !== f.val) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (s.filter !== f.val) {
                  e.currentTarget.style.background = 'var(--c-bg-1)';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <h5 className="text-[10px] font-semibold uppercase mt-3 mb-1" style={{ color: 'var(--c-text-2)' }}>Vetro & Sfocatura Sfondo</h5>
        <Input label="Backdrop Filter" value={s.backdropFilter || ''} onChange={(e) => updateBlockStyle(block.id, { backdropFilter: e.target.value })} placeholder="blur(10px) saturate(1.5)" />
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            { label: 'Vetro', val: 'blur(10px) saturate(1.8)' },
            { label: 'Vetro leggero', val: 'blur(5px) saturate(1.2)' },
            { label: 'Vetro forte', val: 'blur(20px) saturate(2)' },
            { label: 'Nessuno', val: '' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => updateBlockStyle(block.id, { backdropFilter: f.val })}
              className={cn('px-1.5 py-0.5 text-[9px] rounded transition-colors')}
              style={s.backdropFilter === f.val ? { background: '#3b82f6', color: 'white' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
              onMouseEnter={(e) => {
                if (s.backdropFilter !== f.val) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (s.backdropFilter !== f.val) {
                  e.currentTarget.style.background = 'var(--c-bg-1)';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <h5 className="text-[10px] font-semibold uppercase mt-3 mb-1" style={{ color: 'var(--c-text-2)' }}>Blend Mode</h5>
        <Select
          label="Mix Blend Mode"
          value={s.mixBlendMode || 'normal'}
          onChange={(e) => updateBlockStyle(block.id, { mixBlendMode: e.target.value })}
          options={[
            { value: 'normal', label: 'Normale' },
            { value: 'multiply', label: 'Moltiplica' },
            { value: 'screen', label: 'Schermo' },
            { value: 'overlay', label: 'Sovrapposizione' },
            { value: 'darken', label: 'Scurisci' },
            { value: 'lighten', label: 'Schiarisci' },
            { value: 'color-dodge', label: 'Scherma colore' },
            { value: 'color-burn', label: 'Brucia colore' },
            { value: 'hard-light', label: 'Luce forte' },
            { value: 'soft-light', label: 'Luce tenue' },
            { value: 'difference', label: 'Differenza' },
            { value: 'exclusion', label: 'Esclusione' },
            { value: 'hue', label: 'Tonalita' },
            { value: 'saturation', label: 'Saturazione' },
            { value: 'color', label: 'Colore' },
            { value: 'luminosity', label: 'Luminosita' },
          ]}
        />

        <h5 className="text-[10px] font-semibold uppercase mt-3 mb-1" style={{ color: 'var(--c-text-2)' }}>Ombra Testo</h5>
        <Input label="Text Shadow" value={s.textShadow || ''} onChange={(e) => updateBlockStyle(block.id, { textShadow: e.target.value })} placeholder="2px 2px 4px rgba(0,0,0,0.5)" />
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            { label: 'Ombra leggera', val: '1px 1px 2px rgba(0,0,0,0.3)' },
            { label: 'Ombra forte', val: '2px 2px 6px rgba(0,0,0,0.6)' },
            { label: 'Glow bianco', val: '0 0 10px rgba(255,255,255,0.8)' },
            { label: 'Glow blu', val: '0 0 15px rgba(59,130,246,0.7)' },
            { label: 'Glow rosso', val: '0 0 15px rgba(239,68,68,0.7)' },
            { label: 'Neon verde', val: '0 0 10px #0f0, 0 0 20px #0f0, 0 0 40px #0f0' },
            { label: 'Emboss', val: '1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.3)' },
            { label: 'Outline', val: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' },
            { label: 'Nessuno', val: '' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => updateBlockStyle(block.id, { textShadow: f.val })}
              className={cn('px-1.5 py-0.5 text-[9px] rounded transition-colors')}
              style={s.textShadow === f.val ? { background: '#3b82f6', color: 'white' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
              onMouseEnter={(e) => {
                if (s.textShadow !== f.val) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (s.textShadow !== f.val) {
                  e.currentTarget.style.background = 'var(--c-bg-1)';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <h5 className="text-[10px] font-semibold uppercase mt-3 mb-1" style={{ color: 'var(--c-text-2)' }}>Ombra Box Presets</h5>
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Nessuna', val: '' },
            { label: 'Leggera', val: '0 1px 3px rgba(0,0,0,0.12)' },
            { label: 'Media', val: '0 4px 6px rgba(0,0,0,0.1)' },
            { label: 'Forte', val: '0 10px 25px rgba(0,0,0,0.15)' },
            { label: 'XL', val: '0 20px 50px rgba(0,0,0,0.2)' },
            { label: 'Interna', val: 'inset 0 2px 4px rgba(0,0,0,0.15)' },
            { label: 'Glow blu', val: '0 0 20px rgba(59,130,246,0.4)' },
            { label: 'Glow viola', val: '0 0 20px rgba(139,92,246,0.4)' },
            { label: 'Bordo glow', val: '0 0 0 3px rgba(59,130,246,0.3)' },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => updateBlockStyle(block.id, { shadow: f.val })}
              className={cn('px-1.5 py-0.5 text-[9px] rounded transition-colors')}
              style={s.shadow === f.val ? { background: '#3b82f6', color: 'white' } : { background: 'var(--c-bg-1)', color: 'var(--c-text-1)' }}
              onMouseEnter={(e) => {
                if (s.shadow !== f.val) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (s.shadow !== f.val) {
                  e.currentTarget.style.background = 'var(--c-bg-1)';
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Custom CSS */}
      <Section title="CSS Personalizzato">
        <div className="flex items-start gap-1">
          <textarea
            value={s.customCss || ''}
            onChange={(e) => updateBlockStyle(block.id, { customCss: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border min-h-[80px] resize-y"
            style={{
              background: 'var(--c-bg-1)',
              borderColor: 'var(--c-border)',
              color: 'var(--c-text-0)',
            }}
            placeholder="/* CSS aggiuntivo */"
          />
        </div>
      </Section>
    </div>
  );
}
