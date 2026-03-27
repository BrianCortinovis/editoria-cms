'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isFillableFieldElement, useFieldContextStore } from '@/lib/stores/field-context-store';
import type { PageContext, SelectedField } from '@/lib/stores/field-context-store';
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
import { buildChatSystemPrompt } from '@/lib/ai/prompts';
import { sanitizeFieldResponse } from '@/lib/ai/field-response';
import { extractPageBackgroundSettings, upsertPageBackgroundMeta } from '@/lib/page-settings';
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
  pageBackground?: Record<string, unknown>;
  children?: AiAction[];
}

function extractRequestedCount(text: string, fallback = 4) {
  const match = text.match(/(\d{1,2})/);
  if (!match) return fallback;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.max(1, Math.min(value, 20)) : fallback;
}

function extractQuotedText(text: string) {
  const match = text.match(/["“](.+?)["”]/);
  return match?.[1]?.trim() || null;
}

function extractUrl(text: string) {
  return text.match(/https?:\/\/[^\s]+/i)?.[0] || null;
}

function extractColorToken(text: string) {
  const hex = text.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i)?.[0];
  if (hex) return hex;

  const named = [
    'bianco', 'white', 'nero', 'black', 'rosso', 'red', 'blu', 'blue', 'verde', 'green',
    'giallo', 'yellow', 'arancione', 'orange', 'viola', 'purple', 'grigio', 'gray', 'grey',
  ].find((token) => new RegExp(`\\b${token}\\b`, 'i').test(text));

  const colorMap: Record<string, string> = {
    bianco: '#ffffff',
    white: '#ffffff',
    nero: '#000000',
    black: '#000000',
    rosso: '#dc2626',
    red: '#dc2626',
    blu: '#2563eb',
    blue: '#2563eb',
    verde: '#16a34a',
    green: '#16a34a',
    giallo: '#eab308',
    yellow: '#eab308',
    arancione: '#f97316',
    orange: '#f97316',
    viola: '#7c3aed',
    purple: '#7c3aed',
    grigio: '#6b7280',
    gray: '#6b7280',
    grey: '#6b7280',
  };

  return named ? colorMap[named] : null;
}

function buildNavigationItems(count: number, iconOnly = false) {
  const icons = ['home', 'newspaper', 'folder', 'tag', 'image', 'calendar', 'mail', 'search', 'menu', 'layers', 'user', 'phone'];
  return Array.from({ length: count }).map((_, index) => ({
    id: generateId(),
    label: iconOnly ? `V${index + 1}` : `Voce ${index + 1}`,
    url: '#',
    icon: icons[index % icons.length],
    children: [],
  }));
}

function extractAxisNumber(text: string, axis: 'x' | 'y') {
  const match = text.match(new RegExp(`${axis}\\s*(-?\\d{1,4})`, 'i'));
  return match ? Number(match[1]) : null;
}

