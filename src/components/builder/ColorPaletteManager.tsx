'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

interface PaletteSet {
  id: string;
  name: string;
  colors: string[];
}

const BUILTIN_PALETTES: PaletteSet[] = [
  { id: 'news-classic', name: 'News Classico', colors: ['#b71c1c', '#1a1a2e', '#ffffff', '#f5f5f5', '#333333', '#666666'] },
  { id: 'news-modern', name: 'News Moderno', colors: ['#0d47a1', '#1565c0', '#ffffff', '#f0f4f8', '#1e293b', '#64748b'] },
  { id: 'editorial-warm', name: 'Editoriale Caldo', colors: ['#c62828', '#ff8f00', '#fff3e0', '#3e2723', '#795548', '#d7ccc8'] },
  { id: 'editorial-cool', name: 'Editoriale Freddo', colors: ['#1565c0', '#0097a7', '#e0f2f1', '#263238', '#455a64', '#b0bec5'] },
  { id: 'magazine-luxury', name: 'Magazine Luxury', colors: ['#c9a96e', '#1a1a1a', '#ffffff', '#f5f0e8', '#2c2c2c', '#8b8b8b'] },
  { id: 'magazine-pop', name: 'Magazine Pop', colors: ['#e91e63', '#9c27b0', '#ffffff', '#fce4ec', '#1a1a2e', '#78909c'] },
  { id: 'tech-dark', name: 'Tech Dark', colors: ['#00e676', '#0d1117', '#161b22', '#c9d1d9', '#8b949e', '#238636'] },
  { id: 'tech-light', name: 'Tech Light', colors: ['#2196f3', '#ffffff', '#f6f8fa', '#24292f', '#57606a', '#0969da'] },
  { id: 'nature', name: 'Natura', colors: ['#2e7d32', '#1b5e20', '#e8f5e9', '#33691e', '#689f38', '#aed581'] },
  { id: 'sunset', name: 'Tramonto', colors: ['#ff6f00', '#e65100', '#fff8e1', '#bf360c', '#ff8f00', '#ffcc02'] },
  { id: 'ocean', name: 'Oceano', colors: ['#006064', '#00838f', '#e0f7fa', '#004d40', '#26a69a', '#80cbc4'] },
  { id: 'monochrome', name: 'Monocromatico', colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'] },
  { id: 'pastel', name: 'Pastello', colors: ['#ffcdd2', '#c8e6c9', '#bbdefb', '#fff9c4', '#f3e5f5', '#ffe0b2'] },
  { id: 'neon', name: 'Neon', colors: ['#00ff41', '#ff0080', '#00d4ff', '#ffff00', '#ff6600', '#0a0a0a'] },
  { id: 'retro', name: 'Retro', colors: ['#d32f2f', '#1976d2', '#fdd835', '#f5f5dc', '#4e342e', '#ff8a65'] },
];

export { BUILTIN_PALETTES };

interface ColorPaletteManagerProps {
  currentPalette: string[];
  onChange: (colors: string[]) => void;
}

export function ColorPaletteManager({ currentPalette, onChange }: ColorPaletteManagerProps) {
  const { currentTenant } = useAuthStore();
  const [newColor, setNewColor] = useState('#7c8aaa');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [applyMode, setApplyMode] = useState<'bg' | 'text' | 'border' | null>(null);

  const { selectedBlockId, updateBlockStyle, getSelectedBlock } = usePageStore();
  const selectedBlock = getSelectedBlock();

  const addColor = () => {
    if (!currentPalette.includes(newColor)) {
      onChange([...currentPalette, newColor]);
    }
  };

  const removeColor = (index: number) => {
    onChange(currentPalette.filter((_, i) => i !== index));
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // Apply a color directly to the selected block
  const applyColorToBlock = (color: string) => {
    if (!selectedBlockId || !selectedBlock) return;

    if (applyMode === 'bg') {
      updateBlockStyle(selectedBlockId, { background: { ...selectedBlock.style.background, type: 'color', value: color } });
    } else if (applyMode === 'text') {
      updateBlockStyle(selectedBlockId, { typography: { ...selectedBlock.style.typography, color } });
    } else if (applyMode === 'border') {
      updateBlockStyle(selectedBlockId, { border: { ...selectedBlock.style.border, color, width: selectedBlock.style.border.width || '2px', style: selectedBlock.style.border.style || 'solid' } });
    } else {
      // Default: apply as background
      updateBlockStyle(selectedBlockId, { background: { ...selectedBlock.style.background, type: 'color', value: color } });
    }
  };

  const applyPalette = (palette: PaletteSet) => {
    onChange([...palette.colors]);
  };

  const generateAiPalette = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id,
          taskType: 'color-palette',
          prompt: 'Genera una palette di 6 colori per un sito web editoriale professionale. Rispondi SOLO con un JSON array di stringhe hex, esempio: ["#ff0000","#00ff00","#0000ff","#ffffff","#000000","#cccccc"]',
        }),
      });
      const data = await response.json();
      if (data.content) {
        const match = data.content.match(/\[[\s\S]*?\]/);
        if (match) {
          const colors = JSON.parse(match[0]);
          if (Array.isArray(colors) && colors.every((c: unknown) => typeof c === 'string')) {
            onChange(colors);
          }
        }
      }
    } catch { /* error */ }
    setAiLoading(false);
  };

  const displayPalettes = showAll ? BUILTIN_PALETTES : BUILTIN_PALETTES.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Apply mode selector - where to apply palette colors */}
      {selectedBlock && (
        <div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            Applica colore a:
          </span>
          <div className="flex gap-1">
            {[
              { id: 'bg' as const, label: 'Sfondo', icon: '■' },
              { id: 'text' as const, label: 'Testo', icon: 'A' },
              { id: 'border' as const, label: 'Bordo', icon: '□' },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setApplyMode(applyMode === id ? null : id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                  applyMode === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {applyMode && (
            <p className="text-[9px] text-blue-500 mt-1">
              Clicca un colore per applicarlo come {applyMode === 'bg' ? 'sfondo' : applyMode === 'text' ? 'colore testo' : 'colore bordo'} al blocco selezionato
            </p>
          )}
        </div>
      )}

      {/* Current palette */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Palette Corrente</span>
          <button
            onClick={generateAiPalette}
            disabled={aiLoading}
            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
          >
            {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
            AI Genera
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentPalette.map((color, i) => (
            <div key={`${color}-${i}`} className="group relative">
              <button
                onClick={() => {
                  if (applyMode && selectedBlock) {
                    applyColorToBlock(color);
                  } else {
                    copyColor(color);
                  }
                }}
                className={cn(
                  'w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform shadow-sm',
                  applyMode ? 'border-blue-400 cursor-crosshair' : 'border-zinc-200 dark:border-zinc-700'
                )}
                style={{ backgroundColor: color }}
                title={applyMode ? `Applica ${color} come ${applyMode}` : `${color} (click per copiare)`}
              >
                {copiedColor === color && (
                  <Check size={14} className="mx-auto text-white drop-shadow" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={8} />
              </button>
              <span className="text-[7px] font-mono text-zinc-400 block text-center mt-0.5">{color}</span>
            </div>
          ))}
          {/* Add color */}
          <div className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-600"
            />
            <button onClick={addColor} className="w-8 h-4 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 text-[8px] text-zinc-500">
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Preset palettes */}
      <div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Palette Predefinite</span>
        <div className="grid grid-cols-2 gap-2">
          {displayPalettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => applyPalette(palette)}
              className="flex items-center gap-2 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left"
            >
              <div className="flex shrink-0">
                {palette.colors.slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full -ml-0.5 first:ml-0 border border-white dark:border-zinc-900"
                    style={{ backgroundColor: c, zIndex: 5 - i }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">{palette.name}</span>
            </button>
          ))}
        </div>
        {!showAll && (
          <button onClick={() => setShowAll(true)} className="w-full text-center text-[10px] text-blue-500 hover:text-blue-600 mt-2 py-1">
            Mostra tutte ({BUILTIN_PALETTES.length})
          </button>
        )}
      </div>
    </div>
  );
}
