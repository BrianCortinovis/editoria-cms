import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

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
        content: 'Descrizione breve della tua azienda o progetto.',
      },
      {
        title: 'Link Utili',
        type: 'links',
        links: [
          { label: 'Home', url: '/' },
          { label: 'Servizi', url: '/servizi' },
          { label: 'Blog', url: '/blog' },
          { label: 'Contatti', url: '/contatti' },
        ],
      },
      {
        title: 'Contatti',
        type: 'contact',
        email: 'info@example.com',
        phone: '+39 000 000 0000',
        address: 'Via Example 1, Milano',
      },
    ],
    copyright: '© 2026 Il Tuo Sito. Tutti i diritti riservati.',
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
