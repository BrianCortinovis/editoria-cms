'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isFillableFieldElement, useFieldContextStore } from '@/lib/stores/field-context-store';
import type { SelectedField } from '@/lib/stores/field-context-store';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { X, Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIMessage } from '@/lib/ai/providers';
import type { AICommand } from '@/lib/ai/command-parser';
import { parseAICommand } from '@/lib/ai/command-parser';
import { detectContextFromText, parseNaturalLanguage } from '@/lib/ai/natural-language-executor';
import { buildCssGradient } from '@/lib/shapes/gradients';
import type { AdvancedGradient, AnimationEffect, Block, BlockAnimation, BlockEffects, BlockShape, BlockType, DividerConfig, DividerShape } from '@/lib/types';
import { createBlock } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import toast from 'react-hot-toast';
import '@/lib/blocks/init';

interface AiAction {
  action: string;
  blockType?: string;
  blockId?: string;
  targetBlockId?: string;
  position?: 'inside' | 'after' | 'before';
  label?: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  shape?: BlockShape | null;
  text?: string;
  theme?: 'dark' | 'light';
  device?: 'desktop' | 'tablet' | 'mobile';
  zoom?: number;
  direction?: 'up' | 'down';
  panel?: 'left' | 'right' | 'ai';
  children?: AiAction[];
}

const GENERIC_EDITOR_ACTIONS = new Set([
  'add-block',
  'remove-block',
  'duplicate-block',
  'update-block-props',
  'update-block-style',
  'update-block-shape',
  'move-block',
  'rename-block',
  'toggle-visibility',
  'toggle-lock',
  'clear-all',
  'select-block',
  'set-theme',
  'set-device',
  'set-zoom',
  'toggle-grid',
  'toggle-outlines',
  'open-panel',
  'convert-block',
  'undo',
  'redo',
  'message',
]);

const BOOLEAN_FIELD_TYPES = new Set(['checkbox', 'switch']);

const BLOCK_TYPE_ALIASES: Record<string, BlockType> = {
  header: 'navigation',
  topbar: 'navigation',
  navbar: 'navigation',
  'nav-bar': 'navigation',
  'menu-bar': 'navigation',
  menu: 'navigation',
  masthead: 'navigation',
  footer: 'footer',
  hero: 'hero',
  lead: 'article-hero',
  'lead-story': 'article-hero',
  'main-story': 'article-hero',
  'main-news': 'article-hero',
  'notizia-principale': 'article-hero',
  'article-hero': 'article-hero',
  'article-grid': 'article-grid',
  'news-grid': 'article-grid',
  'news-column': 'article-grid',
  'story-column': 'article-grid',
  sidebar: 'sidebar',
  'side-news': 'sidebar',
  'search-bar': 'search-bar',
  ticker: 'breaking-ticker',
  'breaking-news': 'breaking-ticker',
  'breaking-ticker': 'breaking-ticker',
  form: 'cms-form',
  'newsletter-form': 'newsletter-signup',
  adv: 'banner-ad',
  ad: 'banner-ad',
  advertisement: 'banner-ad',
  'banner-zone': 'banner-zone',
};

function parseAiResponse(content: string): AiAction[] | null {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((item) => item?.action && GENERIC_EDITOR_ACTIONS.has(item.action));
      return filtered.length > 0 ? filtered : null;
    }
    if (parsed.action && GENERIC_EDITOR_ACTIONS.has(parsed.action)) return [parsed];
    return null;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item) => item?.action && GENERIC_EDITOR_ACTIONS.has(item.action));
          return filtered.length > 0 ? filtered : null;
        }
      } catch { }
    }

    const objMatch = cleaned.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0]);
        if (parsed.action && GENERIC_EDITOR_ACTIONS.has(parsed.action)) return [parsed];
      } catch { }
    }

    return null;
  }
}

