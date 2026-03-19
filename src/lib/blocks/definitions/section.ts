import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const sectionBlock: BlockDefinition = {
  type: 'section',
  label: 'Sezione',
  description: 'Contenitore sezione con sfondo, padding e forme personalizzate',
  icon: 'Square',
  category: 'layout',
  defaultProps: {
    tag: 'section',
    fullWidth: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      minHeight: '200px',
    },
    background: { type: 'none', value: '' },
  },
  supportsChildren: true,
};

registerBlock(sectionBlock);
