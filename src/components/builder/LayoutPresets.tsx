'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Plus, Minus, Sparkles, Send, Grid3X3, LayoutGrid,
  Check, X, Loader2, RotateCcw, Shuffle, Copy, MoveHorizontal, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { createBlock, type Block, type BlockType, type BlockStyle } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import '@/lib/blocks/init';

import { LAYOUT_PRESETS as CONFIG_PRESETS, type LayoutPresetDef } from '@/lib/config/layout-presets';

// Extended preset with blocks (for the 6 featured ones)
interface PresetBlock {
  type: BlockType;
  label: string;
  props?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styleOverrides?: Record<string, any>;
  children?: PresetBlock[];
}

export interface FeaturedPreset extends LayoutPresetDef {
  columns?: number;
  blocks: PresetBlock[];
}

interface AiLayoutAction {
  action: string;
  blockType?: string;
  label?: string;
  props?: Record<string, unknown>;
  style?: Partial<BlockStyle>;
  children?: AiLayoutAction[];
}

type AiStyleInput = Partial<BlockStyle> & {
  backgroundColor?: string;
  color?: string;
  height?: string;
  minHeight?: string;
  maxWidth?: string;
};

export const LAYOUT_PRESETS: FeaturedPreset[] = [
  {
    id: 'editorial-classic',
    name: 'Editoriale Classico',
    description: 'Layout classico con hero, contenuto principale e sidebar',
    category: 'editorial',
    columns: 2,
    rows: [[8, '100%'], [45, '100%'], [6, '100%'], [30, '68%', '28%'], [15, '100%'], [10, '100%']],
    blocks: [
      { type: 'navigation', label: 'Navigazione' },
      { type: 'hero', label: 'Notizia Principale', props: { title: 'Breaking News: Titolo Principale', subtitle: 'Il sottotitolo della notizia in evidenza', ctaText: 'Leggi tutto', overlayOpacity: 0.6, overlayColor: '#000000' }, styleOverrides: { background: { type: 'color', value: '#1a1a2e' } } },
      { type: 'divider', label: 'Divisore', props: { shape: 'wave', height: 60, color: '#ffffff' } },
      { type: 'banner-ad', label: 'Pubblicità', props: { format: 'leaderboard', width: 728, height: 90 } },
      { type: 'related-content', label: 'Ultime Notizie', props: { title: 'Ultime Notizie', columns: 3, items: [
        { id: '1', title: 'Politica: nuove riforme in arrivo', excerpt: 'Il governo annuncia...', image: '', url: '#', date: '2026-03-18' },
        { id: '2', title: 'Economia: mercati in crescita', excerpt: 'Le borse europee...', image: '', url: '#', date: '2026-03-18' },
        { id: '3', title: 'Sport: campionato in fermento', excerpt: 'La giornata di Serie A...', image: '', url: '#', date: '2026-03-18' },
      ]}},
      { type: 'newsletter', label: 'Newsletter', props: { title: 'Resta aggiornato', description: 'Iscriviti alla newsletter per ricevere le ultime notizie', buttonText: 'Iscriviti' } },
      { type: 'footer', label: 'Footer' },
    ]
  },
  {
    id: 'tg-homepage',
    name: 'TG Homepage',
    description: 'Layout stile telegiornale con breaking news, ticker e categorie',
    category: 'news',
    columns: 3,
    rows: [[8, '100%'], [5, '100%'], [45, '100%'], [6, '100%'], [25, '32%', '32%', '32%'], [8, '100%'], [25, '48%', '48%'], [15, '100%'], [10, '100%']],
    blocks: [
      { type: 'navigation', label: 'TG Nav', props: { logo: { type: 'text', value: 'TG NEWS 24' }, items: [
        { id: '1', label: 'Home', url: '/', children: [] },
        { id: '2', label: 'Politica', url: '/politica', children: [] },
        { id: '3', label: 'Cronaca', url: '/cronaca', children: [] },
        { id: '4', label: 'Economia', url: '/economia', children: [] },
        { id: '5', label: 'Mondo', url: '/mondo', children: [] },
        { id: '6', label: 'Sport', url: '/sport', children: [] },
        { id: '7', label: 'Cultura', url: '/cultura', children: [] },
      ], sticky: true }, styleOverrides: { background: { type: 'color', value: '#b71c1c' }, typography: { color: '#ffffff' } } },
      { type: 'hero', label: 'ULTIM\'ORA', props: { title: 'ULTIM\'ORA: Titolo della breaking news', subtitle: 'Aggiornamento in tempo reale dalla redazione', ctaText: 'Segui la diretta', overlayOpacity: 0.7, overlayColor: '#000000' }, styleOverrides: { layout: { minHeight: '500px' }, background: { type: 'color', value: '#0d1117' } } },
      { type: 'divider', label: 'Separatore', props: { shape: 'diagonal', height: 50, color: '#ffffff' } },
      { type: 'related-content', label: 'Prime Pagine', props: { title: 'Le notizie del giorno', columns: 3, items: [
        { id: '1', title: 'Governo: vertice a Palazzo Chigi', excerpt: 'Il Presidente del Consiglio convoca...', image: '', url: '#', date: '2026-03-18' },
        { id: '2', title: 'Esteri: summit NATO a Washington', excerpt: 'I leader dell\'alleanza discutono...', image: '', url: '#', date: '2026-03-18' },
        { id: '3', title: 'Cronaca: emergenza maltempo al Nord', excerpt: 'Allerta arancione in Lombardia...', image: '', url: '#', date: '2026-03-18' },
      ]}},
      { type: 'banner-ad', label: 'Pubblicità', props: { format: 'billboard', width: 970, height: 250 } },
      { type: 'slideshow', label: 'Gallery TG', props: { slides: [
        { id: '1', image: '', title: 'Il vertice europeo', description: 'Le immagini dal summit', link: '#' },
        { id: '2', image: '', title: 'Sport del weekend', description: 'I momenti salienti', link: '#' },
        { id: '3', image: '', title: 'Meteo della settimana', description: 'Le previsioni', link: '#' },
      ]}},
      { type: 'counter', label: 'Statistiche TG', props: { counters: [
        { id: '1', value: 24, label: 'Ore di diretta', prefix: '', suffix: 'h' },
        { id: '2', value: 150, label: 'Notizie al giorno', prefix: '+', suffix: '' },
        { id: '3', value: 12, label: 'Inviati nel mondo', prefix: '', suffix: '' },
        { id: '4', value: 3, label: 'Milioni di spettatori', prefix: '', suffix: 'M' },
      ]}, styleOverrides: { background: { type: 'color', value: '#b71c1c' }, typography: { color: '#ffffff' } } },
      { type: 'newsletter', label: 'TG Newsletter', props: { title: 'TG Newsletter', description: 'Ricevi il riepilogo delle notizie ogni sera alle 20:00', buttonText: 'Iscriviti gratis' } },
      { type: 'footer', label: 'Footer TG', props: { copyright: '© 2026 TG News 24. Testata giornalistica registrata.', socialLinks: [{ platform: 'facebook', url: '#' }, { platform: 'twitter', url: '#' }, { platform: 'instagram', url: '#' }, { platform: 'youtube', url: '#' }] } },
    ]
  },
  {
    id: 'magazine-cover',
    name: 'Magazine Cover',
    description: 'Layout rivista con copertina full-screen e articoli in griglia',
    category: 'magazine',
    columns: 4,
    rows: [[8, '100%'], [55, '100%'], [25, '24%', '24%', '24%', '24%'], [20, '100%'], [25, '48%', '48%'], [10, '100%']],
    blocks: [
      { type: 'navigation', label: 'Magazine Nav', props: { logo: { type: 'text', value: 'THE MAGAZINE' } }, styleOverrides: { background: { type: 'color', value: '#000000' }, typography: { color: '#ffffff' } } },
      { type: 'hero', label: 'Cover Story', props: { title: 'La storia di copertina del mese', subtitle: 'Un\'inchiesta esclusiva che cambierà la vostra prospettiva', ctaText: 'Leggi ora', overlayOpacity: 0.5 }, styleOverrides: { layout: { minHeight: '700px' }, background: { type: 'color', value: '#111827' } } },
      { type: 'related-content', label: 'Articoli in evidenza', props: { title: 'In questo numero', columns: 4 } },
      { type: 'quote', label: 'Citazione', props: { text: 'Il giornalismo è il primo abbozzo della storia.', author: 'Philip Graham', source: 'Washington Post' } },
      { type: 'image-gallery', label: 'Fotoreportage', props: { columns: 4, layout: 'grid' } },
      { type: 'footer', label: 'Footer Magazine' },
    ]
  },
  {
    id: 'blog-minimal',
    name: 'Blog Minimal',
    description: 'Layout blog pulito e minimale con focus sul contenuto',
    category: 'blog',
    columns: 1,
    rows: [[8, '100%'], [35, '100%'], [50, '100%'], [15, '100%'], [20, '100%'], [15, '100%'], [10, '100%']],
    blocks: [
      { type: 'navigation', label: 'Blog Nav', props: { logo: { type: 'text', value: 'IL MIO BLOG' } } },
      { type: 'hero', label: 'Post in evidenza', props: { title: 'Il titolo del post in evidenza', subtitle: 'Una breve anteprima del contenuto', ctaText: 'Continua a leggere' }, styleOverrides: { layout: { minHeight: '400px' } } },
      { type: 'text', label: 'Articolo', props: { content: '<h2>Titolo dell\'articolo</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>', dropCap: true } },
      { type: 'author-bio', label: 'Bio Autore' },
      { type: 'related-content', label: 'Post correlati', props: { title: 'Potrebbe interessarti', columns: 3 } },
      { type: 'newsletter', label: 'Newsletter' },
      { type: 'footer', label: 'Footer Blog' },
    ]
  },
  {
    id: 'landing-product',
    name: 'Landing Page',
    description: 'Landing page con hero, features, testimonial e CTA',
    category: 'landing',
    columns: 3,
    rows: [[8, '100%'], [50, '100%'], [25, '32%', '32%', '32%'], [20, '100%'], [30, '100%'], [20, '100%'], [10, '100%']],
    blocks: [
      { type: 'navigation', label: 'Landing Nav' },
      { type: 'hero', label: 'Hero Landing', props: { title: 'Il prodotto che ti cambierà la vita', subtitle: 'Scopri come la nostra soluzione può risolvere i tuoi problemi', ctaText: 'Inizia gratis' }, styleOverrides: { layout: { minHeight: '600px' }, background: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } } },
      { type: 'counter', label: 'Numeri', props: { counters: [
        { id: '1', value: 10000, label: 'Utenti attivi', prefix: '+', suffix: '' },
        { id: '2', value: 99, label: 'Soddisfazione', prefix: '', suffix: '%' },
        { id: '3', value: 24, label: 'Supporto', prefix: '', suffix: '/7' },
      ]}},
      { type: 'quote', label: 'Testimonial', props: { text: 'Questo prodotto ha rivoluzionato il nostro workflow. Non possiamo più farne a meno.', author: 'Marco Rossi', source: 'CEO, TechStartup' } },
      { type: 'accordion', label: 'FAQ', props: { items: [
        { id: '1', title: 'Come funziona?', content: 'Il nostro prodotto è semplice da usare...', open: false },
        { id: '2', title: 'Quanto costa?', content: 'Offriamo piani a partire da...', open: false },
        { id: '3', title: 'C\'è una prova gratuita?', content: 'Sì, offriamo 14 giorni gratuiti...', open: false },
      ]}},
      { type: 'newsletter', label: 'CTA Finale', props: { title: 'Pronto a iniziare?', description: 'Registrati ora e ottieni 30 giorni gratis', buttonText: 'Registrati gratis' }, styleOverrides: { background: { type: 'color', value: '#1a1a2e' }, typography: { color: '#ffffff' } } },
      { type: 'footer', label: 'Footer' },
    ]
  },
  {
    id: 'portfolio-creative',
    name: 'Portfolio Creativo',
    description: 'Portfolio con galleria full-width e layout asimmetrico',
    category: 'portfolio',
    columns: 2,
    rows: [[6, '100%'], [55, '100%'], [30, '32%', '32%', '32%'], [30, '100%'], [10, '100%'], [8, '100%']],
    blocks: [
      { type: 'navigation', label: 'Portfolio Nav', props: { logo: { type: 'text', value: 'STUDIO' } }, styleOverrides: { background: { type: 'color', value: 'transparent' } } },
      { type: 'hero', label: 'Hero Portfolio', props: { title: 'Design. Create. Inspire.', subtitle: 'Studio creativo di design e comunicazione visiva', ctaText: 'Vedi i lavori' }, styleOverrides: { layout: { minHeight: '700px' }, background: { type: 'color', value: '#000000' }, typography: { color: '#ffffff' } } },
      { type: 'image-gallery', label: 'Portfolio Works', props: { columns: 3, hoverEffect: 'zoom' } },
      { type: 'timeline', label: 'Il nostro percorso', props: { events: [
        { id: '1', date: '2020', title: 'Fondazione', description: 'Nasce lo studio' },
        { id: '2', date: '2022', title: 'Primo premio', description: 'Vince il design award' },
        { id: '3', date: '2026', title: 'Espansione', description: 'Apertura sede internazionale' },
      ]}},
      { type: 'social', label: 'Social Links' },
      { type: 'footer', label: 'Footer Portfolio' },
    ]
  },
];