function sanitizeFieldResponse(content: string) {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```[\w-]*\s*/i, '').replace(/\s*```$/i, '').trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"'))
    || (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

function formatFieldOptions(
  options: Array<{ value: string; label: string }> | undefined
) {
  if (!options || options.length === 0) {
    return 'Nessuna opzione esplicita disponibile';
  }

  return options
    .map((option) => `- value="${option.value}" | label="${option.label}"`)
    .join('\n');
}

function normalizeLooseMatch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s:/._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveDirectFieldValue(field: SelectedField, prompt: string) {
  const normalizedPrompt = normalizeLooseMatch(prompt);

  if (field.type === 'select' || field.type === 'radio') {
    const match = field.options?.find((option) => {
      const optionValue = normalizeLooseMatch(option.value);
      const optionLabel = normalizeLooseMatch(option.label);
      return normalizedPrompt === optionValue
        || normalizedPrompt === optionLabel
        || normalizedPrompt.includes(optionValue)
        || normalizedPrompt.includes(optionLabel);
    });

    if (match) {
      return match.value;
    }
  }

  if (BOOLEAN_FIELD_TYPES.has(field.type)) {
    if (/(^|\b)(true|on|attivo|abilita|abilitato|si|sì|yes)(\b|$)/i.test(prompt)) {
      return 'true';
    }
    if (/(^|\b)(false|off|disattivo|disabilita|disabilitato|no)(\b|$)/i.test(prompt)) {
      return 'false';
    }
  }

  if (field.type === 'number') {
    const numberMatch = prompt.match(/-?\d+(?:[.,]\d+)?/);
    if (numberMatch) {
      return numberMatch[0].replace(',', '.');
    }
  }

  if (field.type === 'email') {
    const emailMatch = prompt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) {
      return emailMatch[0];
    }
  }

  if (field.type === 'url') {
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      return urlMatch[0];
    }
  }

  return null;
}

function buildPageState(blocks: Block[], selectedBlockId?: string | null): string {
  if (blocks.length === 0) {
    return "PAGINA VUOTA - nessun blocco presente. L'utente probabilmente vuole creare un layout da zero.";
  }

  const lines: string[] = [];

  const walk = (items: Block[], depth = 0) => {
    for (const block of items) {
      const propsPreview = Object.entries(block.props || {})
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .slice(0, 6)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');

      const markers = [
        block.id === selectedBlockId ? 'SELEZIONATO' : null,
        block.hidden ? 'nascosto' : null,
        block.locked ? 'bloccato' : null,
      ].filter(Boolean).join(', ');

      lines.push(
        `${'  '.repeat(depth)}- [${block.type}] id="${block.id}" label="${block.label}"` +
        (propsPreview ? ` | ${propsPreview}` : '') +
        (markers ? ` | ${markers}` : '')
      );

      if (block.children.length > 0) {
        walk(block.children, depth + 1);
      }
    }
  };

  walk(blocks);
  return lines.join('\n');
}

function findBlockLocation(blocks: Block[], targetId: string, parentId: string | null = null): { parentId: string | null; index: number } | null {
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.id === targetId) {
      return { parentId, index };
    }

    if (block.children.length > 0) {
      const nested = findBlockLocation(block.children, targetId, block.id);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function buildSmartEditorPrompt(blocks: Block[], selectedBlock: Block | null, userPrompt: string): string {
  const selectedBlockDetail = selectedBlock
    ? `Props: ${JSON.stringify(Object.fromEntries(Object.entries(selectedBlock.props).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).slice(0, 6)), null, 0)}`
    : '';

  const focusSection = selectedBlock
    ? `# BLOCCO SELEZIONATO (FOCUS)
L'utente ha selezionato: [${selectedBlock.type}] id="${selectedBlock.id}" label="${selectedBlock.label}"
${selectedBlockDetail}

REGOLE:
1. Se l'utente chiede di cambiare questo blocco, lavora prima su questo blocco.
2. Se chiede di aggiungere dentro questa sezione, puoi usare "add-block" con "position":"inside" oppure "convert-block" se sta trasformando il blocco.
3. Se chiede di aggiungere prima o dopo, usa "targetBlockId":"${selectedBlock.id}" e "position":"before|after".`
    : `# NESSUN BLOCCO SELEZIONATO
L'utente non ha selezionato un blocco specifico. L'IA puo costruire o modificare l'intera pagina.`;

  return `Sei un AGENTE OPERATIVO del builder CMS. Non descrivi, esegui azioni.
Rispondi SEMPRE e SOLO con un JSON array di azioni, oppure con un oggetto JSON singolo per i tool specializzati del blocco.

${focusSection}

# STATO PAGINA
${buildPageState(blocks, selectedBlock?.id)}

# AZIONI DISPONIBILI
- add-block
- remove-block
- duplicate-block
- update-block-props
- update-block-style
- update-block-shape
- move-block
- rename-block
- toggle-visibility
- toggle-lock
- clear-all
- select-block
- set-theme
- set-device
- set-zoom
- toggle-grid
- toggle-outlines
- open-panel
- convert-block
- undo
- redo
- message

# REGOLE OUTPUT
- Nessun markdown
- Nessun testo fuori dal JSON
- Se l'utente chiede un layout, crea piu blocchi reali del builder
- Se serve una griglia giornalistica, usa "columns" con "children"
- Per header/menu/topbar usa "navigation"
- Per notizia principale usa "article-hero"
- Per colonne di notizie usa "article-grid" o "sidebar"

# FORMATO add-block
{
  "action": "add-block",
  "blockType": "navigation|footer|hero|article-hero|article-grid|section|text|columns|container|image-gallery|video|audio|slideshow|carousel|comparison|quote|accordion|tabs|table|code|map|counter|timeline|newsletter|newsletter-signup|social|author-bio|related-content|sidebar|custom-html|divider|search-bar|breaking-ticker|banner-ad|banner-zone|cms-form",
  "label": "Nome descrittivo",
  "targetBlockId": "opzionale",
  "position": "before|after|inside",
  "props": {},
  "style": {},
  "children": []
}

# ESEMPIO layout a 3 colonne
[
  {
    "action": "add-block",
    "blockType": "columns",
    "label": "Fascia principale",
    "props": { "columnCount": 3, "columnWidths": ["24%", "52%", "24%"], "gap": "24px", "stackOnMobile": true },
    "children": [
      { "action": "add-block", "blockType": "article-grid", "label": "Colonna sinistra", "props": { "columns": 1, "limit": 4 } },
      { "action": "add-block", "blockType": "article-hero", "label": "Notizia centrale" },
      { "action": "add-block", "blockType": "article-grid", "label": "Colonna destra", "props": { "columns": 1, "limit": 4 } }
    ]
  }
]

# RICHIESTA UTENTE
${userPrompt}`;
}

function inferDividerGradientDirection(angle?: number): 'vertical' | 'horizontal' | 'diagonal' {
  if (angle === undefined) {
    return 'vertical';
  }

  const normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle === 0 || normalizedAngle === 180) {
    return 'horizontal';
  }
  if (normalizedAngle === 90 || normalizedAngle === 270) {
    return 'vertical';
  }

  return 'diagonal';
}

