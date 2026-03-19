import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const articleGridBlock: BlockDefinition = {
  type: 'article-grid',
  label: 'Griglia Articoli',
  description: 'Griglia di articoli dal CMS con filtri per categoria, layout personalizzabile',
  icon: 'LayoutGrid',
  category: 'editorial',
  defaultProps: {
    columns: 3,
    limit: 9,
    categorySlug: '',
    showImage: true,
    showExcerpt: true,
    showCategory: true,
    showAuthor: true,
    showDate: true,
    cardStyle: 'default',
  },
  defaultStyle: {
    layout: {
      display: 'grid',
      gap: '24px',
      padding: { top: '24px', right: '0', bottom: '24px', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'articles',
    params: { limit: '9', status: 'published' },
  },
};

registerBlock(articleGridBlock);
