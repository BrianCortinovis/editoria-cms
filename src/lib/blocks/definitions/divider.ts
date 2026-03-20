import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const dividerBlock: BlockDefinition = {
  type: 'divider',
  label: 'Divisore',
  description: 'Divisore con forme: diagonale, onda, zigzag, curva, triangolo, freccia',
  icon: 'Minus',
  category: 'layout',
  defaultProps: {
    shape: 'wave',
    height: 80,
    color: '#ffffff',
    backgroundColor: 'transparent',
    flip: false,
    invert: false,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '-1px', right: '0', bottom: '-1px', left: '0' },
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
    },
  },
  supportsChildren: false,
};

registerBlock(dividerBlock);
