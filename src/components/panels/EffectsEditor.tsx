'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, GlassmorphismEffect, NoiseEffect, GrainEffect } from '@/lib/types';
import AIButton from '@/components/ai/AIButton';

interface EffectsEditorProps {
  block: Block;
}

export function EffectsEditor({ block }: EffectsEditorProps) {
  const { updateBlockStyle } = usePageStore();
  const effects = block.style.effects || {};

  const [openGlass, setOpenGlass] = useState(true);
  const [openNoise, setOpenNoise] = useState(false);
  const [openGrain, setOpenGrain] = useState(false);
  const [openParallax, setOpenParallax] = useState(false);

  const glassmorphism = effects.glassmorphism || {
    enabled: false,
    blur: 10,
    saturation: 100,
    bgOpacity: 0.1,
    bgColor: '#ffffff',
    borderOpacity: 0.2,
  };

  const noise = effects.noise || {
    enabled: false,
    opacity: 0.1,
    frequency: 1,
    type: 'fractalNoise' as const,
  };

  const grain = effects.grain || {
    enabled: false,
    opacity: 0.15,
    size: 2,
  };

  const updateEffects = (newEffects: Partial<typeof effects>) => {
    updateBlockStyle(block.id, {
      effects: { ...effects, ...newEffects },
    });
  };

  const updateGlass = (updates: Partial<GlassmorphismEffect>) => {
    updateEffects({
      glassmorphism: { ...glassmorphism, ...updates },
    });
  };

  const updateNoise = (updates: Partial<NoiseEffect>) => {
    updateEffects({
      noise: { ...noise, ...updates },
    });
  };

  const updateGrain = (updates: Partial<GrainEffect>) => {
    updateEffects({
      grain: { ...grain, ...updates },
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
      <button
        onClick={() => setOpenGlass(!openGlass)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        style={{ color: 'var(--c-text-0)' }}
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
      </button>

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

      {/* Noise Section */}
      <button
        onClick={() => setOpenNoise(!openNoise)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        style={{ color: 'var(--c-text-0)' }}
      >
        <span className="flex items-center gap-2">
          {openNoise ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Noise
        </span>
        {openNoise && (
          <AIButton
            blockId={block.id}
            fieldName="noise"
            contextData={JSON.stringify({ blockType: block.type })}
            actions={[
              {
                id: 'suggest-noise',
                label: 'Suggerisci',
                prompt: 'Suggest noise effect settings. Return JSON with type (fractalNoise|turbulence), opacity (0-1), frequency (0.5-5).',
              },
            ]}
            onCommand={(cmd: any) => {
              if (cmd.action === 'updateEffects' && cmd.noise) {
                updateNoise(cmd.noise);
              }
            }}
            compact
          />
        )}
      </button>

      {openNoise && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noise.enabled}
              onChange={(e) => updateNoise({ enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
              Abilita Noise
            </span>
          </label>

          {noise.enabled && (
            <>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Tipo
                </label>
                <div className="flex gap-2">
                  {(['fractalNoise', 'turbulence'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateNoise({ type })}
                      className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      style={{
                        background: noise.type === type ? 'var(--c-accent)' : 'var(--c-bg-2)',
                        color: noise.type === type ? 'white' : 'var(--c-text-1)',
                      }}
                    >
                      {type === 'fractalNoise' ? 'Frattale' : 'Turbolenza'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Opacità: {(noise.opacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={noise.opacity}
                  onChange={(e) => updateNoise({ opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Frequenza: {noise.frequency.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={noise.frequency}
                  onChange={(e) => updateNoise({ frequency: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Grain Section */}
      <button
        onClick={() => setOpenGrain(!openGrain)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        style={{ color: 'var(--c-text-0)' }}
      >
        <span className="flex items-center gap-2">
          {openGrain ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Grain
        </span>
        {openGrain && (
          <AIButton
            blockId={block.id}
            fieldName="grain"
            contextData={JSON.stringify({ blockType: block.type })}
            actions={[
              {
                id: 'suggest-grain',
                label: 'Suggerisci',
                prompt: 'Suggest grain effect settings. Return JSON with opacity (0-1) and size (1-10).',
              },
            ]}
            onCommand={(cmd: any) => {
              if (cmd.action === 'updateEffects' && cmd.grain) {
                updateGrain(cmd.grain);
              }
            }}
            compact
          />
        )}
      </button>

      {openGrain && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={grain.enabled}
              onChange={(e) => updateGrain({ enabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
              Abilita Grain
            </span>
          </label>

          {grain.enabled && (
            <>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Opacità: {(grain.opacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={grain.opacity}
                  onChange={(e) => updateGrain({ opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Dimensione: {grain.size}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={grain.size}
                  onChange={(e) => updateGrain({ size: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Parallax Section */}
      <button
        onClick={() => setOpenParallax(!openParallax)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium"
        style={{ color: 'var(--c-text-0)' }}
      >
        <span className="flex items-center gap-2">
          {openParallax ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Parallax
        </span>
      </button>

      {openParallax && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={block.style.background.parallax || false}
              onChange={(e) =>
                updateBlockStyle(block.id, {
                  background: {
                    ...block.style.background,
                    parallax: e.target.checked,
                  },
                })
              }
              className="w-4 h-4"
            />
            <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
              Abilita Parallax
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
