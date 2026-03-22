import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const footerBlock: BlockDefinition = {
  type: 'footer',
  label: 'Footer',
  description: 'Footer con colonne, link, social, copyright e newsletter',
  icon: 'PanelBottom',
  category: 'interactive',
  defaultProps: {
    columns: [
      {
        title: 'Chi Siamo',
        type: 'text',
        content: '',
      },
      {
        title: 'Link Utili',
        type: 'links',
        links: [],
      },
      {
        title: 'Contatti',
        type: 'contact',
        email: '',
        phone: '',
        address: '',
      },
    ],
    copyright: '',
    socialLinks: [
      { platform: 'facebook', url: '#' },
      { platform: 'instagram', url: '#' },
      { platform: 'twitter', url: '#' },
    ],
    showNewsletter: false,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '48px', right: '32px', bottom: '24px', left: '32px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'color',
      value: '#1a1a2e',
    },
    typography: {
      color: '#cccccc',
      fontSize: '14px',
    },
  },
  supportsChildren: false,
};

registerBlock(footerBlock);
