'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, GlassmorphismEffect } from '@/lib/types';
import AIButton from '@/components/ai/AIButton';

interface EffectsEditorProps {
  block: Block;
}

export function EffectsEditor({ block }: EffectsEditorProps) {
  const { updateBlockStyle } = usePageStore();
  const effects = block.style.effects || {};

  const [openGlass, setOpenGlass] = useState(true);

  const glassmorphism = effects.glassmorphism || {
    enabled: false,
    blur: 10,
    saturation: 100,
    bgOpacity: 0.1,
    bgColor: '#ffffff',
    borderOpacity: 0.2,
  };

  const updateEffects = (newEffects: Partial<typeof effects>) => {
    // Use current effects from block prop, not stale closure value
    const currentEffects = block.style.effects || {};
    updateBlockStyle(block.id, {
      effects: { ...currentEffects, ...newEffects },
    });
  };

  const updateGlass = (updates: Partial<GlassmorphismEffect>) => {
    // Use current glassmorphism from block prop
    const currentGlassmorphism = block.style.effects?.glassmorphism || glassmorphism;
    updateEffects({
      glassmorphism: { ...currentGlassmorphism, ...updates },
    });
  };

  const applyGlassPreset = (preset: Partial<GlassmorphismEffect>) => {
    updateGlass({ ...preset, enabled: true });
  };

  const contextData = JSON.stringify({
    current: effects,
    blockType: block.type,
    projectTheme: 'dark',
  });

  return (
    <div className="border-b" style={{ borderColor: 'var(--c-border)' }}>
      {/* Glassmorphism Section */}
      <div
        onClick={() => setOpenGlass(!openGlass)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium cursor-pointer"
        style={{ color: 'var(--c-text-0)' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenGlass(!openGlass); }}
      >
        <span className="flex items-center gap-2">
          {openGlass ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Glassmorphism
        </span>
        {openGlass && (
          <AIButton
            blockId={block.id}
            fieldName="glassmorphism"
            contextData={contextData}
            actions={[
              {
                id: 'suggest-glass',
                label: 'Suggerisci',
                prompt: 'Suggest beautiful glassmorphism settings for this block: {context}. Return pure JSON with blur, saturation, bgOpacity, bgColor, borderOpacity.',
              },
            ]}
            onCommand={(cmd: any) => {
              if (cmd.action === 'updateEffects' && cmd.glassmorphism) {
                updateGlass(cmd.glassmorphism);
              }
            }}
            compact
          />
        )}
      </div>

      {openGlass && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={glassmorphism.enabled}
              onChange={(e) => updateGlass({ enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
              Abilita Glassmorphism
            </span>
          </label>

          {glassmorphism.enabled && (
            <>
              {/* Preset Buttons */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Preset
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      applyGlassPreset({
                        blur: 8,
                        saturation: 110,
                        bgOpacity: 0.08,
                        bgColor: '#ffffff',
                        borderOpacity: 0.15,
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    Vetro Chiaro
                  </button>
                  <button
                    onClick={() =>
                      applyGlassPreset({
                        blur: 12,
                        saturation: 90,
                        bgOpacity: 0.15,
                        bgColor: '#000000',
                        borderOpacity: 0.2,
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    Vetro Scuro
                  </button>
                  <button
                    onClick={() =>
                      applyGlassPreset({
                        blur: 10,
                        saturation: 120,
                        bgOpacity: 0.1,
                        bgColor: '#3b82f6',
                        borderOpacity: 0.25,
                      })
                    }
                    className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
                  >
                    Vetro Colorato
                  </button>
                </div>
              </div>

              {/* Blur Slider */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Sfocatura: {glassmorphism.blur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={glassmorphism.blur}
                  onChange={(e) => updateGlass({ blur: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Saturation Slider */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Saturazione: {glassmorphism.saturation}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={glassmorphism.saturation}
                  onChange={(e) => updateGlass({ saturation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* BG Opacity */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Opacità sfondo: {(glassmorphism.bgOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glassmorphism.bgOpacity}
                  onChange={(e) => updateGlass({ bgOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* BG Color */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Colore sfondo
                </label>
                <input
                  type="color"
                  value={glassmorphism.bgColor}
                  onChange={(e) => updateGlass({ bgColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>

              {/* Border Opacity */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Opacità bordo: {(glassmorphism.borderOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={glassmorphism.borderOpacity}
                  onChange={(e) => updateGlass({ borderOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}

          <AIButton
            blockId={block.id}
            fieldName="glassmorphism"
            fieldValue={contextData}
            onResult={(result) => {
              try {
                const parsed = JSON.parse(result) as GlassmorphismEffect;
                updateGlass(parsed);
              } catch {
                console.error('Invalid glassmorphism response:', result);
              }
            }}
            actions={[
              {
                id: 'suggest-effects',
                label: 'Suggerisci glassmorphism',
                prompt: 'Suggest beautiful glassmorphism settings for this block type: {context}. Return a pure JSON object matching GlassmorphismEffect type.',
              },
            ]}
            compact
          />
        </div>
      )}
    </div>
  );
}
