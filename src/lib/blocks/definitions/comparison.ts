import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const comparisonBlock: BlockDefinition = {
  type: 'comparison',
  label: 'Before/After',
  description: 'Slider confronto prima/dopo con immagini',
  icon: 'SplitSquareHorizontal',
  category: 'media',
  defaultProps: {
    beforeImage: '',
    afterImage: '',
    beforeLabel: 'Prima',
    afterLabel: 'Dopo',
    initialPosition: 50,
    orientation: 'horizontal',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '900px',
      overflow: 'hidden',
    },
    border: {
      radius: '8px',
    },
  },
  supportsChildren: false,
};

registerBlock(comparisonBlock);
