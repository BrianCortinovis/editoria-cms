import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const textBlock: BlockDefinition = {
  type: 'text',
  label: 'Testo',
  description: 'Blocco di testo ricco con editing inline, drop caps e formattazione completa',
  icon: 'Type',
  category: 'content',
  defaultProps: {
    content: '<p>Inserisci il tuo testo qui. Clicca due volte per modificare.</p>',
    dropCap: false,
    columns: 1,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '800px',
    },
    typography: {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      lineHeight: '1.7',
      color: '#333333',
    },
  },
  supportsChildren: false,
};

registerBlock(textBlock);
