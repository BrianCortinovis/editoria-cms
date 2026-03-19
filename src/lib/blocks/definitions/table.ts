import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const tableBlock: BlockDefinition = {
  type: 'table',
  label: 'Tabella',
  description: 'Tabella dati con header, righe, colonne e stili personalizzabili',
  icon: 'Table',
  category: 'content',
  defaultProps: {
    headers: ['Colonna 1', 'Colonna 2', 'Colonna 3'],
    rows: [
      ['Dato 1', 'Dato 2', 'Dato 3'],
      ['Dato 4', 'Dato 5', 'Dato 6'],
      ['Dato 7', 'Dato 8', 'Dato 9'],
    ],
    striped: true,
    bordered: true,
    hoverable: true,
    responsive: true,
    headerStyle: 'dark',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '900px',
      overflow: 'auto',
    },
  },
  supportsChildren: false,
};

registerBlock(tableBlock);
