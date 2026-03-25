'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  '#000000', '#ffffff', '#1a1a2e', '#16213e', '#0f3460', '#e94560',
  '#e63946', '#457b9d', '#1d3557', '#f1faee', '#a8dadc', '#264653',
  '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#606c38', '#283618',
  '#fefae0', '#dda15e', '#bc6c25', '#6c757d', '#495057', '#343a40',
];

function toNativeColor(value: string) {
  const normalized = value.trim().toLowerCase();

  if (/^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(normalized)) {
    if (normalized.length === 4) {
      return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return normalized;
  }

  const rgba = normalized.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    const [, r, g, b] = rgba;
    return `#${[r, g, b]
      .map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  return '#000000';
}

export function ColorPicker({ value, onChange, label, presets = DEFAULT_PRESETS }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectPalette = useUiStore((s) => s.projectPalette);
  const nativePickerValue = toNativeColor(value || '#000000');
  const stopEventPropagation = (event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      data-editor-input="true"
      data-ai-ignore-field-context="true"
      className="flex flex-col gap-1"
      onMouseDown={stopEventPropagation}
      onPointerDown={stopEventPropagation}
      onClick={stopEventPropagation}
      onKeyDown={stopEventPropagation}
      onKeyUp={stopEventPropagation}
    >
      {label && (
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm',
            'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600',
            'hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors'
          )}
        >
          <div
            className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-600 shrink-0"
            style={{ backgroundColor: value || 'transparent' }}
          />
          <span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs">
            {value || 'Nessuno'}
          </span>
        </button>

        {showPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 w-72">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Spettro Colore
            </div>
            <input
              ref={inputRef}
              type="color"
              data-editor-input="true"
              data-ai-ignore-field-context="true"
              value={nativePickerValue}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-12 rounded cursor-pointer border-0 p-0"
            />
            <div className="mt-2 flex items-center gap-1">
              <input
                type="text"
                data-editor-input="true"
                data-ai-ignore-field-context="true"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Project palette colors first */}
            {projectPalette.length > 0 && (
              <>
                <div className="mt-2 text-[8px] font-semibold text-zinc-400 uppercase tracking-wider">Palette progetto</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {projectPalette.map((color) => (
                    <button
                      type="button"
                      key={`proj-${color}`}
                      onClick={() => { onChange(color); setShowPicker(false); }}
                      className={cn(
                        'w-7 h-7 rounded-md border-2 transition-transform hover:scale-110',
                        value === color ? 'border-blue-500 ring-1 ring-blue-300' : 'border-zinc-200 dark:border-zinc-600'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Default presets */}
            <div className="mt-2 text-[8px] font-semibold text-zinc-400 uppercase tracking-wider">Tutti i colori</div>
            <div className="mt-1 grid grid-cols-8 gap-1">
              {presets.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => { onChange(color); setShowPicker(false); }}
                  className={cn(
                    'w-6 h-6 rounded border border-zinc-300 dark:border-zinc-600 transition-transform hover:scale-110',
                    value === color && 'ring-2 ring-blue-500 ring-offset-1'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => { onChange('transparent'); setShowPicker(false); }}
              className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 py-1"
            >
              Trasparente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