// ============================
// CUSTOM GRID BUILDER
// ============================

interface GridCell {
  id: string;
  colSpan: number;
  rowSpan: number;
  label: string;
  color: string;
  blockType: BlockType | null;
  shape: 'rect' | 'diagonal-left' | 'diagonal-right' | 'slant-top' | 'slant-bottom';
  align: 'start' | 'center' | 'end';
  minHeight: number | null;
  padding: number;
  offsetX: number;
  offsetY: number;
  zIndex: number;
  customCss: string;
}

interface GridRow {
  id: string;
  cells: GridCell[];
  height: string;
}

const BLOCK_TYPE_OPTIONS: Array<{ value: BlockType | ''; label: string }> = [
  { value: '', label: 'Sezione vuota' },
  { value: 'hero', label: 'Hero' },
  { value: 'text', label: 'Testo' },
  { value: 'image-gallery', label: 'Galleria' },
  { value: 'video', label: 'Video' },
  { value: 'slideshow', label: 'Slideshow' },
  { value: 'banner-ad', label: 'Banner ADV' },
  { value: 'navigation', label: 'Navigazione' },
  { value: 'footer', label: 'Footer' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'quote', label: 'Citazione' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'counter', label: 'Contatori' },
  { value: 'related-content', label: 'Contenuti correlati' },
  { value: 'accordion', label: 'Accordion' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'social', label: 'Social' },
  { value: 'author-bio', label: 'Bio autore' },
  { value: 'article-grid', label: 'Griglia articoli' },
  { value: 'article-hero', label: 'Hero articoli' },
  { value: 'search-bar', label: 'Ricerca' },
  { value: 'breaking-ticker', label: 'Ticker breaking' },
  { value: 'banner-zone', label: 'Zona banner' },
];

const ROW_RATIO_PRESETS = [
  { id: '1', label: '100', weights: [100] },
  { id: '2', label: '68 / 32', weights: [68, 32] },
  { id: '2b', label: '32 / 68', weights: [32, 68] },
  { id: '3', label: '24 / 52 / 24', weights: [24, 52, 24] },
  { id: '3b', label: '32 / 32 / 32', weights: [32, 32, 32] },
  { id: '4', label: '25 / 25 / 25 / 25', weights: [25, 25, 25, 25] },
];

const CELL_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#a3e635',
];

// ============================
// MAIN COMPONENT
// ============================

interface LayoutPresetsProps {
  open: boolean;
  onClose: () => void;
  onApplyBlocks?: (
    blocks: Block[],
    options?: { generatedTemplate?: { source: 'ai'; name: string } }
  ) => Promise<void> | void;
}