function inferSelectedBlockActionsFromPrompt(userPrompt: string, selectedBlock: Block | null): AiAction[] | null {
  if (!selectedBlock) {
    return null;
  }

  const lower = userPrompt.toLowerCase();
  const quoted = extractQuotedText(userPrompt);
  const url = extractUrl(userPrompt);
  const color = extractColorToken(userPrompt);
  const propUpdates: Record<string, unknown> = {};
  const styleUpdates: Record<string, unknown> = {};
  const layoutStyleUpdates: Record<string, unknown> = {};

  const paddingMatch = userPrompt.match(/padding\s*(-?\d{1,4})/i);
  if (paddingMatch) {
    const paddingValue = `${Number(paddingMatch[1])}px`;
    layoutStyleUpdates.padding = {
      top: paddingValue,
      right: paddingValue,
      bottom: paddingValue,
      left: paddingValue,
    };
  }

  const minHeightMatch = userPrompt.match(/(?:altezza|min-height)\s*(-?\d{1,4})(px|vh|%)?/i);
  if (minHeightMatch && /(altezza|min-height)/i.test(lower) && !/\bhero\b/.test(lower)) {
    layoutStyleUpdates.minHeight = `${Number(minHeightMatch[1])}${minHeightMatch[2] || 'px'}`;
  }

  const maxWidthMatch = userPrompt.match(/(?:max width|max-width|larghezza massima)\s*(-?\d{1,4})(px|%|vw)?/i);
  if (maxWidthMatch) {
    layoutStyleUpdates.maxWidth = `${Number(maxWidthMatch[1])}${maxWidthMatch[2] || 'px'}`;
  }

  if (selectedBlock.type === 'hero') {
    if (/\b(titolo|headline)\b/i.test(lower) && quoted) {
      propUpdates.title = quoted;
    }
    if (/\b(sottotitolo|subtitle|descrizione)\b/i.test(lower) && quoted) {
      propUpdates.subtitle = quoted;
    }
    if (/\b(eyebrow|badge|sopratitolo)\b/i.test(lower) && quoted) {
      propUpdates.eyebrow = quoted;
    }
    if (/\b(cta|pulsante|button)\b/i.test(lower) && /\b(testo|label|scritta)\b/i.test(lower) && quoted) {
      propUpdates.ctaText = quoted;
    }
    if (/\b(cta|pulsante|button)\b/i.test(lower) && url) {
      propUpdates.ctaUrl = url;
    }
    if (/\b(sfondo|background|immagine)\b/i.test(lower) && url) {
      propUpdates.backgroundImage = url;
    }
    if (/\b(centra|centro|center)\b/i.test(lower)) {
      propUpdates.textAlign = 'center';
      propUpdates.contentPosition = 'center';
    } else if (/\b(sinistra|left)\b/i.test(lower)) {
      propUpdates.textAlign = 'left';
      propUpdates.contentPosition = 'left';
    } else if (/\b(destra|right)\b/i.test(lower)) {
      propUpdates.textAlign = 'right';
      propUpdates.contentPosition = 'right';
    }
    if (/\b(glass)\b/i.test(lower)) propUpdates.panelStyle = 'glass';
    if (/\b(light|chiaro)\b/i.test(lower) && /\b(panel|pannello)\b/i.test(lower)) propUpdates.panelStyle = 'solid-light';
    if (/\b(dark|scuro)\b/i.test(lower) && /\b(panel|pannello)\b/i.test(lower)) propUpdates.panelStyle = 'solid-dark';
    if (/\b(senza pannello|nessun pannello|panel none)\b/i.test(lower)) propUpdates.panelStyle = 'none';
    if (/\b(overlay)\b/i.test(lower) && color) propUpdates.overlayColor = color;

    const opacityMatch = userPrompt.match(/(\d{1,3})\s*%/);
    if (/\b(overlay)\b/i.test(lower) && opacityMatch) {
      propUpdates.overlayOpacity = Math.max(0, Math.min(1, Number(opacityMatch[1]) / 100));
    }

    const offsetX = extractAxisNumber(userPrompt, 'x');
    const offsetY = extractAxisNumber(userPrompt, 'y');
    if (/\b(contenuto)\b/i.test(lower)) {
      if (offsetX !== null) propUpdates.contentOffsetX = offsetX;
      if (offsetY !== null) propUpdates.contentOffsetY = offsetY;
    }
    if (/\b(cta|pulsante|button)\b/i.test(lower)) {
      if (offsetX !== null) propUpdates.ctaOffsetX = offsetX;
      if (offsetY !== null) propUpdates.ctaOffsetY = offsetY;
    }
  }

  if (selectedBlock.type === 'slideshow') {
    const offsetX = extractAxisNumber(userPrompt, 'x');
    const offsetY = extractAxisNumber(userPrompt, 'y');
    if (/\b(contenuto|testo)\b/i.test(lower)) {
      if (offsetX !== null) propUpdates.contentOffsetX = offsetX;
      if (offsetY !== null) propUpdates.contentOffsetY = offsetY;
    }
    if (/\b(pulsanti|cta|buttons)\b/i.test(lower)) {
      if (offsetX !== null) propUpdates.buttonsOffsetX = offsetX;
      if (offsetY !== null) propUpdates.buttonsOffsetY = offsetY;
    }
    if (/\b(centra|centro|center)\b/i.test(lower)) propUpdates.contentPosition = 'center';
    if (/\b(sinistra|left)\b/i.test(lower)) propUpdates.contentPosition = 'center-left';
    if (/\b(basso|bottom)\b/i.test(lower)) propUpdates.contentPosition = 'bottom-left';
    if (/\b(glass)\b/i.test(lower)) propUpdates.panelStyle = 'glass';
    if (/\b(light|chiaro)\b/i.test(lower) && /\b(panel|pannello)\b/i.test(lower)) propUpdates.panelStyle = 'solid-light';
    if (/\b(dark|scuro)\b/i.test(lower) && /\b(panel|pannello)\b/i.test(lower)) propUpdates.panelStyle = 'solid-dark';
  }

  if (selectedBlock.type === 'article-hero') {
    if (/\b(centra|centro|center)\b/i.test(lower)) propUpdates.contentAlign = 'center';
    if (/\b(sinistra|left)\b/i.test(lower)) propUpdates.contentAlign = 'left';
    if (/\b(destra|right)\b/i.test(lower)) propUpdates.contentAlign = 'right';
    if (/\b(glass)\b/i.test(lower)) propUpdates.panelStyle = 'glass';
    if (/\b(dark|scuro)\b/i.test(lower) && /\b(panel|pannello)\b/i.test(lower)) propUpdates.panelStyle = 'solid-dark';
    if (/\b(senza pannello|nessun pannello|panel none)\b/i.test(lower)) propUpdates.panelStyle = 'none';
    if (/\b(overlay)\b/i.test(lower) && color) propUpdates.overlayColor = color;
    const opacityMatch = userPrompt.match(/(\d{1,3})\s*%/);
    if (/\b(overlay)\b/i.test(lower) && opacityMatch) {
      propUpdates.overlayOpacity = Math.max(0, Math.min(1, Number(opacityMatch[1]) / 100));
    }
  }

  if (selectedBlock.type === 'navigation') {
    if (/(menu|voci|pulsanti|button)/i.test(lower) && /\b(\d{1,2})\b/.test(lower)) {
      const count = extractRequestedCount(lower, 6);
      const iconOnly = /(solo icone|icone singole|icon only)/i.test(lower);
      propUpdates.mode = 'custom';
      propUpdates.items = buildNavigationItems(count, iconOnly);
      propUpdates.iconOnly = iconOnly;
      if (/(quadrat|square)/i.test(lower)) {
        propUpdates.buttonShape = 'square';
      }
    }
    if (/\b(verticale|sidebar|laterale)\b/i.test(lower)) {
      propUpdates.layout = 'vertical';
      propUpdates.placement = /\bdestra|right\b/i.test(lower) ? 'right' : 'left';
    }
    if (/\b(orizzontale|horizontal|top)\b/i.test(lower)) {
      propUpdates.layout = 'horizontal';
      propUpdates.placement = /\bbasso|bottom\b/i.test(lower) ? 'bottom' : 'top';
    }
    if (/\b(glass)\b/i.test(lower)) propUpdates.variant = 'glass';
    if (/\b(minimal)\b/i.test(lower)) propUpdates.variant = 'minimal';
    if (/\b(boxed|boxed|card)\b/i.test(lower) || /\b(quadrat|square)\b/i.test(lower)) propUpdates.variant = 'boxed';
    if (/\b(cta|pulsante finale)\b/i.test(lower) && quoted) propUpdates.ctaText = quoted;
    if (/\b(cta|pulsante finale)\b/i.test(lower) && url) propUpdates.ctaUrl = url;
  }

  if (selectedBlock.type === 'text') {
    if (quoted) {
      if (/\b(titolo|headline)\b/i.test(lower)) {
        propUpdates.content = `<h2>${quoted}</h2>`;
      } else if (/\b(paragrafo|testo|contenuto|scrivi)\b/i.test(lower)) {
        propUpdates.content = `<p>${quoted}</p>`;
      }
    }
    if (/\b(drop cap|capolettera)\b/i.test(lower)) {
      propUpdates.dropCap = !/\b(no|off|false|disattiva)\b/i.test(lower);
    }
    const cols = extractRequestedCount(lower, 1);
    if (/\bcolonn/.test(lower) && /\d/.test(lower)) {
      propUpdates.columns = cols;
    }
  }

  if (selectedBlock.type === 'section' || selectedBlock.type === 'container') {
    if (color && /\b(sfondo|background)\b/i.test(lower)) {
      styleUpdates.background = {
        ...selectedBlock.style.background,
        type: 'color',
        value: color,
      };
    }
    if (Object.keys(layoutStyleUpdates).length > 0) {
      styleUpdates.layout = {
        ...selectedBlock.style.layout,
        ...layoutStyleUpdates,
      };
    }
    if (selectedBlock.type === 'section' && /\b(full width|larghezza piena|tutta larghezza)\b/i.test(lower)) {
      propUpdates.fullWidth = !/\b(no|off|false|disattiva)\b/i.test(lower);
    }
  }

  if (selectedBlock.type === 'columns') {
    if (/\b(\d{1,2})\s*colonn/i.test(lower) || /\bcolonn/i.test(lower) && /\d/.test(lower)) {
      const count = Math.max(1, Math.min(6, extractRequestedCount(lower, Number(selectedBlock.props.columnCount || 2))));
      propUpdates.columnCount = count;
      propUpdates.columnWidths = Array.from({ length: count }).map(() => `${Math.round(100 / count)}%`);
    }
    const gapMatch = userPrompt.match(/gap\s*(-?\d{1,4})/i);
    if (gapMatch) {
      propUpdates.gap = `${Number(gapMatch[1])}px`;
    }
    if (/\bmobile\b/i.test(lower) && /\bstack\b/i.test(lower)) {
      propUpdates.stackOnMobile = !/\b(no|off|false|disattiva)\b/i.test(lower);
    }
  }

  if (selectedBlock.type === 'carousel') {
    const widthMatch = userPrompt.match(/(?:card width|larghezza card)\s*(-?\d{1,4})/i);
    if (widthMatch) {
      propUpdates.cardWidth = `${Number(widthMatch[1])}px`;
    }
    const gapMatch = userPrompt.match(/gap\s*(-?\d{1,4})/i);
    if (gapMatch) {
      propUpdates.gap = `${Number(gapMatch[1])}px`;
    }
    if (/\b(minimal|elevated|dark)\b/i.test(lower)) {
      const cardStyle = ['minimal', 'elevated', 'dark'].find((token) => new RegExp(`\\b${token}\\b`, 'i').test(lower));
      if (cardStyle) propUpdates.cardStyle = cardStyle;
    }
    if (/\b(frecce|arrows)\b/i.test(lower)) {
      propUpdates.showArrows = !/\b(no|off|false|disattiva)\b/i.test(lower);
    }
    if (/\b(dots|indicatori|punti)\b/i.test(lower)) {
      propUpdates.showDots = !/\b(no|off|false|disattiva)\b/i.test(lower);
    }
  }

  const actions: AiAction[] = [];

  if (Object.keys(propUpdates).length > 0) {
    actions.push({
      action: 'update-block-props',
      blockId: selectedBlock.id,
      props: propUpdates,
    });
  }

  if (Object.keys(styleUpdates).length > 0) {
    actions.push({
      action: 'update-block-style',
      blockId: selectedBlock.id,
      style: styleUpdates,
    });
  }

  if (actions.length === 0) {
    return null;
  }

  return actions;
}

