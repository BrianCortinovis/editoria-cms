'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, BlockAnimation, AnimationTrigger, AnimationEffect } from '@/lib/types';
import { AIModal } from '@/components/ai/AIModal';

interface AnimationEditorProps {
  block: Block;
}

const ANIMATION_EFFECTS: AnimationEffect[] = [
  'fade-in',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'zoom-out',
  'rotate',
  'bounce',
  'flip',
  'none',
];

const EASING_OPTIONS = [
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'linear', label: 'Linear' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Spring' },
  { value: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', label: 'Smooth' },
];

export function AnimationEditor({ block }: AnimationEditorProps) {
  const { updateBlock } = usePageStore();
  const animation = block.animation || {
    trigger: 'entrance' as AnimationTrigger,
    effect: 'fade-in' as AnimationEffect,
    duration: 600,
    delay: 0,
    easing: 'ease-out',
  };

  const [open, setOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const updateAnimation = (updates: Partial<BlockAnimation>) => {
    const currentAnimation = block.animation || animation;
    updateBlock(block.id, {
      animation: { ...currentAnimation, ...updates },
    });
  };

  const contextData = JSON.stringify({
    current: animation,
    blockType: block.type,
    projectTheme: 'dark',
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
          Animazioni
        </span>
      </div>

      {open && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Trigger Selector */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Trigger
            </label>
            <div className="flex gap-2">
              {(['entrance', 'scroll', 'hover'] as const).map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => updateAnimation({ trigger })}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    background: animation.trigger === trigger ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: animation.trigger === trigger ? 'white' : 'var(--c-text-1)',
                  }}
                >
                  {trigger === 'entrance' ? 'Entrata' : trigger === 'scroll' ? 'Scroll' : 'Hover'}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Grid */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Effetto
            </label>
            <div className="grid grid-cols-4 gap-1">
              {ANIMATION_EFFECTS.map((effect) => (
                <button
                  key={effect}
                  onClick={() => updateAnimation({ effect })}
                  className="px-2 py-2 rounded text-[11px] font-medium transition-colors text-center"
                  style={{
                    background: animation.effect === effect ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: animation.effect === effect ? 'white' : 'var(--c-text-1)',
                  }}
                  title={effect}
                >
                  {effect === 'fade-in'
                    ? 'Sfuma'
                    : effect === 'slide-up'
                      ? 'Su'
                      : effect === 'slide-down'
                        ? 'Giù'
                        : effect === 'slide-left'
                          ? 'Sinistra'
                          : effect === 'slide-right'
                            ? 'Destra'
                            : effect === 'zoom-in'
                              ? 'Zoom +'
                              : effect === 'zoom-out'
                                ? 'Zoom -'
                                : effect === 'rotate'
                                  ? 'Ruota'
                                  : effect === 'bounce'
                                    ? 'Rimbalzo'
                                    : effect === 'flip'
                                      ? 'Capovolgi'
                                      : 'Nessuno'}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Durata: {animation.duration}ms
            </label>
            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={animation.duration}
              onChange={(e) => updateAnimation({ duration: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Delay */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Ritardo: {animation.delay}ms
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={animation.delay}
              onChange={(e) => updateAnimation({ delay: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Easing */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Easing
            </label>
            <select
              value={animation.easing}
              onChange={(e) => updateAnimation({ easing: e.target.value })}
              className="w-full px-2 py-1 rounded text-xs"
              style={{
                background: 'var(--c-bg-2)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text-0)',
              }}
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Suggestions Row */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setAiModalOpen(true)}
              className="w-full px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--c-accent)', color: 'white' }}
            >
              <Sparkles size={16} />
              Suggerisci animazione
            </button>
          </div>

          <AIModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            defaultPrompt="Suggest a beautiful animation for this block type: {context}. Return a pure JSON object matching BlockAnimation type with trigger, effect, duration (100-3000), delay, easing."
            contextData={contextData}
            title="Suggerisci Animazione"
            onApply={(result) => {
              try {
                const parsed = JSON.parse(result) as BlockAnimation;
                updateAnimation(parsed);
              } catch {
                console.error('Invalid animation response:', result);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
