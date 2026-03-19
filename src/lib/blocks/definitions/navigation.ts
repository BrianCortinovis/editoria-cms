import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const navigationBlock: BlockDefinition = {
  type: 'navigation',
  label: 'Navigazione',
  description: 'Barra di navigazione con logo, menu, mega menu e hamburger mobile',
  icon: 'Menu',
  category: 'interactive',
  defaultProps: {
    logo: { type: 'text', value: 'SiteName' },
    items: [
      { id: '1', label: 'Home', url: '/', children: [] },
      { id: '2', label: 'Chi Siamo', url: '/chi-siamo', children: [] },
      { id: '3', label: 'Servizi', url: '/servizi', children: [
        { id: '3a', label: 'Web Design', url: '/servizi/web-design' },
        { id: '3b', label: 'SEO', url: '/servizi/seo' },
      ]},
      { id: '4', label: 'Contatti', url: '/contatti', children: [] },
    ],
    sticky: true,
    transparent: false,
    hamburgerBreakpoint: 768,
    ctaButton: { text: '', url: '' },
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: { top: '16px', right: '32px', bottom: '16px', left: '32px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      position: 'sticky',
      zIndex: 1000,
    },
    background: {
      type: 'color',
      value: '#ffffff',
    },
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  supportsChildren: false,
};

registerBlock(navigationBlock);
