import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const authorBioBlock: BlockDefinition = {
  type: 'author-bio',
  label: 'Bio Autore',
  description: 'Scheda autore con foto, nome, ruolo, bio e link social',
  icon: 'UserCircle',
  category: 'editorial',
  defaultProps: {
    name: 'Nome Autore',
    role: 'Giornalista',
    bio: 'Breve biografia dell\'autore che comparirà sotto l\'articolo.',
    avatar: '',
    socialLinks: [
      { platform: 'twitter', url: '#' },
      { platform: 'linkedin', url: '#' },
    ],
    layout: 'horizontal',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      margin: { top: '32px', right: 'auto', bottom: '32px', left: 'auto' },
      width: '100%',
      maxWidth: '800px',
    },
    background: {
      type: 'color',
      value: '#f8f9fa',
    },
    border: {
      radius: '12px',
    },
  },
  supportsChildren: false,
};

registerBlock(authorBioBlock);
