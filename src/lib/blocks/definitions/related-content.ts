import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const relatedContentBlock: BlockDefinition = {
  type: 'related-content',
  label: 'Contenuti Correlati',
  description: 'Griglia di articoli e contenuti correlati con thumbnail',
  icon: 'LayoutList',
  category: 'editorial',
  defaultProps: {
    title: 'Articoli Correlati',
    items: [
      { id: '1', title: 'Articolo 1', excerpt: 'Breve anteprima...', image: '', url: '#', date: '2026-03-01' },
      { id: '2', title: 'Articolo 2', excerpt: 'Breve anteprima...', image: '', url: '#', date: '2026-03-10' },
      { id: '3', title: 'Articolo 3', excerpt: 'Breve anteprima...', image: '', url: '#', date: '2026-03-15' },
    ],
    columns: 3,
    showDate: true,
    showExcerpt: true,
    showImage: true,
    cardStyle: 'elevated',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
};

registerBlock(relatedContentBlock);
