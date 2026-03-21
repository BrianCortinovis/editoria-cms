'use client';

import {
  Save, Undo2, Redo2, Monitor, Tablet, Smartphone,
  Eye, Download, Sparkles, Sun, Moon, Grid3X3, SquareDashed,
  PanelLeft, PanelRight,
  // Block tools
  Type, Image, Columns3, Layers, Minus, Play, Music,
  Megaphone, Quote, Mail, BarChart3, Code, Table, MapPin,
  Menu, PanelBottom, FileCode, GalleryHorizontal, LayoutTemplate,
  Maximize2, ScanLine, Database
} from 'lucide-react';
import { LayoutPresets } from './LayoutPresets';
import { CmsPanel } from './CmsPanel';
import { AiModelSelector, type AiMode } from './AiModelSelector';
import { useUiStore } from '@/lib/stores/ui-store';
import { usePageStore } from '@/lib/stores/page-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { DeviceMode } from '@/lib/config/breakpoints';
import type { BlockType } from '@/lib/types';
import { createBlock } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import '@/lib/blocks/init';
import { useState } from 'react';

interface ToolbarProps {
  projectName: string;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  saving?: boolean;
}

// Quick-add block tools
const QUICK_BLOCKS: { type: BlockType; icon: typeof Type; label: string; shortLabel: string }[] = [
  { type: 'section', icon: Layers, label: 'Sezione', shortLabel: 'Sez' },
  { type: 'columns', icon: Columns3, label: 'Colonne', shortLabel: 'Col' },
  { type: 'hero', icon: Layers, label: 'Hero', shortLabel: 'Hero' },
  { type: 'text', icon: Type, label: 'Testo', shortLabel: 'Txt' },
  { type: 'image-gallery', icon: Image, label: 'Galleria', shortLabel: 'Img' },
  { type: 'video', icon: Play, label: 'Video', shortLabel: 'Vid' },
  { type: 'divider', icon: Minus, label: 'Divisore', shortLabel: 'Div' },
  { type: 'navigation', icon: Menu, label: 'Nav', shortLabel: 'Nav' },
  { type: 'footer', icon: PanelBottom, label: 'Footer', shortLabel: 'Ftr' },
  { type: 'banner-ad', icon: Megaphone, label: 'Banner ADV', shortLabel: 'ADV' },
  { type: 'quote', icon: Quote, label: 'Citazione', shortLabel: 'Cit' },
  { type: 'newsletter', icon: Mail, label: 'Newsletter', shortLabel: 'NL' },
  { type: 'counter', icon: BarChart3, label: 'Contatori', shortLabel: 'Cnt' },
  { type: 'slideshow', icon: GalleryHorizontal, label: 'Slideshow', shortLabel: 'Sld' },
  { type: 'code', icon: Code, label: 'Codice', shortLabel: 'Cod' },
  { type: 'table', icon: Table, label: 'Tabella', shortLabel: 'Tab' },
  { type: 'map', icon: MapPin, label: 'Mappa', shortLabel: 'Map' },
  { type: 'custom-html', icon: FileCode, label: 'HTML Custom', shortLabel: 'HTM' },
];

