'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, AdvancedGradient, GradientStop } from '@/lib/types';
import { buildCssGradient, GRADIENT_PRESETS } from '@/lib/shapes/gradients';
import { AIModal } from '@/components/ai/AIModal';

interface GradientEditorProps {
  block: Block;
}

export function GradientEditor({ block }: GradientEditorProps) {
  const { updateBlockStyle } = usePageStore();
  const gradient = block.style.background.advancedGradient || {
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 },
    ],
  };


  const [open, setOpen] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const updateGradient = useCallback((updates: Partial<AdvancedGradient>) => {
    // Use current gradient value from block prop, not stale closure value
    const currentGradient = block.style.background.advancedGradient || gradient;
    const updated = { ...currentGradient, ...updates };
    const cssValue = buildCssGradient(updated);
    updateBlockStyle(block.id, {
      background: {
        ...block.style.background,
        advancedGradient: updated,
        type: 'gradient',
        value: cssValue,
      },
    });
  }, [block, updateBlockStyle]);

  const updateStop = (index: number, updates: Partial<GradientStop>) => {
    const stops = [...gradient.stops];
    stops[index] = { ...stops[index], ...updates };
    updateGradient({ stops });
  };

  const addStop = () => {
    const stops = [...gradient.stops];
    const newPosition = (stops[stops.length - 1].position + stops[0].position) / 2;
    stops.push({ color: '#ffffff', position: newPosition });
    stops.sort((a, b) => a.position - b.position);
    if (stops.length <= 8) updateGradient({ stops });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length > 2) {
      const stops = gradient.stops.filter((_, i) => i !== index);
      updateGradient({ stops });
    }
  };

  const applyPreset = (preset: AdvancedGradient) => {
    updateGradient(preset);
  };

  const contextData = JSON.stringify({
    current: gradient,
    projectTheme: 'dark',
    blockType: block.type,
  });

  return (
    <div className="border-b" style={{ borderColor: 'var(--c-border)' }}>
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium cursor-pointer"
        style={{ color: 'var(--c-text-0)' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Gradiente Avanzato
        </span>
      </div>

      {open && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Type Selector */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Tipo
            </label>
            <div className="flex gap-2">
              {(['linear', 'radial', 'conic', 'mesh'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => updateGradient({ type })}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    background: gradient.type === type ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: gradient.type === type ? 'white' : 'var(--c-text-1)',
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Angle Slider */}
          {(gradient.type === 'linear' || gradient.type === 'conic') && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                Angolo: {gradient.angle}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={gradient.angle || 0}
                onChange={(e) => updateGradient({ angle: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )}

          {/* Stops List */}
          <div>
            <label className="text-xs font-semibold block" style={{ color: 'var(--c-text-1)' }}>
              Colori ({gradient.stops.length})
            </label>
            <div className="space-y-2">
              {gradient.stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded" style={{ background: 'var(--c-bg-2)' }}>
                  <input
                    type="color"
                    value={stop.color.startsWith('var(') ? '#667eea' : stop.color}
                    onChange={(e) => updateStop(idx, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) => updateStop(idx, { position: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8" style={{ color: 'var(--c-text-2)' }}>
                    {stop.position}%
                  </span>
                  {stop.opacity !== undefined && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={stop.opacity}
                      onChange={(e) => updateStop(idx, { opacity: Number(e.target.value) })}
                      className="w-16"
                      title="Opacity"
                    />
                  )}
                  <button
                    onClick={() => removeStop(idx)}
                    disabled={gradient.stops.length <= 2}
                    className="p-1 rounded opacity-50 hover:opacity-100 disabled:opacity-25"
                  >
                    <Trash2 size={14} style={{ color: 'var(--c-danger)' }} />
                  </button>
                </div>
              ))}
            </div>

            {gradient.stops.length < 8 && (
              <button
                onClick={addStop}
                className="mt-2 w-full px-2 py-1 rounded text-xs font-medium flex items-center justify-center gap-1"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-accent)' }}
              >
                <Plus size={14} /> Aggiungi colore
              </button>
            )}
          </div>

          {/* Animation Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gradient.animated || false}
                onChange={(e) => updateGradient({ animated: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
                Animato
              </span>
            </label>
            {gradient.animated && (
              <input
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={gradient.animationDuration || 3000}
                onChange={(e) => updateGradient({ animationDuration: Number(e.target.value) })}
                className="w-full"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gradient.scrollDriven || false}
                onChange={(e) => updateGradient({ scrollDriven: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
                Azionato da scroll
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gradient.hoverDriven || false}
                onChange={(e) => updateGradient({ hoverDriven: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
                Azionato da hover
              </span>
            </label>
          </div>

          {/* Live Preview */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Anteprima
            </label>
            <div
              className="w-full h-20 rounded"
              style={{ background: buildCssGradient(gradient) }}
            />
          </div>

          {/* Presets */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Preset
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="h-8 rounded cursor-pointer hover:ring-2"
                  style={{
                    background: buildCssGradient(preset),
                    outlineColor: 'var(--c-accent)',
                  }}
                  title={`Preset ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* AI Suggestions Row */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setAiModalOpen(true)}
              className="w-full px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--c-accent)', color: 'white' }}
            >
              <Sparkles size={16} />
              Suggerisci gradiente
            </button>
          </div>

          <AIModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            defaultPrompt="Suggest a beautiful gradient for this block type: {context}. Return a pure JSON object matching AdvancedGradient type."
            contextData={contextData}
            title="Suggerisci Gradiente"
            onApply={(result) => {
              try {
                const parsed = JSON.parse(result) as AdvancedGradient;
                updateGradient(parsed);
              } catch {
                console.error('Invalid gradient response:', result);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