function detectDirectEditorActions(userPrompt: string, selectedBlockId: string | null): AiAction[] | null {
  const lower = userPrompt.toLowerCase();
  const targetPosition = selectedBlockId ? 'after' : undefined;

  const isCreateIntent = /(aggiungi|metti|inserisci|crea|fammi|genera|costruisci|prepara)/i.test(lower);
  if (!isCreateIntent) {
    return null;
  }

  if (/(menu bar|menubar|navbar|nav bar|header|topbar|navigazione|menu)/i.test(lower)) {
    const count = extractRequestedCount(lower, 6);
    const iconOnly = /(solo icone|icone singole|icon only)/i.test(lower);
    const square = /(quadrat|square)/i.test(lower);
    const bottom = /(in basso|bottom)/i.test(lower);
    const side = /(sidebar|laterale|a sinistra|a destra)/i.test(lower);
    const vertical = /(verticale|sidebar|laterale)/i.test(lower);

    return [
      {
        action: 'add-block',
        blockType: 'navigation',
        label: `Menu bar ${count} pulsanti`,
        targetBlockId: selectedBlockId || undefined,
        position: targetPosition,
        props: {
          mode: 'custom',
          layout: vertical ? 'vertical' : 'horizontal',
          placement: side ? 'left' : bottom ? 'bottom' : 'top',
          variant: square ? 'boxed' : iconOnly ? 'boxed' : 'inline',
          iconOnly,
          buttonShape: square || iconOnly ? 'square' : 'auto',
          buttonSize: count >= 10 ? 'small' : 'medium',
          showIcons: true,
          showBadges: false,
          items: Array.from({ length: count }).map((_, index) => ({
            id: generateId(),
            label: iconOnly ? `V${index + 1}` : `Voce ${index + 1}`,
            url: '#',
            icon: ['home', 'newspaper', 'folder', 'tag', 'image', 'calendar', 'mail', 'search', 'menu', 'layers', 'user', 'phone'][index % 12],
            children: [],
          })),
        },
      },
    ];
  }

  if (/(slideshow|slider|carousel hero)/i.test(lower)) {
    return [
      {
        action: 'add-block',
        blockType: 'slideshow',
        label: 'Slideshow',
        targetBlockId: selectedBlockId || undefined,
        position: targetPosition,
        props: {
          templateId: 'slideshow-editorial-hero',
          autoplay: true,
          showDots: true,
          showArrows: true,
        },
      },
    ];
  }

  if (/(galleria|gallery|masonry)/i.test(lower)) {
    return [
      {
        action: 'add-block',
        blockType: 'image-gallery',
        label: 'Galleria media',
        targetBlockId: selectedBlockId || undefined,
        position: targetPosition,
        props: {
          templateId: /(masonry)/i.test(lower) ? 'gallery-masonry-story' : 'gallery-editorial-grid',
        },
      },
    ];
  }

  if (/(griglia articoli|article grid|news grid|colonna articoli)/i.test(lower)) {
    return [
      {
        action: 'add-block',
        blockType: 'article-grid',
        label: 'Griglia articoli',
        targetBlockId: selectedBlockId || undefined,
        position: targetPosition,
        props: {
          templateId: /(compact|minimal)/i.test(lower) ? 'article-grid-compact-list' : 'article-grid-newsroom-3',
        },
      },
    ];
  }

  return null;
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
  'update-page-background',
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
  const normalizeCandidate = (raw: string) => raw
    .trim()
    .replace(/^```(?:json|javascript|js)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, ' ');

  const stripComments = (raw: string) => {
    let output = '';
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let index = 0; index < raw.length; index += 1) {
      const current = raw[index];
      const next = raw[index + 1];

      if (inString) {
        output += current;
        if (escaped) {
          escaped = false;
        } else if (current === '\\') {
          escaped = true;
        } else if (current === stringQuote) {
          inString = false;
          stringQuote = '';
        }
        continue;
      }

      if (current === '"' || current === "'") {
        inString = true;
        stringQuote = current;
        output += current;
        continue;
      }

      if (current === '/' && next === '/') {
        index += 2;
        while (index < raw.length) {
          const lookahead = raw.slice(index);
          if (
            raw[index] === '\n'
            || raw[index] === '\r'
            || /^(\s*,?\s*"[^"]+"\s*:)/.test(lookahead)
            || /^(\s*[}\]])/.test(lookahead)
          ) {
            index -= 1;
            break;
          }
          index += 1;
        }
        continue;
      }

      if (current === '/' && next === '*') {
        index += 2;
        while (index < raw.length && !(raw[index] === '*' && raw[index + 1] === '/')) {
          index += 1;
        }
        index += 1;
        continue;
      }

      output += current;
    }

    return output;
  };

  const stripTrailingCommas = (raw: string) => raw.replace(/,\s*([}\]])/g, '$1');

  const extractJsonCandidate = (raw: string) => {
    const start = raw.search(/[[{]/);
    if (start < 0) return null;

    const open = raw[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let index = start; index < raw.length; index += 1) {
      const current = raw[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (current === '\\') {
          escaped = true;
        } else if (current === stringQuote) {
          inString = false;
          stringQuote = '';
        }
        continue;
      }

      if (current === '"' || current === "'") {
        inString = true;
        stringQuote = current;
        continue;
      }

      if (current === open) depth += 1;
      if (current === close) depth -= 1;

      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }

    return raw.slice(start);
  };

  const asActions = (parsed: unknown): AiAction[] | null => {
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((item): item is AiAction =>
        Boolean(item && typeof item === 'object' && 'action' in item && GENERIC_EDITOR_ACTIONS.has(String((item as AiAction).action)))
      );
      return filtered.length > 0 ? filtered : null;
    }

    if (
      parsed
      && typeof parsed === 'object'
      && 'action' in parsed
      && GENERIC_EDITOR_ACTIONS.has(String((parsed as AiAction).action))
    ) {
      return [parsed as AiAction];
    }

    return null;
  };

  const tryParse = (raw: string) => {
    const normalized = stripTrailingCommas(stripComments(normalizeCandidate(raw)));
    try {
      return asActions(JSON.parse(normalized));
    } catch {
      return null;
    }
  };

  const direct = tryParse(content);
  if (direct) {
    return direct;
  }

  const candidate = extractJsonCandidate(normalizeCandidate(content));
  if (!candidate) {
    return null;
  }

  return tryParse(candidate);
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

function formatPageContextSummary(pageContext: PageContext) {
  const chunks: string[] = [];

  if (pageContext.path) {
    chunks.push(`Percorso CMS: ${pageContext.path}`);
  }

  if (pageContext.pageTitle || pageContext.pageName) {
    chunks.push(`Pagina attuale: ${pageContext.pageTitle || pageContext.pageName}`);
  }

  if (pageContext.headings?.length) {
    chunks.push(`Titoli visibili:\n${pageContext.headings.map((item) => `- ${item}`).join('\n')}`);
  }

  if (pageContext.sections?.length) {
    chunks.push(`Sezioni visibili:\n${pageContext.sections.map((item) => `- ${item}`).join('\n')}`);
  }

  if (pageContext.actions?.length) {
    chunks.push(`Azioni visibili:\n${pageContext.actions.map((item) => `- ${item}`).join('\n')}`);
  }

  if (pageContext.allFields && Object.keys(pageContext.allFields).length > 0) {
    chunks.push(
      `Campi gia compilati:\n${Object.entries(pageContext.allFields)
        .slice(0, 12)
        .map(([key, value]) => `- ${key}: "${value}"`)
        .join('\n')}`,
    );
  }

  return chunks.join('\n\n') || 'Nessun contesto pagina disponibile.';
}

function shouldUseSelectedFieldAssistant(field: SelectedField, prompt: string) {
  const normalizedPrompt = normalizeLooseMatch(prompt);
  const explicitAction = /\b(compila|riempi|genera|scrivi|proponi|ottimizza|migliora|riscrivi|traduci|sintetizza|imposta|setta|inserisci|crea|dammi|fammi|correggi|adatta)\b/i.test(prompt);
  const genericQuestion = /\b(come|perche|perché|cosa|quale|quali|quando|dove|chi|posso|devo|errore|problema|spiegami|aiutami|analizza|controlla|verifica)\b/i.test(prompt) || prompt.trim().endsWith('?');
  const fieldReferenceTokens = normalizeLooseMatch(`${field.label || ''} ${field.name || ''}`)
    .split(' ')
    .filter((token) => token.length > 2);
  const explicitFieldReference = /\b(campo|input|valore|placeholder|etichetta|qui|questo|questa)\b/i.test(prompt)
    || fieldReferenceTokens.some((token) => normalizedPrompt.includes(token));

  if (resolveDirectFieldValue(field, prompt) !== null) {
    return true;
  }

  if (explicitFieldReference && (explicitAction || !genericQuestion)) {
    return true;
  }

  if (explicitAction && !genericQuestion) {
    return true;
  }

  if (explicitAction && prompt.trim().split(/\s+/).length <= 14) {
    return true;
  }

  return false;
}

function buildCmsPagePrompt(inputValue: string, pageContext: PageContext) {
  return `Richiesta utente: ${inputValue}

Contesto pagina CMS:
${formatPageContextSummary(pageContext)}

ISTRUZIONI:
- Rispondi come assistente del CMS online, non come builder visuale.
- Puoi aiutare su redazione, SEO, analytics, tecnico, workflow, publish, domini, storage, cron, utenti, media, banner, newsletter, form e impostazioni.
- Se la domanda riguarda un'altra area del CMS rispetto alla pagina aperta, rispondi comunque in modo utile e preciso.
- Se noti miglioramenti concreti di SEO, analytics o configurazione, proponili in modo pratico.
- Se la richiesta e' generica, rispondi in massimo 6 punti brevi o 120 parole.`;
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

function summarizeBlockForPrompt(block: Block, depth = 0): Record<string, unknown> {
  const primitiveProps = Object.fromEntries(
    Object.entries(block.props || {})
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
      .slice(0, 12)
  );

  return {
    id: block.id,
    type: block.type,
    label: block.label,
    props: primitiveProps,
    dataSource: block.dataSource
      ? Object.fromEntries(
          Object.entries(block.dataSource)
            .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
            .slice(0, 12)
        )
      : null,
    style: {
      layout: block.style.layout,
      background: block.style.background,
      typography: block.style.typography,
      border: block.style.border,
    },
    childCount: block.children.length,
    children:
      depth >= 1
        ? block.children.slice(0, 8).map((child) => ({
            id: child.id,
            type: child.type,
            label: child.label,
          }))
        : block.children.slice(0, 8).map((child) => summarizeBlockForPrompt(child, depth + 1)),
  };
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

function buildPageBackgroundState(pageMeta: Record<string, unknown>) {
  const settings = extractPageBackgroundSettings(pageMeta);
  const summary = [
    `type=${settings.type}`,
    settings.value ? `value=${JSON.stringify(settings.value)}` : null,
    settings.images.length > 0 ? `images=${settings.images.length}` : null,
    settings.overlay ? `overlay=${JSON.stringify(settings.overlay)}` : null,
    settings.fixed ? 'fixed=true' : null,
  ].filter(Boolean);

  return summary.length > 0 ? summary.join(' | ') : 'type=none';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildSmartEditorPrompt(
  blocks: Block[],
  pageMeta: Record<string, unknown>,
  selectedBlock: Block | null,
  userPrompt: string,
): string {
  const selectedBlockDetail = selectedBlock
    ? `Contesto blocco: ${JSON.stringify(summarizeBlockForPrompt(selectedBlock), null, 2)}`
    : '';

  const focusSection = selectedBlock
    ? `# BLOCCO SELEZIONATO (FOCUS)
L'utente ha selezionato: [${selectedBlock.type}] id="${selectedBlock.id}" label="${selectedBlock.label}"
${selectedBlockDetail}

REGOLE:
1. OGNI modifica richiesta deve riguardare prima questo blocco.
2. Se l'utente chiede di mettere, aggiungere o inserire qualcosa DENTRO questo blocco:
   - preferisci "update-block-props" per aggiornare il contenuto del blocco esistente
   - oppure usa "convert-block" se il blocco va trasformato in un altro tipo
   - NON usare "add-block" separato se l'intento e modificare il blocco selezionato
3. Usa "add-block" solo se l'utente chiede esplicitamente prima, dopo o dentro come nuovo blocco separato.
4. Se chiede di aggiungere prima o dopo, usa "targetBlockId":"${selectedBlock.id}" e "position":"before|after".
5. Se chiede di cambiare contenuto, colori, sfondo, testo, CTA, posizione interna o stile, usa "update-block-props" o "update-block-style" sul blocco selezionato.`
    : `# NESSUN BLOCCO SELEZIONATO
L'utente non ha selezionato un blocco specifico. L'IA puo costruire o modificare l'intera pagina.`;

  return `Sei un AGENTE OPERATIVO del builder CMS. Non descrivi, esegui azioni.
Rispondi SEMPRE e SOLO con un JSON array di azioni, oppure con un oggetto JSON singolo per i tool specializzati del blocco.

${focusSection}

${selectedBlock ? `# VINCOLO DI TARGET
Se stai MODIFICANDO il blocco selezionato e non hai un altro target esplicito, considera il blocco selezionato come target implicito.
Quindi per update-block-props, update-block-style, update-block-shape, rename-block, duplicate-block, move-block, toggle-visibility, toggle-lock e convert-block puoi riferirti al blocco selezionato anche senza blockId diverso.` : ''}

# STATO PAGINA
${buildPageState(blocks, selectedBlock?.id)}

# SFONDO PAGINA
${buildPageBackgroundState(pageMeta)}

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
- update-page-background
- convert-block
- undo
- redo
- message

# REGOLE OUTPUT
- Nessun markdown
- Nessun testo fuori dal JSON
- Se l'utente chiede un layout, crea piu blocchi reali del builder
- Se l'utente chiede di cambiare lo sfondo della pagina, NON usare un blocco: usa "update-page-background"
- Se serve una griglia giornalistica, usa "columns" con "children"
- Per header/menu/topbar usa "navigation"
- Per notizia principale usa "article-hero"
- Per colonne di notizie usa "article-grid" o "sidebar"
- Se l'utente chiede esplicitamente di METTERE o AGGIUNGERE un elemento del builder, non rispondere in prosa: restituisci azioni operative
- Se chiede una menu bar con un numero preciso di pulsanti/voci, crea davvero quel numero di item nel blocco navigation

# FORMATO update-page-background
{
  "action": "update-page-background",
  "pageBackground": {
    "type": "none|color|gradient|image|slideshow|custom-css",
    "value": "",
    "images": [],
    "overlay": "",
    "size": "cover",
    "position": "center",
    "repeat": "no-repeat",
    "fixed": false,
    "customCss": "",
    "minHeight": "100%",
    "slideshowDurationMs": 16000
  }
}

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

function normalizeEditorActions(actions: AiAction[], selectedBlockId: string | null): AiAction[] {
  return actions.map((action) => {
    if (!selectedBlockId) {
      return action;
    }

    if (
      !action.blockId
      && [
        'remove-block',
        'duplicate-block',
        'update-block-props',
        'update-block-style',
        'update-block-shape',
        'move-block',
        'rename-block',
        'toggle-visibility',
        'toggle-lock',
        'convert-block',
      ].includes(action.action)
    ) {
      return {
        ...action,
        blockId: selectedBlockId,
      };
    }

    return action;
  });
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
    updatePageMeta,
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

  // The online global assistant is CMS-only.
  const isEditorContext = pathname.startsWith('/desktop-editor') && !!pageStore && blocks !== undefined;

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: `Ciao! Sono il tuo assistente IA del CMS. Posso aiutarti su redazione, SEO, analytics, tecnico, media, banner, newsletter, publish e configurazioni del sito.`,
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

Posso compilare questo campo oppure rispondere a domande sulla pagina e sul CMS.`;

      setMessages((prev) => {
        const hasConversation = prev.slice(1).some((message) => message.role === 'user');
        if (hasConversation) {
          return prev;
        }

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
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) {
              results.push('✗ blockId mancante');
              break;
            }
            removeBlock(targetId);
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
            const targetId = action.blockId || selectedBlockId;
            if (!targetId || !action.props) {
              results.push('✗ target o props mancanti');
              break;
            }
            updateBlockProps(targetId, action.props);
            results.push(`~ Aggiornate proprietà`);
            break;
          }
          case 'update-block-style': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId || !action.style) {
              results.push('✗ target o stile mancanti');
              break;
            }
            updateBlockStyle(targetId, action.style);
            results.push(`~ Aggiornato stile`);
            break;
          }
          case 'update-block-shape': {
            const targetId = action.blockId || selectedBlockId;
            if (!targetId) {
              results.push('✗ target mancante');
              break;
            }
            updateBlockShape(targetId, action.shape ?? null);
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
          case 'update-page-background': {
            if (!action.pageBackground || typeof action.pageBackground !== 'object') {
              results.push('✗ pageBackground mancante');
              break;
            }

            updatePageMeta((current) => upsertPageBackgroundMeta(current, action.pageBackground || {}));
            const next = extractPageBackgroundSettings(
              upsertPageBackgroundMeta(usePageStore.getState().pageMeta, action.pageBackground || {})
            );
            results.push(`~ Sfondo pagina aggiornato (${next.type})`);
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
      const shouldAssistSelectedField = effectiveSelectedField
        ? shouldUseSelectedFieldAssistant(effectiveSelectedField, inputValue)
        : false;
      const targetField = shouldAssistSelectedField ? effectiveSelectedField : null;

      let contextualPrompt: string;

      if (targetField) {
        const directFieldValue = resolveDirectFieldValue(targetField, inputValue);
        if (directFieldValue !== null) {
          const applied = applyValueToSelectedField(directFieldValue);
          if (applied) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: `✓ Campo "${targetField.label || targetField.name}" riempito!` },
            ]);
            toast.success('✓ Campo riempito!');
            setLoading(false);
            return;
          }
        }

        const currentPath = pageContext.path || (typeof window !== 'undefined' ? window.location.pathname : '');
        const isBooleanField = BOOLEAN_FIELD_TYPES.has(targetField.type);
        const isRadioField = targetField.type === 'radio';
        contextualPrompt = `
Campo da compilare: ${targetField.label || targetField.name}
Nome interno: ${targetField.name}
Tipo: ${targetField.type}
Elemento HTML: ${targetField.htmlTag || 'input'}
Valore attuale: "${targetField.value}"
Placeholder: "${targetField.placeholder || ''}"
Stato booleano attuale: ${targetField.checked === undefined ? 'n/a' : targetField.checked ? 'true' : 'false'}
Pagina: "${pageContext.pageTitle || pageContext.pageName || document.title}"
Percorso: "${currentPath}"

Contesto della pagina:
${formatPageContextSummary(pageContext)}

Opzioni disponibili:
${formatFieldOptions(targetField.options)}

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
        contextualPrompt = buildCmsPagePrompt(inputValue, pageContext);
      }

      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          taskType: targetField ? 'field-assist' : 'chatbot',
          prompt: contextualPrompt,
          systemPrompt: targetField
            ? `Sei un assistente del CMS online. Compili campi del CMS in modo coerente con la pagina aperta. Rispondi sempre in italiano e restituisci solo il valore finale del campo.`
            : buildChatSystemPrompt({ tenantName: currentTenant.name, pageTitle: pageContext.pageTitle || pageContext.pageName }),
        }),
      });

      const data = await response.json();
      if (data.content) {
        const actions = parseAiResponse(data.content);
        const builderCommand = !targetField && isEditorContext
          ? resolveStructuredBuilderCommand(data.content, inputValue)
          : null;

        const directActions = !targetField && isEditorContext
          ? detectDirectEditorActions(inputValue, selectedBlockId)
          : null;
        const selectedBlockFallbackActions = !targetField && isEditorContext
          ? inferSelectedBlockActionsFromPrompt(inputValue, selectedBlock)
          : null;

        if (actions && actions.length > 0 && !targetField && isEditorContext) {
          const normalizedActions = normalizeEditorActions(actions, selectedBlockId);
          const results = executeActions(normalizedActions);
          const resultMsg = `Fatto!\n${results.join('\n')}`;
          setMessages((prev) => [...prev, { role: 'assistant', content: resultMsg }]);
          toast.success('✓ Blocchi creati!');
        } else if (directActions && directActions.length > 0 && !targetField && isEditorContext) {
          const results = executeActions(directActions);
          const resultMsg = `Fatto!\n${results.join('\n')}`;
          setMessages((prev) => [...prev, { role: 'assistant', content: resultMsg }]);
          toast.success('✓ Builder applicato dal comando diretto!');
        } else if (selectedBlockFallbackActions && selectedBlockFallbackActions.length > 0 && !targetField && isEditorContext) {
          const results = executeActions(selectedBlockFallbackActions);
          const resultMsg = `Fatto!\n${results.join('\n')}`;
          setMessages((prev) => [...prev, { role: 'assistant', content: resultMsg }]);
          toast.success('✓ Modifica applicata al blocco selezionato!');
        } else if (builderCommand && !targetField && isEditorContext) {
          const result = executeBuilderCommand(builderCommand);
          setMessages((prev) => [...prev, { role: 'assistant', content: `Fatto!\n${result}` }]);
          toast.success('✓ Tool builder applicato!');
        } else if (targetField) {
          const fieldValue = sanitizeFieldResponse(data.content);
          const applied = applyValueToSelectedField(fieldValue);

          if (applied) {
            const aiMessage: AIMessage = { role: 'assistant', content: `✓ Campo "${targetField.label || targetField.name}" riempito!` };
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