export function LayoutPresets({ open, onClose, onApplyBlocks }: LayoutPresetsProps) {
  const { currentTenant } = useAuthStore();
  const { setBlocks, selectBlock } = usePageStore();
  const [tab, setTab] = useState<'presets' | 'custom' | 'ai'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom grid state
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(4);
  const [gridGap, setGridGap] = useState(16);
  const [customGrid, setCustomGrid] = useState<GridRow[]>([]);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guidesEnabled, setGuidesEnabled] = useState(true);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{
    type: 'row-height' | 'cell-width' | null;
    rowId: string;
    cellIndex?: number;
    side?: 'left' | 'right';
    startX?: number;
    startY?: number;
    startHeight?: number;
    startSpans?: number[];
    containerWidth?: number;
  } | null>(null);

  const makeCell = (rowIndex: number, cellIndex: number, colSpan = 1): GridCell => ({
    id: `${rowIndex}-${cellIndex}-${generateId()}`,
    colSpan,
    rowSpan: 1,
    label: '',
    color: CELL_COLORS[(rowIndex * 6 + cellIndex) % CELL_COLORS.length],
    blockType: null,
    shape: 'rect',
    align: 'start',
    minHeight: null,
    padding: 16,
    offsetX: 0,
    offsetY: 0,
    zIndex: 1,
    customCss: '',
  });

  const updateGridRow = (rowId: string, updater: (row: GridRow) => GridRow) => {
    setCustomGrid((current) => current.map((row) => (row.id === rowId ? updater(row) : row)));
  };

  const updateGridCell = (cellId: string, updater: (cell: GridCell) => GridCell) => {
    setCustomGrid((current) =>
      current.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => (cell.id === cellId ? updater(cell) : cell)),
      }))
    );
  };

  const duplicateSelectedCell = () => {
    if (!selectedRowId || !selectedCell) return;
    const rowIndex = customGrid.findIndex((row) => row.id === selectedRowId);
    updateGridRow(selectedRowId, (row) => {
      const index = row.cells.findIndex((cell) => cell.id === selectedCell);
      if (index === -1) return row;
      const source = row.cells[index];
      const duplicated: GridCell = {
        ...source,
        id: `${rowIndex}-${index + 1}-${generateId()}`,
        label: source.label ? `${source.label} copia` : 'Blocco copia',
      };
      const cells = [...row.cells];
      cells.splice(index + 1, 0, duplicated);
      setSelectedCell(duplicated.id);
      return { ...row, cells };
    });
  };

  const moveSelectedCell = (direction: 'left' | 'right') => {
    if (!selectedRowId || !selectedCell) return;
    updateGridRow(selectedRowId, (row) => {
      const index = row.cells.findIndex((cell) => cell.id === selectedCell);
      if (index === -1) return row;
      const nextIndex = direction === 'left' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= row.cells.length) return row;
      const cells = [...row.cells];
      const [current] = cells.splice(index, 1);
      cells.splice(nextIndex, 0, current);
      return { ...row, cells };
    });
  };

  const startRowResize = (event: React.MouseEvent, rowId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const row = customGrid.find((entry) => entry.id === rowId);
    dragRef.current = {
      type: 'row-height',
      rowId,
      startY: event.clientY,
      startHeight: Number(row?.height) || 220,
    };
  };

  const startCellResize = (event: React.MouseEvent, rowId: string, cellIndex: number, side: 'left' | 'right') => {
    event.preventDefault();
    event.stopPropagation();
    const row = customGrid.find((entry) => entry.id === rowId);
    const containerWidth = rowRefs.current[rowId]?.clientWidth || 1;
    dragRef.current = {
      type: 'cell-width',
      rowId,
      cellIndex,
      side,
      startX: event.clientX,
      startSpans: row?.cells.map((cell) => Math.max(cell.colSpan, 1)) || [],
      containerWidth,
    };
  };

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.type === 'row-height') {
        const nextHeight = (drag.startHeight || 220) + (event.clientY - (drag.startY || 0));
        const step = snapEnabled ? 10 : 2;
        const snappedHeight = Math.max(80, Math.round(nextHeight / step) * step);
        updateGridRow(drag.rowId, (row) => ({ ...row, height: String(snappedHeight) }));
        return;
      }

      if (drag.type === 'cell-width') {
        const row = customGrid.find((entry) => entry.id === drag.rowId);
        if (!row || typeof drag.cellIndex !== 'number' || !drag.startSpans?.length) return;

        const currentIndex = drag.cellIndex;
        const pairIndex = drag.side === 'right' ? currentIndex + 1 : currentIndex - 1;
        if (pairIndex < 0 || pairIndex >= row.cells.length) return;

        const total = drag.startSpans.reduce((sum, value) => sum + value, 0);
        const deltaPx = event.clientX - (drag.startX || 0);
        const rawDelta = (deltaPx / Math.max(drag.containerWidth || 1, 1)) * total;
        const step = snapEnabled ? 0.5 : 0.1;
        const snappedDelta = Math.round(rawDelta / step) * step;

        const nextSpans = [...drag.startSpans];
        const leftIndex = drag.side === 'right' ? currentIndex : pairIndex;
        const rightIndex = drag.side === 'right' ? pairIndex : currentIndex;
        const proposedLeft = Math.max(1, nextSpans[leftIndex] + snappedDelta);
        const maxLeft = nextSpans[leftIndex] + nextSpans[rightIndex] - 1;
        const boundedLeft = Math.min(proposedLeft, maxLeft);
        nextSpans[leftIndex] = Number(boundedLeft.toFixed(2));
        nextSpans[rightIndex] = Number((drag.startSpans[leftIndex] + drag.startSpans[rightIndex] - boundedLeft).toFixed(2));

        updateGridRow(drag.rowId, (currentRow) => ({
          ...currentRow,
          cells: currentRow.cells.map((cell, index) => ({
            ...cell,
            colSpan: nextSpans[index] ?? cell.colSpan,
          })),
        }));
      }
    };

    const handleUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [customGrid, snapEnabled]);

  const applyBlocks = async (
    blocks: Block[],
    options?: { generatedTemplate?: { source: 'ai'; name: string } }
  ) => {
    if (!blocks.length) {
      toast.error('Nessun blocco valido da applicare');
      return false;
    }

    if (onApplyBlocks) {
      setApplying(true);
      try {
        await onApplyBlocks(blocks, options);
        onClose();
        return true;
      } catch (error) {
        console.error(error);
        toast.error('Errore applicazione layout');
        return false;
      } finally {
        setApplying(false);
      }
    }

    setBlocks(blocks);
    if (blocks[0]) {
      selectBlock(blocks[0].id);
    }
    useUiStore.setState({ showOutlines: true, rightPanelOpen: true, rightPanelTab: 'properties' });
    onClose();
    return true;
  };

  const buildAiBlockTree = (action: AiLayoutAction) => {
    if (action.action !== 'add-block' || !action.blockType) {
      return null;
    }

    const def = getBlockDefinition(action.blockType as BlockType);
    if (!def) {
      return null;
    }

    const block = createBlock(
      def.type,
      action.label || def.label,
      { ...def.defaultProps, ...(action.props || {}) },
      def.defaultStyle
    );
    block.id = generateId();

    if (def.defaultDataSource) {
      block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
    }

    const normalizeAiStyle = (style?: AiStyleInput): Partial<BlockStyle> | null => {
      if (!style) {
        return null;
      }

      const normalized: Partial<BlockStyle> = {};

      if (style.background || style.backgroundColor) {
        const sourceBackground = style.background;
        const backgroundType = style.backgroundColor
          ? 'color'
          : sourceBackground?.type;
        const backgroundValue = style.backgroundColor
          ? style.backgroundColor
          : sourceBackground?.value;

        if (backgroundType && typeof backgroundValue === 'string') {
          normalized.background = {
            ...sourceBackground,
            type: backgroundType,
            value: backgroundValue,
          };
        }
      }

      if (style.typography || style.color) {
        normalized.typography = {
          ...style.typography,
          ...(style.color ? { color: style.color } : {}),
        };
      }

      if (style.layout || style.height || style.minHeight || style.maxWidth) {
        const sourceLayout = style.layout;
        normalized.layout = {
          display: sourceLayout?.display || 'block',
          padding: sourceLayout?.padding || { top: '0', right: '0', bottom: '0', left: '0' },
          margin: sourceLayout?.margin || { top: '0', right: '0', bottom: '0', left: '0' },
          width: sourceLayout?.width || '100%',
          maxWidth: sourceLayout?.maxWidth || '100%',
          ...sourceLayout,
          ...(style.height ? { minHeight: style.height } : {}),
          ...(style.minHeight ? { minHeight: style.minHeight } : {}),
          ...(style.maxWidth ? { maxWidth: style.maxWidth } : {}),
        };
      }

      if (style.border) {
        normalized.border = style.border;
      }

      return normalized;
    };

    const normalizedStyle = normalizeAiStyle(action.style as AiStyleInput | undefined);
    if (normalizedStyle) {
      if (normalizedStyle.background) {
        block.style.background = { ...block.style.background, ...normalizedStyle.background };
      }
      if (normalizedStyle.typography) {
        block.style.typography = { ...block.style.typography, ...normalizedStyle.typography };
      }
      if (normalizedStyle.layout) {
        block.style.layout = {
          ...block.style.layout,
          ...normalizedStyle.layout,
          padding: normalizedStyle.layout.padding
            ? { ...block.style.layout.padding, ...normalizedStyle.layout.padding }
            : block.style.layout.padding,
          margin: normalizedStyle.layout.margin
            ? { ...block.style.layout.margin, ...normalizedStyle.layout.margin }
            : block.style.layout.margin,
        };
      }
      if (normalizedStyle.border) {
        block.style.border = { ...block.style.border, ...normalizedStyle.border };
      }
    }

    if (action.blockType === 'navigation' && Array.isArray(action.props?.menuItems) && !Array.isArray(action.props?.items)) {
      block.props.items = (action.props.menuItems as Array<Record<string, unknown>>).map((item, index) => ({
        id: String(index + 1),
        label: String(item.text || item.label || `Voce ${index + 1}`),
        url: String(item.url || '#'),
        children: [],
      }));
    }

    if (action.blockType === 'columns') {
      const childCount = Array.isArray(action.children) ? action.children.length : 0;
      if (childCount > 0) {
        block.props.columnCount = childCount;
        const currentWidths = Array.isArray(block.props.columnWidths)
          ? (block.props.columnWidths as unknown[]).map((width) => String(width))
          : [];
        if (currentWidths.length !== childCount) {
          const evenWidth = `${(100 / childCount).toFixed(2)}%`;
          block.props.columnWidths = Array.from({ length: childCount }, () => evenWidth);
        }
      }
    }

    if (Array.isArray(action.children) && action.children.length > 0) {
      block.children = action.children
        .map((child) => buildAiBlockTree(child))
        .filter((child): child is NonNullable<typeof child> => Boolean(child));
    }

    return block;
  };

  const buildPresetBlockTree = (presetBlock: PresetBlock) => {
    const def = getBlockDefinition(presetBlock.type);
    if (!def) {
      return null;
    }

    const block = createBlock(
      def.type,
      presetBlock.label || def.label,
      { ...def.defaultProps, ...(presetBlock.props || {}) },
      presetBlock.styleOverrides ? { ...def.defaultStyle, ...presetBlock.styleOverrides } : def.defaultStyle
    );

    block.id = generateId();

    if (def.defaultDataSource) {
      block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
    }

    if (presetBlock.styleOverrides) {
      if (presetBlock.styleOverrides.background) block.style.background = { ...block.style.background, ...presetBlock.styleOverrides.background };
      if (presetBlock.styleOverrides.typography) block.style.typography = { ...block.style.typography, ...presetBlock.styleOverrides.typography };
      if (presetBlock.styleOverrides.layout) {
        block.style.layout = {
          ...block.style.layout,
          ...presetBlock.styleOverrides.layout,
          padding: presetBlock.styleOverrides.layout.padding
            ? { ...block.style.layout.padding, ...presetBlock.styleOverrides.layout.padding }
            : block.style.layout.padding,
          margin: presetBlock.styleOverrides.layout.margin
            ? { ...block.style.layout.margin, ...presetBlock.styleOverrides.layout.margin }
            : block.style.layout.margin,
        };
      }
      if (presetBlock.styleOverrides.border) {
        block.style.border = { ...block.style.border, ...presetBlock.styleOverrides.border };
      }
    }

    if (Array.isArray(presetBlock.children) && presetBlock.children.length > 0) {
      block.children = presetBlock.children
        .map((child) => buildPresetBlockTree(child))
        .filter((child): child is NonNullable<typeof child> => Boolean(child));
    }

    return block;
  };

  const normalizeAiAction = (action: AiLayoutAction): AiLayoutAction => {
    const normalized: AiLayoutAction = {
      ...action,
      props: { ...(action.props || {}) },
      children: Array.isArray(action.children) ? action.children.map(normalizeAiAction) : action.children,
    };

    if (normalized.blockType === 'navigation') {
      const currentItems = Array.isArray(normalized.props?.items) ? normalized.props.items as Array<Record<string, unknown>> : [];
      if (currentItems.length > 0) {
        normalized.props = {
          ...normalized.props,
          items: currentItems.map((item, index) => ({
            id: String(item.id || index + 1),
            label: String(item.label || item.text || item.title || `Voce ${index + 1}`),
            url: String(item.url || item.link || '#'),
            children: Array.isArray(item.children) ? item.children : [],
          })),
        };
      }

      const menuItems = Array.isArray(normalized.props?.menuItems) ? normalized.props.menuItems as Array<Record<string, unknown>> : [];
      if ((!Array.isArray(normalized.props?.items) || !(normalized.props?.items as unknown[]).length) && menuItems.length > 0) {
        normalized.props = {
          ...normalized.props,
          items: menuItems.map((item, index) => ({
            id: String(index + 1),
            label: String(item.label || item.text || item.title || `Voce ${index + 1}`),
            url: String(item.url || item.link || '#'),
            children: [],
          })),
        };
      }
    }

    if (normalized.blockType === 'breaking-ticker') {
      const items = Array.isArray(normalized.props?.items) ? normalized.props.items as Array<Record<string, unknown>> : [];
      if ((!Array.isArray(normalized.props?.tickerItems) || !(normalized.props?.tickerItems as unknown[]).length) && items.length > 0) {
        normalized.props = {
          ...normalized.props,
          tickerItems: items.map((item) => ({ text: String(item.text || item.title || item.label || '') })).filter((item) => item.text.trim().length > 0),
        };
      }
    }

    return normalized;
  };

  const blockTreeHasType = (blocks: Block[], types: BlockType[]) => {
    const stack = [...blocks];
    while (stack.length > 0) {
      const current = stack.shift();
      if (!current) continue;
      if (types.includes(current.type)) {
        return true;
      }
      if (Array.isArray(current.children) && current.children.length > 0) {
        stack.push(...current.children);
      }
    }
    return false;
  };

  const isEditorialPrompt = (prompt: string) =>
    /giornal|testata|quotidian|news|notizi|breaking|tg|cronaca|sport|cultura|homepage/i.test(prompt);

  const createDefaultBlock = (type: BlockType, label: string, props?: Record<string, unknown>) => {
    const def = getBlockDefinition(type);
    if (!def) return null;
    const block = createBlock(def.type, label || def.label, { ...def.defaultProps, ...(props || {}) }, def.defaultStyle);
    block.id = generateId();
    if (def.defaultDataSource) {
      block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
    }
    return block;
  };

  const buildEditorialScaffold = (blocks: Block[], prompt: string) => {
    const upgradeEditorialColumns = (block: Block): Block => {
      const nextBlock: Block = {
        ...block,
        children: Array.isArray(block.children) ? block.children.map(upgradeEditorialColumns) : [],
      };

      if (nextBlock.type === 'columns' && nextBlock.children.length === 3) {
        const [left, center, right] = nextBlock.children;
        const makeRail = (label: string) => {
          const rail = createDefaultBlock('article-grid', label, {
            title: label,
            columns: 1,
            maxItems: 4,
          });
          return rail;
        };

        nextBlock.children = [
          ['text', 'section', 'container'].includes(left.type) ? (makeRail(left.label || 'Colonna Sinistra') || left) : left,
          center.type === 'text'
            ? (createDefaultBlock('article-hero', center.label || 'Apertura Centrale', {
                variant: 'split',
                showMeta: true,
              }) || center)
            : center,
          ['text', 'section', 'container'].includes(right.type) ? (makeRail(right.label || 'Colonna Destra') || right) : right,
        ];
      }

      return nextBlock;
    };

    if (!isEditorialPrompt(prompt)) {
      return blocks;
    }

    if (blockTreeHasType(blocks, ['columns'])) {
      return blocks.map(upgradeEditorialColumns);
    }

    const nav = blocks.find((block) => block.type === 'navigation') || createDefaultBlock('navigation', 'Navigazione');
    const ticker = blocks.find((block) => block.type === 'breaking-ticker') || createDefaultBlock('breaking-ticker', 'Breaking');
    const footer = blocks.find((block) => block.type === 'footer') || createDefaultBlock('footer', 'Footer');
    const primaryHero =
      blocks.find((block) => block.type === 'article-hero')
      || blocks.find((block) => block.type === 'hero')
      || createDefaultBlock('article-hero', 'Apertura Principale', {
        variant: 'split',
        showMeta: true,
      });
    const video = blocks.find((block) => block.type === 'video');

    const leftRail = createDefaultBlock('article-grid', 'Colonna Sinistra', {
      title: 'Ultime notizie',
      columns: 1,
      maxItems: 4,
    });
    const rightRail = createDefaultBlock('article-grid', 'Colonna Destra', {
      title: 'In evidenza',
      columns: 1,
      maxItems: 4,
    });
    const centerBlock = primaryHero || createDefaultBlock('article-hero', 'Apertura Principale');

    if (!leftRail || !rightRail || !centerBlock) {
      return blocks;
    }

    const widths = /tg|breaking/i.test(prompt)
      ? ['24%', '52%', '24%']
      : /magazine|cultura|lifestyle/i.test(prompt)
        ? ['22%', '56%', '22%']
        : ['28%', '44%', '28%'];

    const columns = createDefaultBlock('columns', 'Pacchetto editoriale', {
      columnCount: 3,
      columnWidths: widths,
      gap: '24px',
      stackOnMobile: true,
    });
    if (!columns) {
      return blocks;
    }
    columns.children = [leftRail, centerBlock, rightRail];

    const section = createDefaultBlock('section', 'Prima pagina', {
      tag: 'section',
      fullWidth: true,
    });
    if (!section) {
      return blocks;
    }
    section.children = [columns];

    const remainingBlocks = blocks.filter((block) => !['navigation', 'breaking-ticker', 'footer', 'hero', 'article-hero'].includes(block.type));
    const preserved = remainingBlocks.filter((block) => block.type !== 'section');

    return [
      ...(nav ? [nav] : []),
      ...(ticker ? [ticker] : []),
      section,
      ...(video ? [video] : []),
      ...preserved.filter((block) => block.type !== 'video'),
      ...(footer ? [footer] : []),
    ];
  };

  const createWireframeSection = (label: string, minHeight: string, width = '100%') => {
    const section = createBlock('section', label, { tag: 'section', fullWidth: true });
    section.id = generateId();
    section.style.layout.width = width;
    section.style.layout.maxWidth = '100%';
    section.style.layout.minHeight = minHeight;
    section.style.layout.padding = { top: '0', right: '0', bottom: '0', left: '0' };
    section.style.background = {
      type: 'color',
      value: 'rgba(59, 130, 246, 0.08)',
      overlay: '',
      parallax: false,
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
    };
    section.style.border = {
      width: '2px',
      style: 'dashed',
      color: 'rgba(59, 130, 246, 0.85)',
      radius: '0px',
    };
    section.style.typography = {
      ...section.style.typography,
      color: '#1d4ed8',
    };
    section.style.customCss = `
      position: relative;
    `;
    return section;
  };

  const numericWidth = (value: string) => {
    const parsed = Number.parseFloat(value.replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getSingleColumnLabel = (rowIndex: number, totalRows: number, height: number) => {
    if (rowIndex === 0) return 'Header';
    if (rowIndex === totalRows - 1) return 'Footer';
    if (height >= 45) return 'Hero';
    if (height <= 8) return `Separatore ${rowIndex}`;
    if (rowIndex === 1) return 'Sezione Principale';
    return `Sezione ${rowIndex + 1}`;
  };

  const getColumnLabels = (cols: string[], rowIndex: number) => {
    if (cols.length === 2) {
      const [left, right] = cols.map(numericWidth);
      if (rowIndex === 1 && left >= 60) return ['Contenuto Principale', 'Sidebar'];
      if (rowIndex === 1 && right >= 60) return ['Sidebar', 'Contenuto Principale'];
      if (left <= 28 && right >= 60) return ['Sidebar', 'Contenuto'];
      if (right <= 28 && left >= 60) return ['Contenuto', 'Sidebar'];
      return ['Colonna Sinistra', 'Colonna Destra'];
    }

    if (cols.length === 3) {
      const [left, center, right] = cols.map(numericWidth);
      if (center > left && center > right) return ['Colonna SX', 'Contenuto Centrale', 'Colonna DX'];
      if (left > center && left > right) return ['Hero / Focus', 'Supporto', 'Supporto'];
      if (right > center && right > left) return ['Supporto', 'Supporto', 'Hero / Focus'];
      return ['Colonna 1', 'Colonna 2', 'Colonna 3'];
    }

    if (cols.length === 4) {
      return ['Blocco 1', 'Blocco 2', 'Blocco 3', 'Blocco 4'];
    }

    return cols.map((_, index) => `Blocco ${index + 1}`);
  };

  const buildGridPresetBlocks = (preset: LayoutPresetDef) => {
    return preset.rows.map((row, rowIndex) => {
      const [height, ...cols] = row;
      const heightPx = `${(height as number) * 5}px`;

      if (cols.length === 1) {
        return createWireframeSection(
          getSingleColumnLabel(rowIndex, preset.rows.length, height as number),
          heightPx,
          cols[0] as string
        );
      }

      const columns = createBlock('columns', `Riga ${rowIndex + 1}`, {
        columnCount: cols.length,
        columnWidths: cols,
        gap: '16px',
        stackOnMobile: true,
      });
      columns.id = generateId();
      columns.style.layout.width = '100%';
      columns.style.layout.maxWidth = '100%';
      columns.style.layout.minHeight = heightPx;
      columns.style.layout.padding = { top: '0', right: '0', bottom: '0', left: '0' };

      const labels = getColumnLabels(cols as string[], rowIndex);
      columns.children = cols.map((width, columnIndex) =>
        createWireframeSection(labels[columnIndex] || `Blocco ${columnIndex + 1}`, heightPx, width as string)
      );

      return columns;
    });
  };

  // Initialize custom grid
  const initGrid = () => {
    const rows: GridRow[] = [];
    for (let r = 0; r < gridRows; r++) {
      const cells: GridCell[] = [];
      for (let c = 0; c < gridCols; c++) {
        cells.push(makeCell(r, c));
      }
      rows.push({ id: `row-${r}-${generateId()}`, cells, height: '220' });
    }
    setCustomGrid(rows);
    setSelectedRowId(rows[0]?.id ?? null);
    setSelectedCell(rows[0]?.cells[0]?.id ?? null);
  };

  const addRow = () => {
    const nextIndex = customGrid.length;
    const nextRow: GridRow = {
      id: `row-${nextIndex}-${generateId()}`,
      cells: [makeCell(nextIndex, 0)],
      height: '220',
    };
    setCustomGrid((current) => [...current, nextRow]);
    setSelectedRowId(nextRow.id);
    setSelectedCell(nextRow.cells[0].id);
  };

  const removeSelectedRow = () => {
    if (!selectedRowId || customGrid.length <= 1) return;
    const remaining = customGrid.filter((row) => row.id !== selectedRowId);
    setCustomGrid(remaining);
    setSelectedRowId(remaining[0]?.id ?? null);
    setSelectedCell(remaining[0]?.cells[0]?.id ?? null);
  };

  const mirrorSelectedRow = () => {
    if (!selectedRowId) return;
    updateGridRow(selectedRowId, (row) => ({ ...row, cells: [...row.cells].reverse() }));
  };

  const addCellToSelectedRow = () => {
    if (!selectedRowId) return;
    const rowIndex = customGrid.findIndex((row) => row.id === selectedRowId);
    updateGridRow(selectedRowId, (row) => {
      const nextCell = makeCell(Math.max(rowIndex, 0), row.cells.length);
      setSelectedCell(nextCell.id);
      return { ...row, cells: [...row.cells, nextCell] };
    });
  };

  const removeSelectedCell = () => {
    if (!selectedRowId || !selectedCell) return;
    updateGridRow(selectedRowId, (row) => {
      if (!row.cells.some((cell) => cell.id === selectedCell) || row.cells.length <= 1) {
        return row;
      }
      const cells = row.cells.filter((cell) => cell.id !== selectedCell);
      setSelectedCell(cells[0]?.id ?? null);
      return { ...row, cells };
    });
  };

  const applyRowRatioPreset = (weights: number[]) => {
    if (!selectedRowId) return;
    const rowIndex = customGrid.findIndex((row) => row.id === selectedRowId);
    updateGridRow(selectedRowId, (row) => ({
      ...row,
      cells: weights.map((weight, index) => {
        const existing = row.cells[index];
        return existing
          ? { ...existing, colSpan: weight }
          : { ...makeCell(Math.max(rowIndex, 0), index, weight), colSpan: weight };
      }),
    }));
  };

  // Apply preset
  const applyPreset = (preset: FeaturedPreset) => {
    const newBlocks = preset.blocks
      .map((block) => buildPresetBlockTree(block))
      .filter((block): block is NonNullable<typeof block> => Boolean(block));
    void applyBlocks(newBlocks);
  };

  // Apply custom grid as sections with columns
  const applyCustomGrid = () => {
    const blocks = customGrid.map((row) => {
      const totalWeight = row.cells.reduce((sum, cell) => sum + Math.max(cell.colSpan, 1), 0);
      const rowHeight = `${Math.max(Number(row.height) || 220, 80)}px`;
      const rowHeightValue = Math.max(Number(row.height) || 220, 80);

      const applyCellEnhancements = (block: Block, cell: GridCell, widthPercent: string) => {
        block.props = {
          ...block.props,
          layoutAssignment: {
            role: cell.blockType || 'section',
            rowId: row.id,
            rowHeight,
            width: widthPercent,
          },
        };
        block.style.layout.width = widthPercent;
        block.style.layout.maxWidth = widthPercent;
        block.style.layout.minHeight = `${Math.max(cell.minHeight || rowHeightValue, 80)}px`;
        block.style.layout.padding = {
          top: `${cell.padding}px`,
          right: `${cell.padding}px`,
          bottom: `${cell.padding}px`,
          left: `${cell.padding}px`,
        };
        block.style.layout.position = 'relative';
        block.style.layout.zIndex = cell.zIndex;
        block.style.background = {
          ...block.style.background,
          type: 'color',
          value: cell.color,
        };
        block.style.typography = {
          ...block.style.typography,
          color: '#ffffff',
          textAlign: cell.align === 'start' ? 'left' : cell.align === 'end' ? 'right' : 'center',
        };
        block.style.customCss = [
          'display:flex;',
          'flex-direction:column;',
          `justify-content:${cell.align === 'start' ? 'flex-start' : cell.align === 'end' ? 'flex-end' : 'center'};`,
          cell.align === 'center' ? 'align-items:center;' : cell.align === 'end' ? 'align-items:flex-end;' : 'align-items:flex-start;',
          'position:relative;',
          `transform:translate(${cell.offsetX}px, ${cell.offsetY}px);`,
          `z-index:${cell.zIndex};`,
          cell.customCss || '',
        ].join('\n');

        if (cell.shape !== 'rect') {
          const clipPaths: Record<Exclude<GridCell['shape'], 'rect'>, string> = {
            'diagonal-left': 'polygon(0 0, 100% 0, 100% 100%, 0 82%)',
            'diagonal-right': 'polygon(0 0, 100% 0, 100% 82%, 0 100%)',
            'slant-top': 'polygon(0 12%, 100% 0, 100% 100%, 0 100%)',
            'slant-bottom': 'polygon(0 0, 100% 0, 100% 88%, 0 100%)',
          };
          block.shape = {
            type: 'clip-path',
            value: clipPaths[cell.shape],
          };
        }
      };

      if (row.cells.length === 1) {
        // Single cell = section
        const cell = row.cells[0];
        const blockType = cell.blockType || 'section';
        const def = getBlockDefinition(blockType);
        if (!def) return null;
        const block = createBlock(def.type, cell.label || def.label, def.defaultProps, def.defaultStyle);
        block.id = generateId();
        if (def.defaultDataSource) {
          block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
        }
        applyCellEnhancements(block, cell, '100%');
        return block;
      } else {
        // Multiple cells = columns container
        const colBlock = createBlock('columns', `Riga ${row.id}`, {
          columnCount: row.cells.length,
          columnWidths: row.cells.map((cell) => `${(Math.max(cell.colSpan, 1) / totalWeight) * 100}%`),
          gap: `${gridGap}px`,
          stackOnMobile: true,
        });
        colBlock.id = generateId();
        colBlock.style.layout.minHeight = rowHeight;
        colBlock.style.layout.padding = { top: '8px', right: '0', bottom: '8px', left: '0' };

        colBlock.children = row.cells.map((cell) => {
          const blockType = cell.blockType || 'section';
          const def = getBlockDefinition(blockType);
          if (!def) {
            const fallback = createBlock('section', cell.label || 'Cella', {});
            fallback.id = generateId();
            applyCellEnhancements(fallback, cell, `${(Math.max(cell.colSpan, 1) / totalWeight) * 100}%`);
            return fallback;
          }
          const child = createBlock(def.type, cell.label || def.label, def.defaultProps, def.defaultStyle);
          child.id = generateId();
          if (def.defaultDataSource) {
            child.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
          }
          applyCellEnhancements(child, cell, `${(Math.max(cell.colSpan, 1) / totalWeight) * 100}%`);
          return child;
        });

        return colBlock;
      }
    }).filter(Boolean);

    void applyBlocks(blocks as NonNullable<typeof blocks[0]>[]);
  };

  // AI suggest layout
  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant?.id,
          taskType: 'layout',
          prompt: aiPrompt,
          systemPrompt: `Sei un designer operativo del builder layout CMS. L'utente descrive il sito che vuole. Tu DEVI rispondere con un JSON array di blocchi reali del builder.

BLOCCHI DISPONIBILI: navigation, hero, text, image-gallery, video, audio, slideshow, carousel, comparison, divider, banner-ad, banner-zone, footer, sidebar, social, author-bio, related-content, newsletter, newsletter-signup, cms-form, timeline, quote, accordion, tabs, table, code, map, counter, custom-html, section, container, columns, article-grid, article-hero, category-nav, event-list, search-bar, breaking-ticker.

FORMATO RISPOSTA (SOLO JSON, nessun testo):
[
  {"action":"add-block","blockType":"navigation","label":"Nome","props":{...},"style":{},"children":[]},
  ...altri blocchi...
]

REGOLE:
- Rispondi SOLO con JSON array
- Crea TUTTI i blocchi necessari per una pagina completa con blocchi veri
- Personalizza props con contenuti reali e pertinenti alla richiesta
- Usa style overrides per colori e sfondi appropriati
- Includi sempre navigation e footer
- Se serve una struttura complessa, usa "columns" con "children" annidati
- I layout generati devono essere ORIGINALI e diversi dai preset standard gia presenti in libreria
- Se l'utente chiede layout grafici spinti, usa section, columns, divider, custom-html, shape/divider CSS quando utile, ma sempre in formato blocchi reali
- Non simulare layout con dati finti grafici: genera solo blocchi realmente supportati dal builder`,
        }),
      });

      const data = await response.json();
      if (data.content) {
        // Parse and execute
        const cleaned = data.content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        try {
          const actions = JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] || cleaned) as AiLayoutAction[];
          if (Array.isArray(actions)) {
            const normalizedActions = actions.map(normalizeAiAction);
            const blocks = normalizedActions
              .map((action) => buildAiBlockTree(action))
              .filter((block): block is NonNullable<typeof block> => Boolean(block));

            if (blocks.length > 0) {
              const enrichedBlocks = buildEditorialScaffold(blocks, aiPrompt);
              const generatedName = aiPrompt
                .trim()
                .slice(0, 72)
                .replace(/\s+/g, ' ');
              const applied = await applyBlocks(enrichedBlocks, {
                generatedTemplate: {
                  source: 'ai',
                  name: generatedName || 'Layout IA',
                },
              });
              if (applied) {
                toast.success(onApplyBlocks ? 'Layout AI applicato alla pagina' : 'Layout AI applicato al builder');
              }
              return;
            }
          }
        } catch {
          toast.error('L’AI non ha generato un layout valido');
        }
      }
      // If parsing failed, show error
      toast.error('L’AI non ha generato un layout valido. Riprova con una descrizione più dettagliata.');
    } catch {
      toast.error('Errore di connessione con l’AI.');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply a config preset by generating sections from the row structure
  const applyGridPreset = (preset: LayoutPresetDef) => {
    const blocks = buildGridPresetBlocks(preset);
    void applyBlocks(blocks);
  };

  const categories = [
    { id: 'all', label: 'Tutti' },
    { id: 'editorial', label: 'Editoriale' },
    { id: 'news', label: 'News/TG' },
    { id: 'magazine', label: 'Magazine' },
    { id: 'blog', label: 'Blog' },
    { id: 'landing', label: 'Landing' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'creative', label: 'Creativo' },
    { id: 'broadsheet', label: 'Broadsheet' },
    { id: 'fullwidth', label: 'Full Width' },
    { id: 'showcase', label: 'Showcase' },
    { id: 'minimal', label: 'Minimale' },
  ];

  // Merge featured presets (with blocks) and config presets (grid only)
  const allPresets = [
    ...LAYOUT_PRESETS.map((p, index) => ({
      ...p,
      _featured: true as const,
      _libraryKey: `featured:${p.category}:${p.id}:${index}`,
    })),
    ...CONFIG_PRESETS.map((p, index) => ({
      ...p,
      _featured: false as const,
      _libraryKey: `config:${p.category}:${p.id}:${index}`,
    })),
  ];

  const filteredPresets = selectedCategory === 'all'
    ? allPresets
    : allPresets.filter(p => p.category === selectedCategory);
  const selectedRow = customGrid.find((row) => row.id === selectedRowId) || null;
  const selectedCellData = selectedRow?.cells.find((cell) => cell.id === selectedCell) || null;

  const renderPresetThumbnail = (preset: typeof filteredPresets[number]) => {
    const rows = 'rows' in preset ? (preset as LayoutPresetDef).rows : null;
    if (!rows) {
      return <div className="flex-1 bg-zinc-200/60 dark:bg-zinc-700/50" />;
    }

    const totalHeight = rows.reduce((sum, r) => sum + (r[0] as number), 0);

    return rows.map((row, ri) => {
      const [height, ...cols] = row;
      const heightPercent = ((height as number) / totalHeight) * 100;
      const singleLabel = cols.length === 1 ? getSingleColumnLabel(ri, rows.length, height as number) : null;
      const labels = cols.length > 1 ? getColumnLabels(cols as string[], ri) : [];
      const isHeader = ri === 0;
      const isFooter = ri === rows.length - 1;

      return (
        <div
          key={`${preset.id}-row-${ri}`}
          className="flex gap-[4px] shrink-0"
          style={{ height: `${heightPercent}%`, minHeight: 10 }}
        >
          {cols.map((width, ci) => (
            <div
              key={`${preset.id}-cell-${ri}-${ci}`}
              className="border border-dashed px-1 py-1 flex items-start overflow-hidden"
              style={{
                width: width as string,
                minWidth: 10,
                borderColor: isHeader
                  ? 'rgba(29, 78, 216, 0.95)'
                  : isFooter
                    ? 'rgba(37, 99, 235, 0.9)'
                    : 'rgba(59, 130, 246, 0.82)',
                backgroundColor: isHeader
                  ? 'rgba(29, 78, 216, 0.14)'
                  : isFooter
                    ? 'rgba(37, 99, 235, 0.14)'
                    : ci % 2 === 1
                      ? 'rgba(96, 165, 250, 0.12)'
                      : 'rgba(59, 130, 246, 0.08)',
              }}
            >
              <div className="min-w-0 w-full">
                <div className="text-[8px] font-semibold uppercase tracking-[0.08em] leading-none truncate text-blue-700 dark:text-blue-300">
                  {singleLabel || labels[ci] || `Blocco ${ci + 1}`}
                </div>
                <div className="mt-1 flex flex-col gap-[2px]">
                  <div className="h-[4px] bg-blue-300/70 dark:bg-blue-200/40 w-[85%]" />
                  <div className="h-[4px] bg-blue-200/70 dark:bg-blue-100/30 w-[58%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Layout & Template</h2>
            <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
              Questa libreria usa i template builder condivisi con il modulo Layout del CMS.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700 px-6">
          {[
            { id: 'presets' as const, label: 'Template Pronti', icon: LayoutGrid },
            { id: 'custom' as const, label: 'Griglia Custom', icon: Grid3X3 },
            { id: 'ai' as const, label: 'AI Layout', icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); if (id === 'custom' && customGrid.length === 0) initGrid(); }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* === PRESETS TAB === */}
          {tab === 'presets' && (
            <div>
              {/* Category filter */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Count */}
              <p className="text-xs text-zinc-400 mb-4">{filteredPresets.length} layout disponibili</p>

              {/* Preset grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredPresets.map((preset) => {
                  const isFeatured = preset._featured && 'blocks' in preset;
                  const rows = 'rows' in preset ? (preset as LayoutPresetDef).rows : null;
                  const maxCols = rows
                    ? Math.max(...rows.map(r => r.length - 1))
                    : 1;

                  return (
                    <div
                      key={preset._libraryKey}
                      className={cn(
                        'group border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all',
                        applying && 'pointer-events-none opacity-70'
                      )}
                      onClick={() => {
                        if (isFeatured) applyPreset(preset as unknown as FeaturedPreset);
                        else if (rows) applyGridPreset(preset as LayoutPresetDef);
                      }}
                    >
                      {/* Thumbnail: outlined layout preview */}
                      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/80 h-36 flex flex-col gap-[2px]">
                        {renderPresetThumbnail(preset)}
                      </div>

                      <div className="px-2.5 py-2">
                        <h3 className="font-medium text-[11px] text-zinc-900 dark:text-zinc-100 truncate">{preset.name}</h3>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[9px] text-zinc-400">
                            {rows ? `${rows.length} sez` : ''} · {maxCols} col
                            {isFeatured && ' · PRO'}
                          </span>
                          <span className="text-[9px] text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Usa →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === CUSTOM GRID TAB === */}
          {tab === 'custom' && (
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Base colonne:</span>
                  <button onClick={() => setGridCols(Math.max(1, gridCols - 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Minus size={14} /></button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">{gridCols}</span>
                  <button onClick={() => setGridCols(Math.min(12, gridCols + 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Plus size={14} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Base righe:</span>
                  <button onClick={() => setGridRows(Math.max(1, gridRows - 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Minus size={14} /></button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">{gridRows}</span>
                  <button onClick={() => setGridRows(Math.min(20, gridRows + 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Plus size={14} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Gap:</span>
                  <input type="range" min={0} max={48} value={gridGap} onChange={(e) => setGridGap(Number(e.target.value))} className="w-24" />
                  <span className="text-xs font-mono text-zinc-400">{gridGap}px</span>
                </div>
                <button onClick={initGrid} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  <RotateCcw size={12} /> Nuova base
                </button>
                <button
                  onClick={() => {
                    setGridCols(Math.floor(Math.random() * 4) + 1);
                    setGridRows(Math.floor(Math.random() * 6) + 3);
                    setTimeout(initGrid, 50);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Shuffle size={12} /> Random
                </button>
                <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-xs font-medium text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900">
                  <Plus size={12} /> Aggiungi riga
                </button>
                <button onClick={removeSelectedRow} disabled={!selectedRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 disabled:opacity-40">
                  <Minus size={12} /> Elimina riga
                </button>
                <button onClick={addCellToSelectedRow} disabled={!selectedRow} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 disabled:opacity-40">
                  <Plus size={12} /> Aggiungi blocco
                </button>
                <button onClick={removeSelectedCell} disabled={!selectedCellData} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 disabled:opacity-40">
                  <Minus size={12} /> Elimina blocco
                </button>
                <button onClick={mirrorSelectedRow} disabled={!selectedRow || !selectedRow.cells.length} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 disabled:opacity-40">
                  <Shuffle size={12} /> Specchia riga
                </button>
                <button onClick={duplicateSelectedCell} disabled={!selectedCellData} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 disabled:opacity-40">
                  <Copy size={12} /> Duplica blocco
                </button>
                <button
                  type="button"
                  onClick={() => setSnapEnabled((current) => !current)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    snapEnabled
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'
                  )}
                >
                  <MoveHorizontal size={12} /> Magneti {snapEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setGuidesEnabled((current) => !current)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    guidesEnabled
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'
                  )}
                >
                  <Grid3X3 size={12} /> Guide {guidesEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_360px] gap-4">
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 bg-zinc-50 dark:bg-zinc-800">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">Canvas layout manuale</div>
                  <div className="space-y-3">
                    {customGrid.map((row, ri) => {
                      const totalWeight = row.cells.reduce((sum, cell) => sum + Math.max(cell.colSpan, 1), 0);
                      return (
                        <div
                          key={row.id}
                          className={cn(
                            'rounded-2xl border p-3 transition-all relative',
                            selectedRowId === row.id
                              ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                              : 'border-zinc-200 dark:border-zinc-700'
                          )}
                          style={{ background: 'rgba(255,255,255,0.55)' }}
                          ref={(node) => {
                            rowRefs.current[row.id] = node;
                          }}
                          onClick={() => {
                            setSelectedRowId(row.id);
                            setSelectedCell(row.cells[0]?.id ?? null);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px] font-semibold text-zinc-500 uppercase">
                              Riga {ri + 1}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {row.cells.length} blocchi • {row.height}px
                            </div>
                          </div>
                          <div
                            className="flex items-stretch relative"
                            style={{
                              gap: gridGap,
                              backgroundImage: guidesEnabled
                                ? 'linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px)'
                                : 'none',
                              backgroundSize: guidesEnabled ? '24px 24px' : undefined,
                            }}
                          >
                            {row.cells.map((cell, ci) => (
                              <button
                                key={cell.id}
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedRowId(row.id);
                                  setSelectedCell(cell.id);
                                }}
                                className={cn(
                                  'rounded-xl border text-white text-left px-3 py-3 relative overflow-hidden transition-all select-none',
                                  selectedCell === cell.id
                                    ? 'border-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)]'
                                    : 'border-white/20'
                                )}
                                style={{
                                  background: `linear-gradient(135deg, ${cell.color} 0%, color-mix(in srgb, ${cell.color} 70%, #111827) 100%)`,
                                  flex: Math.max(cell.colSpan, 1),
                                  minHeight: `${Math.max(cell.minHeight || Number(row.height) || 220, 80)}px`,
                                  transform: `translate(${cell.offsetX}px, ${cell.offsetY}px)`,
                                  zIndex: cell.zIndex,
                                  clipPath:
                                    cell.shape === 'rect'
                                      ? 'none'
                                      : cell.shape === 'diagonal-left'
                                        ? 'polygon(0 0, 100% 0, 100% 100%, 0 82%)'
                                        : cell.shape === 'diagonal-right'
                                          ? 'polygon(0 0, 100% 0, 100% 82%, 0 100%)'
                                          : cell.shape === 'slant-top'
                                            ? 'polygon(0 12%, 100% 0, 100% 100%, 0 100%)'
                                            : 'polygon(0 0, 100% 0, 100% 88%, 0 100%)',
                                }}
                                >
                                {ci > 0 && (
                                  <span
                                    onMouseDown={(event) => startCellResize(event, row.id, ci, 'left')}
                                    className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-col-resize z-20"
                                    title="Trascina per ridimensionare"
                                  />
                                )}
                                {ci < row.cells.length - 1 && (
                                  <span
                                    onMouseDown={(event) => startCellResize(event, row.id, ci, 'right')}
                                    className="absolute right-0 top-0 h-full w-3 translate-x-1/2 cursor-col-resize z-20"
                                    title="Trascina per ridimensionare"
                                  />
                                )}
                                <div className="absolute top-2 right-2 text-[10px] font-mono opacity-70">
                                  {Math.round((Math.max(cell.colSpan, 1) / totalWeight) * 100)}%
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.14em] opacity-75 mb-2">
                                  {cell.blockType || `blocco ${ci + 1}`}
                                </div>
                                <div className="text-sm font-semibold leading-tight">
                                  {cell.label || `R${ri + 1} / C${ci + 1}`}
                                </div>
                                <div className="mt-2 text-[11px] opacity-80">
                                  {cell.shape} • {cell.align} • {Math.max(cell.minHeight || Number(row.height) || 220, 80)}px
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onMouseDown={(event) => startRowResize(event, row.id)}
                            className="absolute left-1/2 bottom-0 h-3 w-24 -translate-x-1/2 translate-y-1/2 cursor-row-resize rounded-full border border-blue-300/70 bg-white/90 text-[10px] font-medium text-blue-600 shadow-sm"
                            title="Trascina per cambiare altezza riga"
                          >
                            trascina altezza
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">Riga selezionata</div>
                    {selectedRow ? (
                      <>
                        <label className="text-xs text-zinc-500 mb-1 block">Altezza riga</label>
                        <input
                          type="range"
                          min={80}
                          max={760}
                          step={10}
                          value={Number(selectedRow.height) || 220}
                          onChange={(e) => updateGridRow(selectedRow.id, (row) => ({ ...row, height: e.target.value }))}
                          className="w-full"
                        />
                        <div className="text-xs font-mono text-zinc-400 mt-1 mb-3">{selectedRow.height}px</div>
                        <div className="text-xs text-zinc-500 mb-2">Preset larghezze</div>
                        <div className="grid grid-cols-1 gap-2">
                          {ROW_RATIO_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyRowRatioPreset(preset.weights)}
                              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-left hover:border-blue-400 hover:text-blue-600 transition"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
                          Puoi anche trascinare il bordo inferiore della riga direttamente nel canvas.
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-zinc-400">Seleziona una riga del layout.</div>
                    )}
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-3">Blocco selezionato</div>
                    {selectedCellData ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Etichetta</label>
                          <input
                            value={selectedCellData.label}
                            onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, label: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            placeholder="Nome sezione"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">Tipo blocco</label>
                          <select
                            value={selectedCellData.blockType || ''}
                            onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, blockType: (e.target.value || null) as BlockType | null }))}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          >
                            {BLOCK_TYPE_OPTIONS.map((option) => (
                              <option key={option.label} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Peso larghezza</label>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, colSpan: Math.max(1, cell.colSpan - 1) }))} className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs">-</button>
                              <span className="text-sm font-bold w-8 text-center">{selectedCellData.colSpan}</span>
                              <button onClick={() => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, colSpan: cell.colSpan + 1 }))} className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs">+</button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Allineamento</label>
                            <select
                              value={selectedCellData.align}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, align: e.target.value as GridCell['align'] }))}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            >
                              <option value="start">Sinistra / alto</option>
                              <option value="center">Centro</option>
                              <option value="end">Destra / basso</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Altezza blocco</label>
                            <input
                              type="range"
                              min={80}
                              max={760}
                              step={10}
                              value={selectedCellData.minHeight ?? (Number(selectedRow?.height) || 220)}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, minHeight: Number(e.target.value) }))}
                              className="w-full"
                            />
                            <div className="text-xs font-mono text-zinc-400 mt-1">
                              {selectedCellData.minHeight ?? (Number(selectedRow?.height) || 220)}px
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Padding interno</label>
                            <input
                              type="range"
                              min={0}
                              max={72}
                              step={2}
                              value={selectedCellData.padding}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, padding: Number(e.target.value) }))}
                              className="w-full"
                            />
                            <div className="text-xs font-mono text-zinc-400 mt-1">{selectedCellData.padding}px</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => moveSelectedCell('left')}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-xs font-medium"
                          >
                            <ArrowLeft size={12} /> Sinistra
                          </button>
                          <button
                            type="button"
                            onClick={duplicateSelectedCell}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-xs font-medium"
                          >
                            <Copy size={12} /> Duplica
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSelectedCell('right')}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-xs font-medium"
                          >
                            Destra <ArrowRight size={12} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Offset X</label>
                            <input
                              type="range"
                              min={-220}
                              max={220}
                              step={2}
                              value={selectedCellData.offsetX}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, offsetX: Number(e.target.value) }))}
                              className="w-full"
                            />
                            <div className="text-xs font-mono text-zinc-400 mt-1">{selectedCellData.offsetX}px</div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Offset Y</label>
                            <input
                              type="range"
                              min={-220}
                              max={220}
                              step={2}
                              value={selectedCellData.offsetY}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, offsetY: Number(e.target.value) }))}
                              className="w-full"
                            />
                            <div className="text-xs font-mono text-zinc-400 mt-1">{selectedCellData.offsetY}px</div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Livello</label>
                            <input
                              type="range"
                              min={0}
                              max={20}
                              step={1}
                              value={selectedCellData.zIndex}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, zIndex: Number(e.target.value) }))}
                              className="w-full"
                            />
                            <div className="text-xs font-mono text-zinc-400 mt-1">z-{selectedCellData.zIndex}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Forma</label>
                            <select
                              value={selectedCellData.shape}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, shape: e.target.value as GridCell['shape'] }))}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            >
                              <option value="rect">Rettangolo</option>
                              <option value="diagonal-left">Diagonale sinistra</option>
                              <option value="diagonal-right">Diagonale destra</option>
                              <option value="slant-top">Taglio alto</option>
                              <option value="slant-bottom">Taglio basso</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Colore base</label>
                            <input
                              type="color"
                              value={selectedCellData.color}
                              onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, color: e.target.value }))}
                              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 mb-1 block">CSS custom del blocco</label>
                          <textarea
                            value={selectedCellData.customCss}
                            onChange={(e) => updateGridCell(selectedCellData.id, (cell) => ({ ...cell, customCss: e.target.value }))}
                            rows={4}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                            placeholder="margin-top:-40px;&#10;z-index:4;&#10;border-radius:24px;"
                          />
                        </div>
                        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-[11px] text-zinc-500">
                          Suggerimento: trascina i lati del blocco nel canvas per cambiare misura. Con `Magneti ON` il ridimensionamento si aggancia in step regolari.
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-400">Seleziona un blocco nel canvas layout.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Apply button */}
              <div className="flex justify-end">
                <Button variant="primary" onClick={applyCustomGrid} disabled={applying}>
                  {applying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Applica layout alla pagina
                </Button>
              </div>
            </div>
          )}

          {/* === AI TAB === */}
          {tab === 'ai' && (
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Descrivi il sito che vuoi creare e l&apos;AI genererà il layout completo con tutti i blocchi.
              </p>

              <div className="flex gap-2 mb-6">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSuggest(); } }}
                  placeholder="Es: Homepage per un quotidiano online con breaking news, sezione politica, economia, sport, gallery fotografica e spazio pubblicità..."
                  rows={3}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                />
                <Button variant="primary" onClick={handleAiSuggest} disabled={aiLoading || applying || !aiPrompt.trim()} className="self-end">
                  {aiLoading || applying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Genera
                </Button>
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  'Homepage quotidiano nazionale con breaking news, politica, economia, sport e cultura',
                  'Rivista lifestyle con copertina grande, articoli in griglia, interviste e gallery',
                  'Blog di tecnologia minimalista con articoli lunghi, code snippets e newsletter',
                  'Sito sportivo con risultati live, classifiche, video highlights e calendario partite',
                  'Portale di notizie locali con cronaca, eventi, meteo, annunci e pubblicità',
                  'Magazine di moda con lookbook fotografico, interviste, trend e shopping guide',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setAiPrompt(prompt); }}
                    className="text-left p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
