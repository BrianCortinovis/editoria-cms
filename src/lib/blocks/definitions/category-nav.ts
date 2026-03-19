import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const categoryNavBlock: BlockDefinition = {
  type: 'category-nav',
  label: 'Navigazione Categorie',
  description: 'Menu di navigazione per categorie con stili pills, dropdown o sidebar',
  icon: 'FolderTree',
  category: 'editorial',
  defaultProps: {
    style: 'pills',
    showCount: false,
    colorMode: 'category',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      gap: '8px',
      padding: { top: '12px', right: '0', bottom: '12px', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'categories',
    params: {},
  },
};

registerBlock(categoryNavBlock);
