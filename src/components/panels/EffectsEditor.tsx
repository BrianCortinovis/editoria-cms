'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, RotateCcw } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, GlassmorphismEffect } from '@/lib/types';
import { AIModal } from '@/components/ai/AIModal';
import { ColorPicker } from '@/components/ui/color-picker';

interface EffectsEditorProps {
  block: Block;
}

export function EffectsEditor({ block }: EffectsEditorProps) {
  const { updateBlockStyle } = usePageStore();
  const effects = block.style.effects || {};

  const [openGlass, setOpenGlass] = useState(true);
  const [openFilters, setOpenFilters] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const glassmorphism = effects.glassmorphism || {
    enabled: false,
    blur: 10,
    saturation: 100,
    bgOpacity: 0.1,
    bgColor: '#ffffff',
    borderOpacity: 0.2,
  };

  const filters = effects.filters || {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotate: 0,
    opacity: 100,
    dropShadow: 0,
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

  const updateFilters = (updates: Partial<typeof filters>) => {
    const currentFilters = block.style.effects?.filters || filters;
    updateEffects({
      filters: { ...currentFilters, ...updates },
    });
  };

  const resetFilters = () => {
    updateFilters({
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hueRotate: 0,
      opacity: 100,
      dropShadow: 0,
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
                        bgColor: 'rgba(124,138,170,0.1)',
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
                <ColorPicker
                  label="Colore sfondo"
                  value={glassmorphism.bgColor}
                  onChange={(bgColor) => updateGlass({ bgColor })}
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

          <button
            onClick={() => setAiModalOpen(true)}
            className="w-full px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: 'var(--c-accent)', color: 'white' }}
          >
            <Sparkles size={16} />
            Suggerisci glassmorphism
          </button>
        </div>
      )}

      <AIModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        defaultPrompt="Suggest beautiful glassmorphism settings for this block type: {context}. Return a pure JSON object matching GlassmorphismEffect type."
        contextData={contextData}
        blockId={block.id}
        fieldName="glassmorphism"
        title="Suggerisci Glassmorphism"
        onApply={(result) => {
          try {
            const parsed = JSON.parse(result) as GlassmorphismEffect;
            updateGlass(parsed);
          } catch {
            console.error('Invalid glassmorphism response:', result);
          }
        }}
      />

      {/* CSS Filters Section */}
      <div
        onClick={() => setOpenFilters(!openFilters)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium cursor-pointer"
        style={{ color: 'var(--c-text-0)', borderTop: '1px solid var(--c-border)' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenFilters(!openFilters); }}
      >
        <span className="flex items-center gap-2">
          {openFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Filtri CSS
        </span>
      </div>

      {openFilters && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-3 py-2 rounded text-xs font-medium flex items-center justify-center gap-2"
            style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
          >
            <RotateCcw size={14} />
            Ripristina filtri
          </button>

          {/* Blur Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Blur</span>
              <span>{filters.blur}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={filters.blur}
              onChange={(e) => updateFilters({ blur: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Brightness Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Luminosità</span>
              <span>{filters.brightness}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="150"
              value={filters.brightness}
              onChange={(e) => updateFilters({ brightness: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Contrast Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Contrasto</span>
              <span>{filters.contrast}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="150"
              value={filters.contrast}
              onChange={(e) => updateFilters({ contrast: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Saturation Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Saturazione</span>
              <span>{filters.saturation}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={filters.saturation}
              onChange={(e) => updateFilters({ saturation: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Hue Rotate Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Tonalità</span>
              <span>{filters.hueRotate}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={filters.hueRotate}
              onChange={(e) => updateFilters({ hueRotate: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Opacità</span>
              <span>{filters.opacity}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.opacity}
              onChange={(e) => updateFilters({ opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Drop Shadow Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 flex justify-between" style={{ color: 'var(--c-text-1)' }}>
              <span>Ombra</span>
              <span>{filters.dropShadow}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={filters.dropShadow}
              onChange={(e) => updateFilters({ dropShadow: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