function resolveStructuredBuilderCommand(content: string, userPrompt: string): AICommand | null {
  const parsedCommand = parseAICommand(content);
  if (parsedCommand) {
    return parsedCommand;
  }

  const detectedContext = detectContextFromText(userPrompt) || detectContextFromText(content);
  if (!detectedContext) {
    return null;
  }

  const parsedNaturalLanguage = parseNaturalLanguage(userPrompt, detectedContext);
  return parsedNaturalLanguage.success ? parsedNaturalLanguage.command ?? null : null;
}

function normalizeBlockType(rawType: string | undefined, label?: string): BlockType | null {
  if (!rawType && !label) {
    return null;
  }

  const candidates = [rawType, label]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-'));

  for (const candidate of candidates) {
    const direct = getBlockDefinition(candidate as BlockType);
    if (direct) {
      return candidate as BlockType;
    }

    const alias = BLOCK_TYPE_ALIASES[candidate];
    if (alias) {
      return alias;
    }
  }

  return null;
}

function mergeAiBlockStyle(block: Block, style?: Record<string, unknown>) {
  if (!style) {
    return;
  }

  if (style.background && typeof style.background === 'object') {
    block.style.background = { ...block.style.background, ...style.background };
  }
  if (style.typography && typeof style.typography === 'object') {
    block.style.typography = { ...block.style.typography, ...style.typography };
  }
  if (style.layout && typeof style.layout === 'object') {
    block.style.layout = { ...block.style.layout, ...style.layout };
  }
  if (style.border && typeof style.border === 'object') {
    block.style.border = { ...block.style.border, ...style.border };
  }
}

function buildBlockTreeFromAction(action: AiAction): { block: Block | null; error?: string } {
  const normalizedType = normalizeBlockType(action.blockType, action.label);
  if (!normalizedType) {
    return { block: null, error: `Blocco "${action.blockType || action.label || 'sconosciuto'}" non trovato` };
  }

  const def = getBlockDefinition(normalizedType);
  if (!def) {
    return { block: null, error: `Blocco "${normalizedType}" non trovato` };
  }

  const mergedProps = { ...def.defaultProps, ...(action.props || {}) };
  const block = createBlock(def.type, action.label || def.label, mergedProps, def.defaultStyle);
  block.id = generateId();
  block.shape = action.shape ?? block.shape;
  mergeAiBlockStyle(block, action.style);

  if (def.defaultDataSource) {
    block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
  }

  const childActions = Array.isArray(action.children) ? action.children : [];
  const builtChildren = childActions
    .map(buildBlockTreeFromAction)
    .filter((entry): entry is { block: Block } => Boolean(entry.block));

  if (builtChildren.length > 0) {
    block.children = builtChildren.map((entry) => entry.block);
  } else if (block.type === 'columns') {
    const columnWidths = Array.isArray(block.props.columnWidths) ? block.props.columnWidths : [];
    const columnCount = Number(block.props.columnCount || columnWidths.length || 2);
    block.children = Array.from({ length: Math.max(1, columnCount) }).map((_, index) => {
      const child = createBlock('section', `Colonna ${index + 1}`, { tag: 'section' });
      child.id = generateId();
      child.style.layout = {
        ...child.style.layout,
        minHeight: '180px',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
      };
      child.style.border = {
        ...child.style.border,
        width: '1px',
        style: 'dashed',
        color: 'rgba(148,163,184,0.35)',
      };
      return child;
    });
  }

  return { block };
}

