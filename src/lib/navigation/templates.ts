import type { BlockStyle } from '@/lib/types/block';
import type { SiteMenuItem } from '@/lib/site/navigation';

export interface NavigationTemplate {
  id: string;
  name: string;
  description: string;
  group: 'top' | 'bottom' | 'side' | 'mixed';
  props: Record<string, unknown>;
  style: Partial<BlockStyle>;
  items: SiteMenuItem[];
}

export function cloneNavigationItems(items: SiteMenuItem[]): SiteMenuItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneNavigationItems(item.children) : [],
  }));
}

const editorialItems: SiteMenuItem[] = [
  { id: 'home', label: 'Home', url: '/', icon: 'home' },
  { id: 'cronaca', label: 'Cronaca', url: '/categoria/cronaca', icon: 'newspaper', badge: 'Live' },
  { id: 'sport', label: 'Sport', url: '/categoria/sport', icon: 'activity' },
  { id: 'video', label: 'TG Video', url: '/video', icon: 'play' },
  { id: 'desk', label: 'Desk', url: '/desk', icon: 'layers' },
];

const serviceItems: SiteMenuItem[] = [
  { id: 'news', label: 'Notizie', url: '/notizie', icon: 'newspaper' },
  { id: 'territorio', label: 'Territorio', url: '/territorio', icon: 'map' },
  { id: 'eventi', label: 'Eventi', url: '/eventi', icon: 'calendar' },
  { id: 'newsletter', label: 'Newsletter', url: '/newsletter', icon: 'mail' },
  { id: 'contatti', label: 'Contatti', url: '/contatti', icon: 'phone' },
];

function template(
  id: string,
  name: string,
  description: string,
  group: NavigationTemplate['group'],
  props: Record<string, unknown>,
  style: Partial<BlockStyle>,
  items: SiteMenuItem[] = editorialItems
): NavigationTemplate {
  return { id, name, description, group, props, style, items: cloneNavigationItems(items) };
}

