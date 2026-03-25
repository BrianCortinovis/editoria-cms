'use client';

import {
  Save, Undo2, Redo2, Monitor, Tablet, Smartphone,
  Eye, Download, Sparkles, Grid3X3, SquareDashed,
  PanelLeft, PanelRight, Trash,
  // Block tools
  Type, Image, Columns3, Layers, Minus, Play,
  Megaphone, Quote, Mail, BarChart3, Code, Table, MapPin,
  Menu, PanelBottom, FileCode, GalleryHorizontal, LayoutTemplate,
  FormInput,
  Maximize2, ScanLine, Search, Magnet
} from 'lucide-react';
import { LayoutPresets } from './LayoutPresets';
import { AdminMenu } from './AdminMenu';
import { useUiStore } from '@/lib/stores/ui-store';
import { usePageStore } from '@/lib/stores/page-store';
import { Button } from '@/components/ui/button';
import type { DeviceMode } from '@/lib/config/breakpoints';
import type { BlockType } from '@/lib/types';
import { createBlock } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import '@/lib/blocks/init';
import { useState } from 'react';

interface ToolbarProps {
  projectId: string;
  onSave: () => void;
  onClearPage?: () => void;
  onOpenAiBuild?: () => void;
  onPreview: () => void;
  onExport: () => void;
  onSeoOptimize?: () => void;
  saving?: boolean;
  seoOptimizing?: boolean;
  saveState?: 'idle' | 'saved' | 'error';
  saveMessage?: string | null;
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
  { type: 'cms-form', icon: FormInput, label: 'Form CMS', shortLabel: 'Form' },
  { type: 'counter', icon: BarChart3, label: 'Contatori', shortLabel: 'Cnt' },
  { type: 'slideshow', icon: GalleryHorizontal, label: 'Slideshow', shortLabel: 'Sld' },
  { type: 'code', icon: Code, label: 'Codice', shortLabel: 'Cod' },
  { type: 'table', icon: Table, label: 'Tabella', shortLabel: 'Tab' },
  { type: 'map', icon: MapPin, label: 'Mappa', shortLabel: 'Map' },
  { type: 'custom-html', icon: FileCode, label: 'HTML Custom', shortLabel: 'HTM' },
];

