import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const articleHeroBlock: BlockDefinition = {
  type: 'article-hero',
  label: 'Hero Articolo',
  description: 'Banner hero con articolo in evidenza, immagine di sfondo e overlay',
  icon: 'Newspaper',
  category: 'editorial',
  defaultProps: {
    articleSlug: '',
    useFeatured: true,
    overlayColor: 'rgba(0,0,0,0.5)',
    showCategory: true,
    showAuthor: true,
    showDate: true,
    showExcerpt: true,
    height: '500px',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      minHeight: '500px',
      overflow: 'hidden',
    },
    background: { type: 'image', value: '' },
    typography: { color: '#ffffff' },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'articles',
    params: { featured: 'true', limit: '1' },
  },
};

registerBlock(articleHeroBlock);
