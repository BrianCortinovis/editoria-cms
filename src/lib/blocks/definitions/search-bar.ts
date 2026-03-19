import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const searchBarBlock: BlockDefinition = {
  type: 'search-bar',
  label: 'Barra Ricerca',
  description: 'Barra di ricerca articoli con opzione ricerca semantica AI',
  icon: 'Search',
  category: 'editorial',
  defaultProps: {
    placeholder: 'Cerca articoli...',
    useAi: false,
    resultStyle: 'dropdown',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      padding: { top: '12px', right: '0', bottom: '12px', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '600px',
    },
  },
  supportsChildren: false,
};

registerBlock(searchBarBlock);
