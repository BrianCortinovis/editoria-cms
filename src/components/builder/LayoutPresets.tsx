'use client';

import { useState } from 'react';
import {
  Plus, Minus, Sparkles, Send, Grid3X3, LayoutGrid, Columns3,
  ArrowRight, Check, X, Loader2, RotateCcw, Shuffle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageStore } from '@/lib/stores/page-store';
import { createBlock, type BlockType, type BlockStyle } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils/cn';
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

interface FeaturedPreset extends LayoutPresetDef {
  columns?: number;
  blocks: PresetBlock[];
}

const LAYOUT_PRESETS: FeaturedPreset[] = [
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
}

interface GridRow {
  id: string;
  cells: GridCell[];
  height: string;
}

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
}

export function LayoutPresets({ open, onClose }: LayoutPresetsProps) {
  const { addBlock, setBlocks } = usePageStore();
  const [tab, setTab] = useState<'presets' | 'custom' | 'ai'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom grid state
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(4);
  const [gridGap, setGridGap] = useState(16);
  const [customGrid, setCustomGrid] = useState<GridRow[]>([]);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<FeaturedPreset[]>([]);

  // Initialize custom grid
  const initGrid = () => {
    const rows: GridRow[] = [];
    for (let r = 0; r < gridRows; r++) {
      const cells: GridCell[] = [];
      for (let c = 0; c < gridCols; c++) {
        cells.push({
          id: `${r}-${c}`,
          colSpan: 1,
          rowSpan: 1,
          label: '',
          color: CELL_COLORS[(r * gridCols + c) % CELL_COLORS.length],
          blockType: null,
        });
      }
      rows.push({ id: `row-${r}`, cells, height: 'auto' });
    }
    setCustomGrid(rows);
  };

  // Apply preset
  const applyPreset = (preset: FeaturedPreset) => {
    const newBlocks = preset.blocks.map((pb) => {
      const def = getBlockDefinition(pb.type);
      if (!def) return null;
      const block = createBlock(
        def.type,
        pb.label || def.label,
        { ...def.defaultProps, ...(pb.props || {}) },
        pb.styleOverrides ? { ...def.defaultStyle, ...pb.styleOverrides } : def.defaultStyle
      );
      // Apply deep style overrides
      if (pb.styleOverrides) {
        if (pb.styleOverrides.background) block.style.background = { ...block.style.background, ...pb.styleOverrides.background };
        if (pb.styleOverrides.typography) block.style.typography = { ...block.style.typography, ...pb.styleOverrides.typography };
        if (pb.styleOverrides.layout) {
          block.style.layout = {
            ...block.style.layout,
            ...pb.styleOverrides.layout,
            padding: pb.styleOverrides.layout.padding
              ? { ...block.style.layout.padding, ...pb.styleOverrides.layout.padding }
              : block.style.layout.padding,
            margin: pb.styleOverrides.layout.margin
              ? { ...block.style.layout.margin, ...pb.styleOverrides.layout.margin }
              : block.style.layout.margin,
          };
        }
      }
      block.id = generateId();
      if (def.defaultDataSource) {
        block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
      }
      return block;
    }).filter(Boolean);

    setBlocks(newBlocks as NonNullable<typeof newBlocks[0]>[]);
    onClose();
  };

  // Apply custom grid as sections with columns
  const applyCustomGrid = () => {
    const blocks = customGrid.map((row) => {
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
        return block;
      } else {
        // Multiple cells = columns container
        const colBlock = createBlock('columns', `Riga ${row.id}`, {
          columnCount: row.cells.length,
          columnWidths: row.cells.map(() => `${100 / row.cells.length}%`),
          gap: `${gridGap}px`,
          stackOnMobile: true,
        });
        colBlock.id = generateId();

        colBlock.children = row.cells.map((cell) => {
          const blockType = cell.blockType || 'section';
          const def = getBlockDefinition(blockType);
          if (!def) return createBlock('section', cell.label || 'Cella', {});
          const child = createBlock(def.type, cell.label || def.label, def.defaultProps, def.defaultStyle);
          child.id = generateId();
          if (def.defaultDataSource) {
            child.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
          }
          child.style.layout.width = `${(100 / row.cells.length) * cell.colSpan}%`;
          return child;
        });

        return colBlock;
      }
    }).filter(Boolean);

    setBlocks(blocks as NonNullable<typeof blocks[0]>[]);
    onClose();
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
          taskType: 'suggest-layout',
          prompt: aiPrompt,
          systemPrompt: `Sei un designer AI. L'utente descrive il sito che vuole. Tu DEVI rispondere con un JSON array di blocchi da creare.

BLOCCHI DISPONIBILI: navigation, hero, text, image-gallery, video, audio, slideshow, carousel, comparison, divider, banner-ad, banner-zone, footer, sidebar, social, author-bio, related-content, newsletter, newsletter-signup, cms-form, timeline, quote, accordion, tabs, table, code, map, counter, custom-html, section, container, columns, article-grid, article-hero, category-nav, event-list, search-bar, breaking-ticker.

FORMATO RISPOSTA (SOLO JSON, nessun testo):
[
  {"action":"add-block","blockType":"navigation","label":"Nome","props":{...},"style":{...}},
  ...altri blocchi...
]

REGOLE:
- Rispondi SOLO con JSON array
- Crea TUTTI i blocchi necessari per una pagina completa
- Personalizza props con contenuti reali e pertinenti alla richiesta
- Usa style overrides per colori e sfondi appropriati
- Includi sempre navigation e footer
- Sii creativo con i contenuti ma pertinente alla richiesta`,
        }),
      });

      const data = await response.json();
      if (data.content) {
        // Parse and execute
        const cleaned = data.content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        try {
          const actions = JSON.parse(cleaned.match(/\[[\s\S]*\]/)?.[0] || cleaned);
          if (Array.isArray(actions)) {
            const blocks = actions.filter((a: { action: string; blockType?: string }) => a.action === 'add-block' && a.blockType).map((a: { blockType: string; label?: string; props?: Record<string, unknown>; style?: Partial<BlockStyle> }) => {
              const def = getBlockDefinition(a.blockType as BlockType);
              if (!def) return null;
              const block = createBlock(def.type, a.label || def.label, { ...def.defaultProps, ...(a.props || {}) }, def.defaultStyle);
              if (a.style) {
                if (a.style.background) block.style.background = { ...block.style.background, ...a.style.background };
                if (a.style.typography) block.style.typography = { ...block.style.typography, ...a.style.typography };
                if (a.style.layout) block.style.layout = { ...block.style.layout, ...a.style.layout, padding: a.style.layout?.padding ? { ...block.style.layout.padding, ...a.style.layout.padding } : block.style.layout.padding, margin: a.style.layout?.margin ? { ...block.style.layout.margin, ...a.style.layout.margin } : block.style.layout.margin };
              }
              block.id = generateId();
              if (def.defaultDataSource) {
                block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
              }
              return block;
            }).filter(Boolean);

            if (blocks.length > 0) {
              setBlocks(blocks as NonNullable<typeof blocks[0]>[]);
              onClose();
              return;
            }
          }
        } catch { /* parse error */ }
      }
      // If parsing failed, show error
      alert('L\'AI non ha generato un layout valido. Riprova con una descrizione più dettagliata.');
    } catch {
      alert('Errore di connessione con l\'AI.');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply a config preset by generating sections from the row structure
  const applyGridPreset = (preset: LayoutPresetDef) => {
    const blocks = preset.rows.map((row, ri) => {
      const [height, ...cols] = row;
      const heightPx = `${(height as number) * 5}px`; // Scale factor

      if (cols.length === 1) {
        const section = createBlock('section', `Sezione ${ri + 1}`, { tag: 'section', fullWidth: true });
        section.id = generateId();
        section.style.layout.minHeight = heightPx;
        if (ri === 0) {
          section.style.background = { type: 'color', value: '#1a1a2e', overlay: '', parallax: false, size: 'cover', position: 'center', repeat: 'no-repeat' };
          section.style.typography.color = '#ffffff';
          section.style.layout.padding = { top: '16px', right: '32px', bottom: '16px', left: '32px' };
        } else if (ri === preset.rows.length - 1) {
          section.style.background = { type: 'color', value: '#111827', overlay: '', parallax: false, size: 'cover', position: 'center', repeat: 'no-repeat' };
          section.style.typography.color = '#cccccc';
          section.style.layout.padding = { top: '32px', right: '32px', bottom: '32px', left: '32px' };
        }
        return section;
      } else {
        const colBlock = createBlock('columns', `Riga ${ri + 1}`, {
          columnCount: cols.length,
          columnWidths: cols,
          gap: '16px',
          stackOnMobile: true,
        });
        colBlock.id = generateId();
        colBlock.style.layout.minHeight = heightPx;
        colBlock.children = cols.map((width, ci) => {
          const child = createBlock('section', `Cella R${ri + 1}C${ci + 1}`, {});
          child.id = generateId();
          child.style.layout.width = width as string;
          child.style.layout.minHeight = heightPx;
          child.style.background = { type: 'color', value: '#f8fafc', overlay: '', parallax: false, size: 'cover', position: 'center', repeat: 'no-repeat' };
          child.style.border = { width: '1px', style: 'dashed', color: '#e2e8f0', radius: '8px' };
          return child;
        });
        return colBlock;
      }
    });

    setBlocks(blocks);
    onClose();
  };

  const categories = [
    { id: 'all', label: 'Tutti' },
    { id: '2-colonne', label: '2 Colonne' },
    { id: '3-colonne', label: '3 Colonne' },
    { id: '4-colonne', label: '4 Colonne' },
    { id: 'editorial', label: 'Editoriale' },
    { id: 'news', label: 'News/TG' },
    { id: 'magazine', label: 'Magazine' },
    { id: 'blog', label: 'Blog' },
    { id: 'landing', label: 'Landing' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'creative', label: 'Creativo' },
    { id: 'minimal', label: 'Minimale' },
    { id: 'fantasy', label: 'Fantasy' },
  ];

  // Merge featured presets (with blocks) and config presets (grid only)
  const allPresets = [
    ...LAYOUT_PRESETS.map(p => ({ ...p, _featured: true as const })),
    ...CONFIG_PRESETS.map(p => ({ ...p, _featured: false as const })),
  ];

  const filteredPresets = selectedCategory === 'all'
    ? allPresets
    : allPresets.filter(p => p.category === selectedCategory);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Layout & Template</h2>
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
                  // Use rows for config presets
                  const rows = 'rows' in preset ? (preset as LayoutPresetDef).rows : null;
                  const maxCols = rows
                    ? Math.max(...rows.map(r => r.length - 1))
                    : 1;
                  // Calculate total height for proportional rendering
                  const totalHeight = rows
                    ? rows.reduce((sum, r) => sum + (r[0] as number), 0)
                    : 100;

                  return (
                    <div
                      key={preset.id}
                      className="group border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        if (isFeatured) applyPreset(preset as unknown as FeaturedPreset);
                        else if (rows) applyGridPreset(preset as LayoutPresetDef);
                      }}
                    >
                      {/* Thumbnail: SVG or proportional grid */}
                      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/80 h-36 flex flex-col gap-[2px]">
                        {/* SVG thumbnail */}
                        {'svg' in preset && (preset as LayoutPresetDef).svg ? (
                          <div
                            className="w-full h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:rounded group-hover:[&_polygon]:fill-blue-400 group-hover:[&_rect:not(:first-child):not(:last-child)]:fill-blue-300 group-hover:[&_path]:fill-blue-400 group-hover:[&_circle]:fill-blue-400 group-hover:[&_ellipse]:fill-blue-400 transition-all"
                            dangerouslySetInnerHTML={{ __html: (preset as LayoutPresetDef).svg || '' }}
                          />
                        ) : rows ? rows.map((row, ri) => {
                          const [height, ...cols] = row;
                          const heightPercent = ((height as number) / totalHeight) * 100;
                          const isHeader = ri === 0;
                          const isFooter = ri === rows.length - 1;

                          return (
                            <div
                              key={ri}
                              className="flex gap-[2px] shrink-0"
                              style={{ height: `${heightPercent}%`, minHeight: 3 }}
                            >
                              {cols.map((width, ci) => (
                                <div
                                  key={ci}
                                  className={cn(
                                    'rounded-[2px] transition-colors',
                                    isHeader
                                      ? 'bg-zinc-500 dark:bg-zinc-500 group-hover:bg-blue-600'
                                      : isFooter
                                        ? 'bg-zinc-400 dark:bg-zinc-500 group-hover:bg-blue-500'
                                        : cols.length === 1
                                          ? 'bg-zinc-300 dark:bg-zinc-600 group-hover:bg-blue-400'
                                          : 'bg-zinc-250 dark:bg-zinc-650 group-hover:bg-blue-300 dark:group-hover:bg-blue-500',
                                    // Slightly different shade for variety
                                    !isHeader && !isFooter && ci % 2 === 1 && 'opacity-80'
                                  )}
                                  style={{
                                    width: width as string,
                                    minWidth: 4,
                                    backgroundColor: isHeader ? undefined : isFooter ? undefined : undefined,
                                  }}
                                />
                              ))}
                            </div>
                          );
                        }) : (
                          /* Fallback */
                          <div className="flex-1 bg-zinc-300 dark:bg-zinc-600 rounded" />
                        )}
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
              {/* Controls */}
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Colonne:</span>
                  <button onClick={() => setGridCols(Math.max(1, gridCols - 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Minus size={14} /></button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">{gridCols}</span>
                  <button onClick={() => setGridCols(Math.min(12, gridCols + 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Plus size={14} /></button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Righe:</span>
                  <button onClick={() => setGridRows(Math.max(1, gridRows - 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Minus size={14} /></button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 w-8 text-center">{gridRows}</span>
                  <button onClick={() => setGridRows(Math.min(20, gridRows + 1))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"><Plus size={14} /></button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Gap:</span>
                  <input
                    type="range" min={0} max={48} value={gridGap}
                    onChange={(e) => setGridGap(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-xs font-mono text-zinc-400">{gridGap}px</span>
                </div>

                <button onClick={initGrid} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  <RotateCcw size={12} /> Rigenera
                </button>
                <button onClick={() => { setGridCols(Math.floor(Math.random() * 4) + 1); setGridRows(Math.floor(Math.random() * 6) + 3); setTimeout(initGrid, 50); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  <Shuffle size={12} /> Random
                </button>
              </div>

              {/* Grid preview */}
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800 mb-4">
                <div className="space-y-1" style={{ gap: gridGap }}>
                  {customGrid.map((row, ri) => (
                    <div key={row.id} className="flex" style={{ gap: gridGap }}>
                      {row.cells.map((cell, ci) => (
                        <button
                          key={cell.id}
                          onClick={() => setSelectedCell(cell.id)}
                          className={cn(
                            'h-16 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80',
                            selectedCell === cell.id && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-800'
                          )}
                          style={{
                            backgroundColor: cell.color,
                            flex: cell.colSpan,
                          }}
                        >
                          {cell.label || cell.blockType || `R${ri + 1}C${ci + 1}`}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cell editor */}
              {selectedCell && (() => {
                const row = customGrid.find(r => r.cells.some(c => c.id === selectedCell));
                const cell = row?.cells.find(c => c.id === selectedCell);
                if (!cell) return null;

                return (
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 mb-4">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-3">Configura cella: {cell.id}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Etichetta</label>
                        <input
                          value={cell.label}
                          onChange={(e) => {
                            setCustomGrid(customGrid.map(r => ({
                              ...r,
                              cells: r.cells.map(c => c.id === selectedCell ? { ...c, label: e.target.value } : c)
                            })));
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          placeholder="Nome sezione"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Tipo blocco</label>
                        <select
                          value={cell.blockType || ''}
                          onChange={(e) => {
                            setCustomGrid(customGrid.map(r => ({
                              ...r,
                              cells: r.cells.map(c => c.id === selectedCell ? { ...c, blockType: (e.target.value || null) as BlockType | null } : c)
                            })));
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        >
                          <option value="">Sezione vuota</option>
                          <option value="hero">Hero</option>
                          <option value="text">Testo</option>
                          <option value="image-gallery">Galleria</option>
                          <option value="video">Video</option>
                          <option value="banner-ad">Banner ADV</option>
                          <option value="navigation">Navigazione</option>
                          <option value="footer">Footer</option>
                          <option value="sidebar">Sidebar</option>
                          <option value="quote">Citazione</option>
                          <option value="newsletter">Newsletter</option>
                          <option value="counter">Contatori</option>
                          <option value="slideshow">Slideshow</option>
                          <option value="related-content">Contenuti correlati</option>
                          <option value="accordion">Accordion</option>
                          <option value="timeline">Timeline</option>
                          <option value="social">Social</option>
                          <option value="author-bio">Bio autore</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Span colonne</label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCustomGrid(customGrid.map(r => ({ ...r, cells: r.cells.map(c => c.id === selectedCell ? { ...c, colSpan: Math.max(1, c.colSpan - 1) } : c) })))} className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs">-</button>
                          <span className="text-sm font-bold w-6 text-center">{cell.colSpan}</span>
                          <button onClick={() => setCustomGrid(customGrid.map(r => ({ ...r, cells: r.cells.map(c => c.id === selectedCell ? { ...c, colSpan: c.colSpan + 1 } : c) })))} className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Apply button */}
              <div className="flex justify-end">
                <Button variant="primary" onClick={applyCustomGrid}>
                  <Check size={16} />
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
                <Button variant="primary" onClick={handleAiSuggest} disabled={aiLoading || !aiPrompt.trim()} className="self-end">
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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
