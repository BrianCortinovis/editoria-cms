import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const containerBlock: BlockDefinition = {
  type: 'container',
  label: 'Contenitore',
  description: 'Contenitore generico per raggruppare blocchi con stile',
  icon: 'Box',
  category: 'layout',
  defaultProps: {
    tag: 'div',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: true,
};

registerBlock(containerBlock);