export function Toolbar({ projectName, onSave, onPreview, onExport, saving }: ToolbarProps) {
  const {
    theme, toggleTheme, deviceMode, setDeviceMode,
    showGrid, toggleGrid, gridSize, setGridSize, showOutlines, toggleOutlines,
    aiPanelOpen, setAiPanelOpen, zoom, setZoom, zoomIn, zoomOut, resetZoom,
    leftPanelOpen, setLeftPanelOpen, rightPanelOpen, setRightPanelOpen,
  } = useUiStore();

  const { undo, redo, canUndo, canRedo, addBlock } = usePageStore();
  const [showBlockTools, setShowBlockTools] = useState(false);
  const [showLayoutPresets, setShowLayoutPresets] = useState(false);
  const [showCms, setShowCms] = useState(false);
  const [aiModel, setAiModel] = useState<AiMode>('gemini');

  const addQuickBlock = (type: BlockType) => {
    const def = getBlockDefinition(type);
    if (def) {
      const block = createBlock(def.type, def.label, def.defaultProps, def.defaultStyle);
      block.id = generateId();
      addBlock(block);
    }
  };

  const devices: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="shrink-0 z-50">
      {/* Main toolbar */}
      <div className="h-12 flex items-center px-3 gap-1" style={{ background: "var(--c-bg-1)", borderBottom: "1px solid var(--c-border)" }}>

        {/* Panels toggle */}
        <Button
          variant="ghost" size="xs"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          title="Pannello blocchi"
          className={leftPanelOpen ? 'bg-accent-soft text-accent' : ''}
          style={leftPanelOpen ? { background: "var(--c-accent-soft)", color: "var(--c-accent)" } : {}}
        >
          <PanelLeft size={16} />
        </Button>
        <Button
          variant="ghost" size="xs"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          title="Pannello proprieta"
          className={cn(rightPanelOpen && 'bg-blue-50 dark:bg-blue-950 text-blue-600')}
        >
          <PanelRight size={16} />
        </Button>

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Save / Undo / Redo */}
        <Button variant="ghost" size="xs" onClick={onSave} disabled={saving} title="Salva (Ctrl+S)">
          <Save size={15} />
        </Button>
        <Button variant="ghost" size="xs" onClick={() => undo()} disabled={!canUndo()} title="Annulla (Ctrl+Z)">
          <Undo2 size={15} />
        </Button>
        <Button variant="ghost" size="xs" onClick={() => redo()} disabled={!canRedo()} title="Ripristina">
          <Redo2 size={15} />
        </Button>

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Device Modes */}
        {devices.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant="ghost"
            size="xs"
            onClick={() => setDeviceMode(mode)}
            title={label}
            className={cn(deviceMode === mode && 'bg-blue-50 dark:bg-blue-950 text-blue-600')}
          >
            <Icon size={15} />
          </Button>
        ))}

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Zoom & View Tools */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="xs" onClick={zoomOut} title="Zoom out (Ctrl+-)">
            <span className="text-xs font-mono">−</span>
          </Button>

          {/* Zoom dropdown with presets */}
          <div className="relative group">
            <button
              className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 min-w-[42px] text-center hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1.5 py-1 rounded"
              title="Zoom - click per preset"
            >
              {Math.round(zoom * 100)}%
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-[100] hidden group-hover:block w-28 py-1">
              {[25, 33, 50, 67, 75, 100, 125, 150, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setZoom(pct / 100)}
                  className={cn(
                    'w-full px-3 py-1 text-[10px] font-mono text-left hover:bg-blue-50 dark:hover:bg-blue-950',
                    Math.round(zoom * 100) === pct ? 'text-blue-600 font-bold' : 'text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  {pct}%
                </button>
              ))}
              <div className="border-t border-zinc-100 dark:border-zinc-700 my-1" />
              <button
                onClick={() => (window as unknown as Record<string, unknown>).__canvasFitWidth && ((window as unknown as Record<string, unknown>).__canvasFitWidth as () => void)()}
                className="w-full px-3 py-1 text-[10px] text-left text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                Adatta larghezza
              </button>
              <button
                onClick={() => (window as unknown as Record<string, unknown>).__canvasFitAll && ((window as unknown as Record<string, unknown>).__canvasFitAll as () => void)()}
                className="w-full px-3 py-1 text-[10px] text-left text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                Inquadra tutto
              </button>
            </div>
          </div>

          <Button variant="ghost" size="xs" onClick={zoomIn} title="Zoom in (Ctrl++)">
            <span className="text-xs font-mono">+</span>
          </Button>

          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

          {/* Fit Width */}
          <Button
            variant="ghost" size="xs"
            onClick={() => (window as unknown as Record<string, unknown>).__canvasFitWidth && ((window as unknown as Record<string, unknown>).__canvasFitWidth as () => void)()}
            title="Adatta alla larghezza"
          >
            <Maximize2 size={13} />
          </Button>

          {/* Fit All */}
          <Button
            variant="ghost" size="xs"
            onClick={() => (window as unknown as Record<string, unknown>).__canvasFitAll && ((window as unknown as Record<string, unknown>).__canvasFitAll as () => void)()}
            title="Inquadra tutto"
          >
            <ScanLine size={13} />
          </Button>

          {/* 100% */}
          <Button variant="ghost" size="xs" onClick={resetZoom} title="Zoom 100%">
            <span className="text-[9px] font-bold">1:1</span>
          </Button>
        </div>

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Grid & Outlines */}
        <Button
          variant="ghost" size="xs" onClick={toggleGrid} title="Griglia"
          className={cn(showGrid && 'bg-blue-50 dark:bg-blue-950 text-blue-600')}
        >
          <Grid3X3 size={15} />
        </Button>
        {showGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="h-7 text-[11px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1 text-zinc-700 dark:text-zinc-300"
            title="Dimensione griglia"
          >
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={5}>5px</option>
            <option value={10}>10px</option>
            <option value={20}>20px</option>
            <option value={50}>50px</option>
          </select>
        )}
        <Button
          variant="ghost" size="xs" onClick={toggleOutlines} title="Contorni"
          className={cn(showOutlines && 'bg-blue-50 dark:bg-blue-950 text-blue-600')}
        >
          <SquareDashed size={15} />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview / Export */}
        <Button variant="ghost" size="xs" onClick={onPreview} title="Anteprima">
          <Eye size={15} />
          <span className="hidden lg:inline text-xs">Preview</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={onExport} title="Esporta HTML">
          <Download size={15} />
          <span className="hidden lg:inline text-xs">Export</span>
        </Button>

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Layout Presets */}
        <Button variant="outline" size="xs" onClick={() => setShowLayoutPresets(true)} title="Layout & Template">
          <LayoutTemplate size={15} />
          <span className="hidden lg:inline text-xs">Layout</span>
        </Button>

        {/* CMS Connection */}
        <Button variant="outline" size="xs" onClick={() => setShowCms(true)} title="Connetti CMS Editoriale">
          <Database size={15} />
          <span className="hidden lg:inline text-xs">CMS</span>
        </Button>

        {/* AI Model Selector */}
        <AiModelSelector value={aiModel} onChange={setAiModel} />

        {/* AI Panel Toggle */}
        <Button
          variant={aiPanelOpen ? 'primary' : 'ghost'}
          size="xs"
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          title="Assistente AI"
        >
          <Sparkles size={15} />
          <span className="hidden lg:inline text-xs">AI</span>
        </Button>

        {/* Theme */}
        <Button variant="ghost" size="xs" onClick={toggleTheme} title="Tema">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </div>

      {/* Secondary toolbar - Quick add blocks */}
      <div className="h-9 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 gap-0.5 overflow-x-auto">
        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-2 shrink-0">
          Aggiungi:
        </span>
        {QUICK_BLOCKS.map(({ type, icon: Icon, label, shortLabel }) => (
          <button
            key={type}
            onClick={() => addQuickBlock(type)}
            title={`Aggiungi ${label}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 transition-colors shrink-0 whitespace-nowrap"
          >
            <Icon size={12} />
            <span className="hidden xl:inline">{shortLabel}</span>
          </button>
        ))}
      </div>
      {/* Layout Presets Modal */}
      <LayoutPresets open={showLayoutPresets} onClose={() => setShowLayoutPresets(false)} />

      {/* CMS Panel Modal */}
      <CmsPanel open={showCms} onClose={() => setShowCms(false)} />
    </div>
  );
}
