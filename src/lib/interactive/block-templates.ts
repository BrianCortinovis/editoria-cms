import type { BlockStyle } from '@/lib/types/block';

export interface InteractiveBlockTemplate {
  id: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
  style: Partial<BlockStyle>;
}

function template(
  id: string,
  name: string,
  description: string,
  props: Record<string, unknown>,
  style: Partial<BlockStyle>
): InteractiveBlockTemplate {
  return { id, name, description, props, style };
}

export const SOCIAL_BLOCK_TEMPLATES: InteractiveBlockTemplate[] = [
  template('social-editorial-row', 'Editorial Row', 'Fila pulita da testata con label e badge.', {
    templateId: 'social-editorial-row',
    layoutStyle: 'pill',
    size: 'medium',
    colorMode: 'brand',
    alignment: 'left',
    showLabels: true,
    showHandles: false,
    showBadges: true,
    title: 'Seguici',
    description: 'Canali ufficiali della redazione',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '16px' },
    shadow: '0 10px 28px rgba(15,23,42,0.08)',
  }),
  template('social-floating-glass', 'Floating Glass', 'Gruppo social blur per hero moderne.', {
    templateId: 'social-floating-glass',
    layoutStyle: 'glass',
    size: 'large',
    colorMode: 'brand',
    alignment: 'center',
    showLabels: false,
    showHandles: false,
    showBadges: false,
    title: 'Live social',
  }, {
    background: { type: 'color', value: 'rgba(255,255,255,0.12)' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.18)', radius: '18px' },
    backdropFilter: 'blur(18px)',
    shadow: '0 22px 50px rgba(15,23,42,0.18)',
  }),
  template('social-footer-minimal', 'Footer Minimal', 'Footer social discreto con icone compatte.', {
    templateId: 'social-footer-minimal',
    layoutStyle: 'icon-only',
    size: 'small',
    colorMode: 'mono',
    alignment: 'center',
    showLabels: false,
    showHandles: false,
    showBadges: false,
  }, {
    background: { type: 'color', value: 'transparent' },
  }),
  template('social-sidebar-cards', 'Sidebar Cards', 'Schede laterali con piattaforma e CTA.', {
    templateId: 'social-sidebar-cards',
    layoutStyle: 'card',
    size: 'medium',
    colorMode: 'brand',
    alignment: 'stretch',
    showLabels: true,
    showHandles: true,
    showBadges: true,
    title: 'Redazione e community',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '18px' },
    shadow: '0 14px 34px rgba(15,23,42,0.08)',
  }),
  template('social-share-toolbar', 'Share Toolbar', 'Toolbar share orizzontale per articoli.', {
    templateId: 'social-share-toolbar',
    layoutStyle: 'toolbar',
    size: 'small',
    colorMode: 'soft',
    alignment: 'left',
    showLabels: true,
    showHandles: false,
    showBadges: false,
    title: 'Condividi',
  }, {
    background: { type: 'color', value: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '14px' },
  }),
  template('social-newsroom-dark', 'Newsroom Dark', 'Barra social scura da newsroom video.', {
    templateId: 'social-newsroom-dark',
    layoutStyle: 'pill',
    size: 'medium',
    colorMode: 'mono',
    alignment: 'left',
    showLabels: true,
    showHandles: true,
    showBadges: true,
    title: 'Desk social',
    description: 'Canali live, video e aggiornamenti',
  }, {
    background: { type: 'color', value: '#0f172a' },
    typography: { color: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.08)', radius: '18px' },
  }),
];

export const CMS_FORM_TEMPLATES: InteractiveBlockTemplate[] = [
  template('form-editorial-card', 'Editorial Card', 'Modulo contatti elegante da testata.', {
    templateId: 'form-editorial-card',
    visualStyle: 'editorial',
    layout: 'stacked',
    showTitle: true,
    showDescription: true,
    introBadge: 'Contatti redazione',
    supportText: 'Ti rispondiamo dal desk entro 24 ore',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '20px' },
    shadow: '0 14px 34px rgba(15,23,42,0.08)',
  }),
  template('form-split-support', 'Split Support', 'Layout due colonne con testo e form.', {
    templateId: 'form-split-support',
    visualStyle: 'split',
    layout: 'split',
    showTitle: true,
    showDescription: true,
    introBadge: 'Desk & supporto',
    supportText: 'Segnalazioni, contatti e richieste alla redazione',
  }, {
    background: { type: 'color', value: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#dbeafe', radius: '22px' },
    shadow: '0 18px 42px rgba(37,99,235,0.08)',
  }),
  template('form-glass-contact', 'Glass Contact', 'Modulo hero moderno con blur leggero.', {
    templateId: 'form-glass-contact',
    visualStyle: 'glass',
    layout: 'stacked',
    showTitle: true,
    showDescription: true,
    introBadge: 'Contattaci',
    supportText: 'Per partnership, pubblicita o segnalazioni',
  }, {
    background: { type: 'color', value: 'rgba(255,255,255,0.14)' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.24)', radius: '20px' },
    backdropFilter: 'blur(18px)',
  }),
  template('form-compact-inline', 'Compact Inline', 'Modulo compatto per sidebar o footer.', {
    templateId: 'form-compact-inline',
    visualStyle: 'compact',
    layout: 'inline',
    showTitle: true,
    showDescription: false,
    introBadge: 'Richiesta rapida',
    supportText: '',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '16px' },
  }),
  template('form-dark-briefing', 'Dark Briefing', 'Modulo dark per pagine media e video.', {
    templateId: 'form-dark-briefing',
    visualStyle: 'dark',
    layout: 'stacked',
    showTitle: true,
    showDescription: true,
    introBadge: 'Briefing',
    supportText: 'Invia note, materiali o contatti urgenti',
  }, {
    background: { type: 'color', value: '#0f172a' },
    typography: { color: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.1)', radius: '20px' },
  }),
  template('form-minimal-clean', 'Minimal Clean', 'Form pulito per landing e pagine istituzionali.', {
    templateId: 'form-minimal-clean',
    visualStyle: 'minimal',
    layout: 'stacked',
    showTitle: true,
    showDescription: true,
    introBadge: '',
    supportText: '',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#f1f5f9', radius: '18px' },
  }),
];

export function getSocialTemplate(templateId: string) {
  return SOCIAL_BLOCK_TEMPLATES.find((template) => template.id === templateId) || null;
}

export function getCmsFormTemplate(templateId: string) {
  return CMS_FORM_TEMPLATES.find((template) => template.id === templateId) || null;
}