export function Toolbar({
  projectId,
  onSave,
  onPreview,
  onExport,
  onSeoOptimize,
  saving,
  seoOptimizing,
  saveState = 'idle',
  saveMessage,
}: ToolbarProps) {
  const {
    deviceMode, setDeviceMode,
    showGrid, toggleGrid, gridSize, setGridSize, showOutlines, toggleOutlines,
    zoom, setZoom, zoomIn, zoomOut, resetZoom,
    leftPanelOpen, setLeftPanelOpen, rightPanelOpen, setRightPanelOpen,
    snapEnabled, toggleSnapEnabled, snapToDocumentEdges, toggleSnapToDocumentEdges,
  } = useUiStore();

  // CSS variable for active button state
  const activeButtonStyle = { background: "var(--c-accent-soft)", color: "var(--c-accent)" };

  const { undo, redo, canUndo, canRedo, addBlock, replacePage } = usePageStore();
  const [showLayoutPresets, setShowLayoutPresets] = useState(false);

  const addQuickBlock = (type: BlockType) => {
    const def = getBlockDefinition(type);
    if (def) {
      const block = createBlock(def.type, def.label, def.defaultProps, def.defaultStyle);
      block.id = generateId();
      if (def.defaultDataSource) {
        block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
      }
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
      <div className="h-12 flex items-center px-3 gap-1 overflow-x-auto" style={{ background: "var(--c-bg-1)", borderBottom: "1px solid var(--c-border)" }}>

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
          style={rightPanelOpen ? activeButtonStyle : {}}
        >
          <PanelRight size={16} />
        </Button>

        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />

        {/* Save / Undo / Redo */}
        <Button variant="ghost" size="xs" onClick={onSave} disabled={saving} title="Salva (Ctrl+S)">
          <Save size={15} />
          <span className="hidden lg:inline text-xs">{saving ? 'Salvataggio…' : 'Salva'}</span>
        </Button>
        {saveMessage && !saving && (
          <span
            className="hidden lg:inline text-[11px] font-medium px-2 py-1 rounded-md"
            style={{
              background: saveState === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: saveState === 'error' ? '#dc2626' : '#059669',
            }}
          >
            {saveMessage}
          </span>
        )}
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
            style={deviceMode === mode ? activeButtonStyle : {}}
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
              style={{ color: "var(--c-text-2)" }}
              className="text-[10px] font-mono min-w-[42px] text-center hover:text-accent px-1.5 py-1 rounded"
              title="Zoom - click per preset"
            >
              {Math.round(zoom * 100)}%
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-lg shadow-xl z-[100] hidden group-hover:block w-28 py-1" style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)", border: "1px solid var(--c-border)" }}>
              {[25, 33, 50, 67, 75, 100, 125, 150, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setZoom(pct / 100)}
                  style={{
                    color: Math.round(zoom * 100) === pct ? "var(--c-accent)" : "var(--c-text-1)",
                    fontWeight: Math.round(zoom * 100) === pct ? "bold" : "normal"
                  }}
                  className="w-full px-3 py-1 text-[10px] font-mono text-left hover:text-accent"
                >
                  {pct}%
                </button>
              ))}
              <div className="border-t my-1" style={{ borderColor: "var(--c-border)" }} />
              <button
                onClick={() => (window as unknown as Record<string, unknown>).__canvasFitWidth && ((window as unknown as Record<string, unknown>).__canvasFitWidth as () => void)()}
                style={{ color: "var(--c-text-1)" }}
                className="w-full px-3 py-1 text-[10px] text-left hover:text-accent"
              >
                Adatta larghezza
              </button>
              <button
                onClick={() => (window as unknown as Record<string, unknown>).__canvasFitAll && ((window as unknown as Record<string, unknown>).__canvasFitAll as () => void)()}
                style={{ color: "var(--c-text-1)" }}
                className="w-full px-3 py-1 text-[10px] text-left hover:text-accent"
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
          style={showGrid ? activeButtonStyle : {}}
        >
          <Grid3X3 size={15} />
        </Button>
        {showGrid && (
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ background: "var(--c-bg-2)", color: "var(--c-text-0)", borderColor: "var(--c-border)" }}
            className="h-7 text-[11px] border rounded px-1"
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
          style={showOutlines ? activeButtonStyle : {}}
        >
          <SquareDashed size={15} />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={toggleSnapEnabled}
          title={snapEnabled ? 'Magneti attivi' : 'Magneti disattivati'}
          style={snapEnabled ? activeButtonStyle : {}}
        >
          <Magnet size={15} />
          <span className="hidden lg:inline text-xs">Magneti</span>
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={toggleSnapToDocumentEdges}
          title={snapToDocumentEdges ? 'Aggancio bordi documento attivo' : 'Aggancio bordi documento disattivato'}
          style={snapToDocumentEdges ? activeButtonStyle : {}}
        >
          <span className="text-[9px] font-bold">Bordi</span>
        </Button>

        <div className="w-px h-6 shrink-0" style={{ background: "var(--c-border)" }} />

        {/* Layout Presets */}
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowLayoutPresets(true)}
          title="Layout & Template"
          className="shrink-0"
        >
          <LayoutTemplate size={15} />
          <span className="hidden lg:inline text-xs">Layout</span>
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
        <Button
          variant="ghost"
          size="xs"
          onClick={onSeoOptimize}
          disabled={!onSeoOptimize || seoOptimizing}
          title="Analizza e ottimizza SEO pagina"
        >
          <Search size={15} />
          <span className="hidden lg:inline text-xs">{seoOptimizing ? 'SEO…' : 'SEO AI'}</span>
        </Button>
        {/* Clear Page */}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            if (confirm('Svuotare la pagina? Questa azione non può essere annullata.')) {
              replacePage([], {});
            }
          }}
          title="Svuota pagina"
        >
          <Trash size={15} />
          <span className="hidden lg:inline text-xs">Svuota</span>
        </Button>

        {/* AI Panel Toggle */}
        <Button
          variant='ghost'
          size="xs"
          onClick={openGlobalAiChat}
          title="Assistente AI"
        >
          <Sparkles size={15} />
          <span className="hidden lg:inline text-xs">AI</span>
        </Button>

        {/* Admin Menu */}
        <AdminMenu projectId={projectId} />

      </div>

      {/* Secondary toolbar - Quick add blocks */}
      <div className="h-9 border-b flex items-center px-3 gap-0.5 overflow-x-auto" style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}>
        <span className="text-[10px] font-semibold uppercase tracking-wider mr-2 shrink-0" style={{ color: "var(--c-text-2)" }}>
          Aggiungi:
        </span>
        {QUICK_BLOCKS.map(({ type, icon: Icon, label, shortLabel }) => (
          <button
            key={type}
            onClick={() => addQuickBlock(type)}
            title={`Aggiungi ${label}`}
            style={{ color: "var(--c-text-1)" }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium hover:text-accent transition-colors shrink-0 whitespace-nowrap"
          >
            <Icon size={12} />
            <span className="hidden xl:inline">{shortLabel}</span>
          </button>
        ))}
      </div>
      {/* Layout Presets Modal */}
      <LayoutPresets open={showLayoutPresets} onClose={() => setShowLayoutPresets(false)} />
    </div>
  );
}
  const openGlobalAiChat = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('editoria:open-global-ai-chat'));
    }
  };