export const NAVIGATION_TEMPLATES: NavigationTemplate[] = [
  template('top-classic', 'Top Classic', 'Barra pulita alta, newsroom classica.', 'top', {
    layout: 'horizontal', variant: 'inline', placement: 'top', justify: 'space-between', sticky: true, showIcons: false,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '0 0 1px 0', style: 'solid', color: '#e5e7eb' },
    shadow: '0 1px 0 rgba(15,23,42,0.06)',
  }),
  template('top-newsbar', 'Top Newsbar', 'Stile testata con badge live e CTA.', 'top', {
    layout: 'horizontal', variant: 'underline', placement: 'top', justify: 'space-between', sticky: true, showIcons: true, ctaText: 'Abbonati', ctaUrl: '/abbonati',
  }, {
    background: { type: 'color', value: '#ffffff' },
    typography: { textTransform: 'uppercase', letterSpacing: '0.04em' },
    shadow: '0 8px 24px rgba(15,23,42,0.06)',
  }),
  template('top-glass', 'Top Glass', 'Header trasparente blur per homepage moderne.', 'top', {
    layout: 'horizontal', variant: 'floating', placement: 'top', justify: 'space-between', sticky: true, showIcons: true,
  }, {
    background: { type: 'color', value: 'rgba(15,23,42,0.72)' },
    typography: { color: '#ffffff' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.14)', radius: '18px' },
    backdropFilter: 'blur(18px)',
    shadow: '0 18px 40px rgba(0,0,0,0.24)',
  }),
  template('top-pills', 'Top Pills', 'Menu a capsule con CTA.', 'top', {
    layout: 'horizontal', variant: 'pills', placement: 'top', justify: 'space-between', sticky: false, showIcons: true, ctaText: 'Segnala', ctaUrl: '/contatti',
  }, {
    background: { type: 'color', value: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '18px' },
  }),
  template('top-center-brand', 'Top Center', 'Brand centrato e menu elegante.', 'top', {
    layout: 'horizontal', variant: 'inline', placement: 'top', justify: 'center', sticky: false, showIcons: false, logoPosition: 'top',
  }, {
    background: { type: 'color', value: '#ffffff' },
    typography: { textAlign: 'center' },
  }),
  template('top-dark-strip', 'Top Dark Strip', 'Barra dark da magazine.', 'top', {
    layout: 'horizontal', variant: 'minimal', placement: 'top', justify: 'space-between', sticky: true, showIcons: true,
  }, {
    background: { type: 'color', value: '#0f172a' },
    typography: { color: '#f8fafc' },
    shadow: '0 10px 28px rgba(15,23,42,0.24)',
  }),
  template('top-split-editorial', 'Top Split', 'Logo a sinistra, menu e CTA forti.', 'top', {
    layout: 'horizontal', variant: 'boxed', placement: 'top', justify: 'space-between', sticky: false, showIcons: true, ctaText: 'Newsletter', ctaUrl: '/newsletter',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#dbeafe', radius: '16px' },
    shadow: '0 12px 30px rgba(37,99,235,0.08)',
  }, serviceItems),
  template('top-compact', 'Top Compact', 'Menu stretto ad alta densita.', 'top', {
    layout: 'horizontal', variant: 'inline', placement: 'top', justify: 'space-between', sticky: true, compact: true, itemGap: 14, showIcons: false,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '0 0 1px 0', style: 'solid', color: '#cbd5e1' },
  }),

  template('bottom-mobile-tabs', 'Bottom Tabs', 'Bottom bar mobile con icone.', 'bottom', {
    layout: 'horizontal', variant: 'minimal', placement: 'bottom', justify: 'space-around', sticky: true, showIcons: true, compact: true,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px 0 0 0', style: 'solid', color: '#dbeafe' },
    shadow: '0 -8px 24px rgba(15,23,42,0.12)',
  }),
  template('bottom-dark-dock', 'Bottom Dock', 'Dock scuro fisso in basso.', 'bottom', {
    layout: 'horizontal', variant: 'floating', placement: 'bottom', justify: 'space-around', sticky: true, showIcons: true,
  }, {
    background: { type: 'color', value: '#0f172a' },
    typography: { color: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.12)', radius: '20px' },
  }),
  template('bottom-soft-cta', 'Bottom CTA', 'Bottom bar morbida con pulsante finale.', 'bottom', {
    layout: 'horizontal', variant: 'pills', placement: 'bottom', justify: 'space-between', sticky: true, showIcons: true, ctaText: 'Apri app', ctaUrl: '/app',
  }, {
    background: { type: 'color', value: '#fff7ed' },
    border: { width: '1px', style: 'solid', color: '#fdba74', radius: '18px' },
  }, serviceItems),
  template('bottom-service-bar', 'Bottom Service', 'Barra bassa per utility e servizi.', 'bottom', {
    layout: 'horizontal', variant: 'underline', placement: 'bottom', justify: 'space-between', sticky: false, showIcons: true,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px 0 0 0', style: 'solid', color: '#e5e7eb' },
  }, serviceItems),

  template('side-editorial', 'Side Editorial', 'Sidebar sinistra da quotidiano digitale.', 'side', {
    layout: 'vertical', variant: 'sidebar', placement: 'left', justify: 'flex-start', sticky: false, showIcons: true, showDescriptions: true,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '18px' },
    shadow: '0 10px 28px rgba(15,23,42,0.08)',
  }),
  template('side-dark-rail', 'Side Dark Rail', 'Rail scuro laterale con icone.', 'side', {
    layout: 'vertical', variant: 'rail', placement: 'left', justify: 'flex-start', sticky: false, showIcons: true, compact: true,
  }, {
    background: { type: 'color', value: '#0f172a' },
    typography: { color: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.08)', radius: '20px' },
  }),
  template('side-glass', 'Side Glass', 'Sidebar blur per landing moderne.', 'side', {
    layout: 'vertical', variant: 'floating', placement: 'right', justify: 'flex-start', sticky: false, showIcons: true,
  }, {
    background: { type: 'color', value: 'rgba(255,255,255,0.12)' },
    border: { width: '1px', style: 'solid', color: 'rgba(255,255,255,0.2)', radius: '18px' },
    backdropFilter: 'blur(18px)',
  }, serviceItems),
  template('side-pills', 'Side Pills', 'Sidebar a capsule con sezioni rapide.', 'side', {
    layout: 'vertical', variant: 'pills', placement: 'left', justify: 'flex-start', sticky: false, showIcons: true,
  }, {
    background: { type: 'color', value: '#f8fafc' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '16px' },
  }),
  template('side-minimal', 'Side Minimal', 'Elenco testuale lato destro.', 'side', {
    layout: 'vertical', variant: 'minimal', placement: 'right', justify: 'flex-start', sticky: false, showIcons: false, compact: true,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e5e7eb', radius: '16px' },
  }, serviceItems),

  template('mixed-split-hero', 'Mixed Hero', 'Top bar + secondaria piu ricca.', 'mixed', {
    layout: 'horizontal', variant: 'boxed', placement: 'top', justify: 'space-between', sticky: false, showIcons: true, showDescriptions: true,
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#e2e8f0', radius: '20px' },
    shadow: '0 14px 36px rgba(15,23,42,0.08)',
  }, serviceItems),
  template('mixed-mega-strip', 'Mixed Strip', 'Fascia editoriale con voci e badge.', 'mixed', {
    layout: 'horizontal', variant: 'underline', placement: 'top', justify: 'space-between', sticky: true, showIcons: true, showDescriptions: false,
  }, {
    background: { type: 'color', value: '#fff1f2' },
    border: { width: '0 0 1px 0', style: 'solid', color: '#fecdd3' },
  }),
  template('mixed-logo-stack', 'Mixed Stack', 'Logo impilato e menu arioso.', 'mixed', {
    layout: 'horizontal', variant: 'inline', placement: 'top', justify: 'space-between', sticky: false, showIcons: true, logoPosition: 'top',
  }, {
    background: { type: 'color', value: '#ffffff' },
    typography: { textAlign: 'left' },
  }, serviceItems),
  template('mixed-capsule-rail', 'Mixed Rail', 'Via di mezzo tra topbar e side rail.', 'mixed', {
    layout: 'vertical', variant: 'rail', placement: 'left', justify: 'flex-start', sticky: false, showIcons: true, ctaText: 'Contatti', ctaUrl: '/contatti',
  }, {
    background: { type: 'color', value: '#ffffff' },
    border: { width: '1px', style: 'solid', color: '#dbeafe', radius: '18px' },
    shadow: '0 12px 26px rgba(37,99,235,0.1)',
  }),
];

export function getNavigationTemplate(templateId: string) {
  return NAVIGATION_TEMPLATES.find((template) => template.id === templateId) || null;
}
