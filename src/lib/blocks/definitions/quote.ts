import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const quoteBlock: BlockDefinition = {
  type: 'quote',
  label: 'Citazione',
  description: 'Blocco citazione con virgolette, autore e stile pull-quote',
  icon: 'Quote',
  category: 'content',
  defaultProps: {
    text: 'Inserisci qui la tua citazione.',
    author: 'Autore',
    source: '',
    style: 'default',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '32px', right: '48px', bottom: '32px', left: '48px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '800px',
    },
    typography: {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      fontWeight: '400',
      lineHeight: '1.5',
      color: '#333333',
      textAlign: 'center',
    },
    border: {
      width: '0 0 0 4px',
      style: 'solid',
      color: '#e63946',
    },
  },
  supportsChildren: false,
};

registerBlock(quoteBlock);