export function GlobalAiChat() {
  const { currentTenant } = useAuthStore();
  const {
    selectedField,
    pageContext,
    captureFieldElement,
    syncFieldElement,
    applyValueToSelectedField,
    hasSelectedFieldTarget,
    clearSelection,
  } = useFieldContextStore();
  const pageStore = usePageStore();
  const {
    addBlock,
    blocks,
    selectedBlockId,
    selectBlock,
    replacePage,
    removeBlock,
    updateBlock,
    updateBlockProps,
    updateBlockShape,
    updateBlockStyle,
    duplicateBlock,
    moveBlock,
    undo,
    redo,
    getBlock,
  } = pageStore;
  const {
    setDeviceMode,
    setTheme,
    setZoom,
    toggleGrid,
    toggleOutlines,
    setLeftPanelOpen,
    setRightPanelOpen,
  } = useUiStore();
  const selectedBlock = selectedBlockId ? getBlock(selectedBlockId) : null;
  const pathname = usePathname();

  // Check if we're in an editor context (has page store)
  const isEditorContext = !!pageStore && blocks !== undefined;

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: `Ciao! Sono il tuo assistente IA. Puoi chiedermi di generare contenuti, fare domande, o ricevere aiuto con il CMS.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpen = () => setExpanded(true);
    window.addEventListener('editoria:open-global-ai-chat', handleOpen);
    return () => window.removeEventListener('editoria:open-global-ai-chat', handleOpen);
  }, []);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (isFillableFieldElement(event.target)) {
        captureFieldElement(event.target);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (isFillableFieldElement(event.target)) {
        captureFieldElement(event.target);
      }
    };

    const handleFieldChange = (event: Event) => {
      if (isFillableFieldElement(event.target)) {
        syncFieldElement(event.target);
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleFieldChange, true);
    document.addEventListener('change', handleFieldChange, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('input', handleFieldChange, true);
      document.removeEventListener('change', handleFieldChange, true);
    };
  }, [captureFieldElement, syncFieldElement]);

  useEffect(() => {
    if (selectedField && !hasSelectedFieldTarget()) {
      clearSelection();
    }
  }, [pathname, selectedField, hasSelectedFieldTarget, clearSelection]);

  useEffect(() => {
    if (selectedField) {
      const contextMsg = `
Campo selezionato: ${selectedField.label || selectedField.name}
Valore attuale: "${selectedField.value}"
${
  pageContext.allFields && Object.keys(pageContext.allFields).length > 0
    ? `\nContesto della pagina:\n${Object.entries(pageContext.allFields)
      .slice(0, 5)
      .map(([k, v]) => `- ${k}: "${v}"`)
      .join('\n')}`
    : ''
}

Sono pronto ad aiutarti a generare contenuto per questo campo!`;

      setMessages((prev) => {
        if (prev.length > 1 && prev[prev.length - 1].role === 'user') {
          return prev;
        }

        const nextMessages: AIMessage[] = [
          prev[0],
          { role: 'assistant', content: contextMsg },
        ];

        if (
          prev.length === nextMessages.length
          && prev[1]?.role === 'assistant'
          && prev[1]?.content === contextMsg
        ) {
          return prev;
        }

        return nextMessages;
      });
    }
  }, [selectedField, pageContext]);

  const executeActions = (actions: AiAction[]): string[] => {
    const results: string[] = [];

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'add-block': {
            const { block, error } = buildBlockTreeFromAction(action);
            if (!block) {
              results.push(`✗ ${error || 'Blocco non valido'}`);
              break;
            }

            const targetId = action.targetBlockId || selectedBlockId;
            const pos = action.position || 'after';

            if (targetId && pos === 'inside') {
              addBlock(block, targetId);
            } else if (targetId) {
              const location = findBlockLocation(usePageStore.getState().blocks, targetId);
              if (location) {
                const insertIndex = pos === 'before' ? location.index : location.index + 1;
                addBlock(block, location.parentId, insertIndex);
              } else {
                addBlock(block);
              }
            } else {
              addBlock(block);
            }
            results.push(`+ ${action.label || block.label}`);
            break;
          }
          case 'remove-block': {
            if (!action.blockId) {
              results.push('✗ blockId mancante');
              break;
            }
            removeBlock(action.blockId);
            results.push(`- Rimosso blocco`);
            break;
          }
          case 'duplicate-block': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) break;
            duplicateBlock(targetId);
            results.push('+ Duplicato blocco');
            break;
          }
          case 'update-block-props': {
            if (!action.blockId || !action.props) break;
            updateBlockProps(action.blockId, action.props);
            results.push(`~ Aggiornate proprietà`);
            break;
          }
          case 'update-block-style': {
            if (!action.blockId || !action.style) break;
            updateBlockStyle(action.blockId, action.style);
            results.push(`~ Aggiornato stile`);
            break;
          }
          case 'update-block-shape': {
            if (!action.blockId) break;
            updateBlockShape(action.blockId, action.shape ?? null);
            results.push('~ Aggiornata forma');
            break;
          }
          case 'move-block': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId || !action.direction) break;
            const location = findBlockLocation(usePageStore.getState().blocks, targetId);
            if (!location) break;
            const delta = action.direction === 'up' ? -1 : 1;
            const nextIndex = Math.max(0, location.index + delta);
            moveBlock(targetId, location.parentId, nextIndex);
            results.push(`↕ Spostato ${action.direction === 'up' ? 'su' : 'giu'}`);
            break;
          }
          case 'rename-block': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId || !action.label) break;
            updateBlock(targetId, { label: action.label });
            results.push(`~ Rinominato in "${action.label}"`);
            break;
          }
          case 'toggle-visibility': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) break;
            const block = getBlock(targetId);
            if (!block) break;
            updateBlock(targetId, { hidden: !block.hidden });
            results.push(block.hidden ? '👁 Mostrato' : '👁 Nascosto');
            break;
          }
          case 'toggle-lock': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) break;
            const block = getBlock(targetId);
            if (!block) break;
            updateBlock(targetId, { locked: !block.locked });
            results.push(block.locked ? '🔓 Sbloccato' : '🔒 Bloccato');
            break;
          }
          case 'clear-all': {
            replacePage([], {});
            results.push('🗑 Pagina svuotata');
            break;
          }
          case 'select-block': {
            selectBlock(action.blockId || null);
            results.push(action.blockId ? '✓ Blocco selezionato' : '✓ Selezione rimossa');
            break;
          }
          case 'set-theme': {
            if (action.theme === 'dark' || action.theme === 'light') {
              setTheme(action.theme);
              results.push(`🎨 Tema ${action.theme}`);
            }
            break;
          }
          case 'set-device': {
            const nextDevice = action.device || action.text;
            if (nextDevice === 'desktop' || nextDevice === 'tablet' || nextDevice === 'mobile') {
              setDeviceMode(nextDevice);
              results.push(`📱 Device: ${nextDevice}`);
            }
            break;
          }
          case 'set-zoom': {
            if (typeof action.zoom === 'number') {
              setZoom(action.zoom);
              results.push(`🔍 Zoom ${Math.round(action.zoom * 100)}%`);
            }
            break;
          }
          case 'toggle-grid': {
            toggleGrid();
            results.push('▦ Griglia aggiornata');
            break;
          }
          case 'toggle-outlines': {
            toggleOutlines();
            results.push('▣ Contorni aggiornati');
            break;
          }
          case 'open-panel': {
            if (action.panel === 'left') setLeftPanelOpen(true);
            if (action.panel === 'right') setRightPanelOpen(true);
            if (action.panel === 'ai') setExpanded(true);
            results.push(`⇢ Pannello ${action.panel || 'richiesto'} aperto`);
            break;
          }
          case 'convert-block': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) break;
            const { block, error } = buildBlockTreeFromAction(action);
            if (!block) {
              results.push(`✗ ${error || 'Conversione non valida'}`);
              break;
            }
            const location = findBlockLocation(usePageStore.getState().blocks, targetId);
            if (!location) break;
            addBlock(block, location.parentId, location.index);
            removeBlock(targetId);
            results.push(`~ Convertito in ${block.label}`);
            break;
          }
          case 'undo': {
            undo();
            results.push('↩ Annullato');
            break;
          }
          case 'redo': {
            redo();
            results.push('↪ Ripristinato');
            break;
          }
          case 'message': {
            if (action.text) {
              results.push(action.text);
            }
            break;
          }
          default:
            results.push(`? Azione sconosciuta: ${action.action}`);
        }
      } catch (err) {
        results.push(`✗ Errore: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    return results;
  };

  const executeBuilderCommand = (command: AICommand): string => {
    if (!selectedBlockId || !selectedBlock) {
      return '✗ Seleziona un blocco prima di usare i tool IA del builder';
    }

    switch (command.action) {
      case 'updateDivider': {
        const existingDivider = command.position === 'top'
          ? selectedBlock.shape?.topDivider
          : selectedBlock.shape?.bottomDivider;
        const gradientStops = command.gradient?.stops || [];
        const nextDivider: DividerConfig = {
          shape: (command.shape as DividerShape) || existingDivider?.shape || 'wave',
          height: command.height ?? existingDivider?.height ?? 80,
          flip: command.flip ?? existingDivider?.flip ?? false,
          invert: existingDivider?.invert ?? false,
          color: gradientStops[0]?.color || existingDivider?.color || '#ffffff',
          opacity: command.opacity ?? existingDivider?.opacity,
          blendWithSection: existingDivider?.blendWithSection,
          blendColor: command.blendColor ?? existingDivider?.blendColor,
          gradient: command.gradient
            ? {
              enabled: true,
              colorStart: gradientStops[0]?.color || existingDivider?.color || '#ffffff',
              colorEnd: gradientStops[gradientStops.length - 1]?.color || 'transparent',
              direction: inferDividerGradientDirection(command.gradient.angle),
            }
            : existingDivider?.gradient,
        };

        updateBlockShape(selectedBlock.id, {
          type: selectedBlock.shape?.type || 'clip-path',
          value: selectedBlock.shape?.value || 'none',
          topDivider: command.position === 'top' ? nextDivider : selectedBlock.shape?.topDivider,
          bottomDivider: command.position === 'bottom' ? nextDivider : selectedBlock.shape?.bottomDivider,
        });

        return `~ Aggiornato divisore ${command.position === 'top' ? 'superiore' : 'inferiore'}`;
      }

      case 'updateGradient': {
        const currentGradient: AdvancedGradient = selectedBlock.style.background.advancedGradient || {
          type: 'linear',
          angle: 90,
          stops: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
          ],
        };

        const nextGradient: AdvancedGradient = {
          ...currentGradient,
          ...command,
          stops: command.stops?.length ? command.stops : currentGradient.stops,
        };

        updateBlockStyle(selectedBlock.id, {
          background: {
            ...selectedBlock.style.background,
            type: 'gradient',
            value: buildCssGradient(nextGradient),
            advancedGradient: nextGradient,
          },
        });

        return '~ Aggiornato gradiente avanzato';
      }

      case 'updateEffects': {
        const currentEffects: BlockEffects = selectedBlock.style.effects || {};
        const commandEffects = command as AICommand & {
          glassmorphism?: {
            blur?: number;
            saturation?: number;
            opacity?: number;
            bgOpacity?: number;
            bgColor?: string;
            borderOpacity?: number;
          };
          noise?: {
            type?: 'fractalNoise' | 'turbulence';
            opacity?: number;
            frequency?: number;
          };
          grain?: {
            opacity?: number;
            size?: number;
          };
          parallax?: boolean;
        };

        updateBlockStyle(selectedBlock.id, {
          effects: {
            ...currentEffects,
            glassmorphism: commandEffects.glassmorphism
              ? {
                enabled: true,
                blur: commandEffects.glassmorphism.blur ?? currentEffects.glassmorphism?.blur ?? 10,
                saturation: commandEffects.glassmorphism.saturation ?? currentEffects.glassmorphism?.saturation ?? 100,
                bgOpacity: commandEffects.glassmorphism.bgOpacity ?? commandEffects.glassmorphism.opacity ?? currentEffects.glassmorphism?.bgOpacity ?? 0.1,
                bgColor: commandEffects.glassmorphism.bgColor ?? currentEffects.glassmorphism?.bgColor ?? '#ffffff',
                borderOpacity: commandEffects.glassmorphism.borderOpacity ?? currentEffects.glassmorphism?.borderOpacity ?? 0.2,
              }
              : currentEffects.glassmorphism,
            noise: commandEffects.noise
              ? {
                enabled: true,
                type: commandEffects.noise.type ?? currentEffects.noise?.type ?? 'fractalNoise',
                opacity: commandEffects.noise.opacity ?? currentEffects.noise?.opacity ?? 0.1,
                frequency: commandEffects.noise.frequency ?? currentEffects.noise?.frequency ?? 1,
              }
              : currentEffects.noise,
            grain: commandEffects.grain
              ? {
                enabled: true,
                opacity: commandEffects.grain.opacity ?? currentEffects.grain?.opacity ?? 0.15,
                size: commandEffects.grain.size ?? currentEffects.grain?.size ?? 2,
              }
              : currentEffects.grain,
          },
          background: commandEffects.parallax !== undefined
            ? {
              ...selectedBlock.style.background,
              parallax: commandEffects.parallax,
            }
            : undefined,
        });

        return '~ Aggiornati effetti visivi';
      }

      case 'updateAnimation': {
        const currentAnimation: BlockAnimation = selectedBlock.animation || {
          trigger: 'entrance',
          effect: 'fade-in',
          duration: 600,
          delay: 0,
          easing: 'ease-out',
        };

        const nextAnimation: BlockAnimation = {
          trigger: command.trigger ?? currentAnimation.trigger,
          effect: (command.effect as AnimationEffect | undefined) ?? currentAnimation.effect,
          duration: command.duration ?? currentAnimation.duration,
          delay: command.delay ?? currentAnimation.delay,
          easing: command.easing ?? currentAnimation.easing,
        };

        updateBlock(selectedBlock.id, {
          animation: nextAnimation,
        });

        return '~ Aggiornata animazione';
      }

      case 'updateClipPath': {
        updateBlockShape(selectedBlock.id, {
          type: 'clip-path',
          value: command.value,
          topDivider: selectedBlock.shape?.topDivider,
          bottomDivider: selectedBlock.shape?.bottomDivider,
        });

        return '~ Aggiornata forma del blocco';
      }

      default:
        return '? Tool non supportato';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentTenant) {
      toast.error('Scrivi un messaggio');
      return;
    }

    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: inputValue },
    ];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      const effectiveSelectedField = selectedField && hasSelectedFieldTarget()
        ? selectedField
        : null;

      let contextualPrompt: string;

      if (effectiveSelectedField) {
        const directFieldValue = resolveDirectFieldValue(effectiveSelectedField, inputValue);
        if (directFieldValue !== null) {
          const applied = applyValueToSelectedField(directFieldValue);
          if (applied) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `✓ Campo "${effectiveSelectedField.label || effectiveSelectedField.name}" riempito!` },
            ]);
            toast.success('✓ Campo riempito!');
            setLoading(false);
            return;
          }
        }

        const currentPath = pageContext.path || (typeof window !== 'undefined' ? window.location.pathname : '');
        const isBooleanField = BOOLEAN_FIELD_TYPES.has(effectiveSelectedField.type);
        const isRadioField = effectiveSelectedField.type === 'radio';
        contextualPrompt = `
Campo da compilare: ${effectiveSelectedField.label || effectiveSelectedField.name}
Nome interno: ${effectiveSelectedField.name}
Tipo: ${effectiveSelectedField.type}
Elemento HTML: ${effectiveSelectedField.htmlTag || 'input'}
Valore attuale: "${effectiveSelectedField.value}"
Placeholder: "${effectiveSelectedField.placeholder || ''}"
Stato booleano attuale: ${effectiveSelectedField.checked === undefined ? 'n/a' : effectiveSelectedField.checked ? 'true' : 'false'}
Pagina: "${pageContext.pageTitle || pageContext.pageName || document.title}"
Percorso: "${currentPath}"

Contesto della pagina:
${
  pageContext.allFields
    ? Object.entries(pageContext.allFields)
      .map(([k, v]) => `${k}: "${v}"`)
      .join('\n')
    : 'Nessun contesto disponibile'
}

Opzioni disponibili:
${formatFieldOptions(effectiveSelectedField.options)}

Richiesta utente: ${inputValue}

ISTRUZIONI OBBLIGATORIE:
- Restituisci SOLO il valore finale da inserire nel campo.
- Nessuna spiegazione, nessun markdown, niente virgolette aggiuntive.
- Se il campo è una select, scegli solo tra le opzioni disponibili e restituisci l'opzione più adatta.
- Se il campo è checkbox o switch, restituisci SOLO "true" oppure "false".
- Se il campo è radio, scegli solo una delle opzioni disponibili e restituisci il valore o la label corrispondente.
- Se il campo è email, url, number, date o datetime-local, rispetta il formato del campo.
- Se il campo fa parte di una pagina CMS, usa il contesto della pagina e degli altri campi per completarlo in modo coerente.`;

        if (isBooleanField) {
          contextualPrompt += '\n- Questo campo controlla uno stato ON/OFF del CMS: rispondi solo con true o false.';
        }

        if (isRadioField) {
          contextualPrompt += '\n- Questo campo accetta una sola scelta tra le opzioni disponibili.';
        }
      } else {
        contextualPrompt = buildSmartEditorPrompt(blocks, selectedBlock, inputValue);
      }

      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          taskType: effectiveSelectedField ? 'field-assist' : isEditorContext ? 'layout' : 'chatbot',
          prompt: contextualPrompt,
          systemPrompt: effectiveSelectedField
            ? `Sei un assistente AI per un CMS editoriale. Aiuti l'utente a generare contenuti coerenti con il contesto della pagina. Rispondi sempre in italiano.`
            : `Sei un assistente AI specializzato in layout giornalistici e tool visuali per un CMS.
COMPITI:
1. Quando l'utente richiede layout/blocchi/design → rispondi SOLO con JSON array di add-block actions
2. Quando l'utente modifica un blocco selezionato con gradienti, divisori, effetti, animazioni o shape → rispondi SOLO con un JSON object della action specializzata corretta
2. Per domande generiche → rispondi in testo italiano
3. Usa i blockType reali del builder. Se l'utente dice header/menu bar/topbar usa "navigation". Se dice notizia principale usa "article-hero". Se dice colonna notizie usa "article-grid" o "sidebar". Se serve un layout complesso usa "columns" con "children".

FORMATO JSON OBBLIGATORIO:
[{"action":"add-block","blockType":"hero","label":"Hero principale","props":{},"style":{}}]

Non aggiungere spiegazioni, commenti o testo. SOLO JSON quando richiesto layout o tool builder.
Rispondi SEMPRE in italiano.`,
        }),
      });

      const data = await response.json();
      if (data.content) {
        const actions = parseAiResponse(data.content);
        const builderCommand = !effectiveSelectedField && isEditorContext
          ? resolveStructuredBuilderCommand(data.content, inputValue)
          : null;

        if (actions && actions.length > 0 && !effectiveSelectedField && isEditorContext) {
          const results = executeActions(actions);
          const resultMsg = `Fatto!\n${results.join('\n')}`;
          setMessages((prev) => [...prev, { role: 'assistant', content: resultMsg }]);
          toast.success('✓ Blocchi creati!');
        } else if (builderCommand && !effectiveSelectedField && isEditorContext) {
          const result = executeBuilderCommand(builderCommand);
          setMessages((prev) => [...prev, { role: 'assistant', content: `Fatto!\n${result}` }]);
          toast.success('✓ Tool builder applicato!');
        } else if (effectiveSelectedField) {
          const fieldValue = sanitizeFieldResponse(data.content);
          const applied = applyValueToSelectedField(fieldValue);

          if (applied) {
            const aiMessage: AIMessage = { role: 'assistant', content: `✓ Campo "${effectiveSelectedField.label || effectiveSelectedField.name}" riempito!` };
            setMessages((prev) => [...prev, aiMessage]);
            toast.success('✓ Campo riempito!');
          } else {
            const aiMessage: AIMessage = { role: 'assistant', content: fieldValue };
            setMessages((prev) => [...prev, aiMessage]);
            await navigator.clipboard.writeText(fieldValue).catch(() => { });
            toast.success('✓ Contenuto generato! Pronto da incollare.');
          }
        } else {
          // Risposta normale
          const aiMessage: AIMessage = { role: 'assistant', content: data.content };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Errore: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Errore di connessione. Riprova.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 w-96 rounded-lg shadow-2xl flex flex-col"
      style={{
        background: 'var(--c-bg-1)',
        borderColor: 'var(--c-border)',
        border: '1px solid',
        height: expanded ? '600px' : '56px',
        transition: 'height 0.3s ease',
        zIndex: 9999,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
        style={{ borderColor: 'var(--c-border)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--c-accent)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--c-text-0)' }}>
            ✨ AI Assistant
          </span>
          {selectedField && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              {selectedField.label || selectedField.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMessages([{ role: 'assistant', content: 'Chat cancellata. Come posso aiutarti?' }]);
            }}
            className="p-1 rounded transition-opacity"
            style={{ color: 'var(--c-text-2)' }}
            title="Cancella chat"
          >
            <X size={16} />
          </button>
          {expanded ? (
            <ChevronDown size={16} style={{ color: 'var(--c-text-2)' }} />
          ) : (
            <ChevronUp size={16} style={{ color: 'var(--c-text-2)' }} />
          )}
        </div>
      </div>

      {expanded && (
        <>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ color: 'var(--c-text-0)' }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs px-3 py-2 rounded-lg text-sm break-words select-text cursor-text"
                  style={{
                    background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--c-text-0)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="text-xs p-2 rounded animate-pulse" style={{ color: 'var(--c-text-2)' }}>
                  Sta pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t flex gap-2"
            style={{ borderColor: 'var(--c-border)' }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Scrivi un prompt..."
              disabled={loading}
              data-ai-ignore-field-context="true"
              className="flex-1 text-sm px-3 py-2 rounded border focus:outline-none"
              style={{
                background: 'var(--c-bg-0)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text-0)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded transition-opacity disabled:opacity-50"
              style={{ background: 'var(--c-accent)', color: '#fff' }}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
