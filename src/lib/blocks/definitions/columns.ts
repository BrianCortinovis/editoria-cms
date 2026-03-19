import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const columnsBlock: BlockDefinition = {
  type: 'columns',
  label: 'Colonne',
  description: 'Layout a colonne flessibile con gap e allineamento',
  icon: 'Columns3',
  category: 'layout',
  defaultProps: {
    columnCount: 2,
    columnWidths: ['50%', '50%'],
    gap: '24px',
    stackOnMobile: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'row',
      gap: '24px',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '1200px',
      alignItems: 'stretch',
    },
  },
  supportsChildren: true,
};

registerBlock(columnsBlock);
