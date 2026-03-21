'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block, BlockAnimation, AnimationTrigger, AnimationEffect } from '@/lib/types';
import AIButton from '@/components/ai/AIButton';

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

  const updateAnimation = (updates: Partial<BlockAnimation>) => {
    // Use current animation from block prop, not stale closure value
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
        {open && (
          <AIButton
            blockId={block.id}
            fieldName="animation"
            contextData={contextData}
            actions={[
              {
                id: 'suggest-animation-elegant',
                label: 'Elegante',
                prompt: 'Suggest an elegant animation for this block: {context}. Return JSON with trigger, effect, duration (100-3000), delay, easing.',
              },
              {
                id: 'suggest-animation-energetic',
                label: 'Energetica',
                prompt: 'Suggest an energetic/fun animation for this block: {context}. Return JSON with trigger, effect, duration, delay, easing.',
              },
              {
                id: 'suggest-animation-subtle',
                label: 'Sottile',
                prompt: 'Suggest a subtle animation for this block: {context}. Return JSON with trigger, effect, duration (200-600), delay, easing.',
              },
            ]}
            onCommand={(cmd: any) => {
              if (cmd.action === 'updateAnimation') {
                const updates: Partial<BlockAnimation> = {};
                if (cmd.trigger) updates.trigger = cmd.trigger;
                if (cmd.effect) updates.effect = cmd.effect;
                if (cmd.duration) updates.duration = cmd.duration;
                if (cmd.delay !== undefined) updates.delay = cmd.delay;
                if (cmd.easing) updates.easing = cmd.easing;
                updateAnimation(updates);
              }
            }}
            compact
          />
        )}
      </div>

      {open && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Trigger Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold block" style={{ color: 'var(--c-text-1)' }}>
                Trigger
              </label>
              <AIButton
                blockId={block.id}
                fieldName="animation-trigger"
                contextData={JSON.stringify({ blockType: block.type })}
                actions={[
                  {
                    id: 'suggest-trigger',
                    label: 'Suggerisci',
                    prompt: 'Suggest the best animation trigger (entrance, scroll, or hover) for this block type. Return JSON with just "trigger" field.',
                  },
                ]}
                onCommand={(cmd: any) => {
                  if (cmd.trigger) updateAnimation({ trigger: cmd.trigger });
                }}
                compact
              />
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold block" style={{ color: 'var(--c-text-1)' }}>
                Effetto
              </label>
              <AIButton
                blockId={block.id}
                fieldName="animation-effect"
                contextData={JSON.stringify({ trigger: animation.trigger, blockType: block.type })}
                actions={[
                  {
                    id: 'suggest-effect',
                    label: 'Suggerisci',
                    prompt: 'Suggest the best animation effect for this {trigger} trigger and block type: {context}. Return JSON with "effect" field from: fade-in, slide-up, slide-down, slide-left, slide-right, zoom-in, zoom-out, rotate, bounce, flip.',
                  },
                ]}
                onCommand={(cmd: any) => {
                  if (cmd.effect) updateAnimation({ effect: cmd.effect });
                }}
                compact
              />
            </div>
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
                                : effect === 'none'
                                  ? 'Nessuno'
                                  : effect}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
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

          {/* Delay Slider */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Ritardo: {animation.delay}ms
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="100"
              value={animation.delay}
              onChange={(e) => updateAnimation({ delay: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Easing Selector */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
              Easing
            </label>
            <div className="space-y-1">
              {EASING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateAnimation({ easing: option.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium text-left rounded transition-colors"
                  style={{
                    background: animation.easing === option.value ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: animation.easing === option.value ? 'white' : 'var(--c-text-1)',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Threshold (per scroll trigger) */}
          {animation.trigger === 'scroll' && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                Soglia di scroll: 50%
              </label>
              <input type="range" min="0" max="100" value={50} disabled className="w-full opacity-50" />
              <small style={{ color: 'var(--c-text-2)' }}>Scatta quando il blocco è al 50% visibile</small>
            </div>
          )}

          {/* AI Button */}
          <AIButton
            blockId={block.id}
            fieldName="animation"
            fieldValue={contextData}
            onResult={(result) => {
              try {
                const parsed = JSON.parse(result) as BlockAnimation;
                updateAnimation(parsed);
              } catch {
                console.error('Invalid animation response:', result);
              }
            }}
            actions={[
              {
                id: 'suggest-animation',
                label: 'Animazione elegante',
                prompt:
                  'Suggest an elegant animation for this block type: {context}. Return a pure JSON object matching BlockAnimation type with smooth easing.',
              },
              {
                id: 'suggest-animation',
                label: 'Animazione energetica',
                prompt:
                  'Suggest an energetic, lively animation for this block type: {context}. Return a pure JSON object matching BlockAnimation type with bounce or spring easing.',
              },
              {
                id: 'suggest-animation',
                label: 'Animazione sottile',
                prompt:
                  'Suggest a subtle, minimal animation for this block type: {context}. Return a pure JSON object matching BlockAnimation type with short duration and fade effect.',
              },
            ]}
            compact
          />
        </div>
      )}
    </div>
  );
}
