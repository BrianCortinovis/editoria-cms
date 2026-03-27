import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const articleHeroBlock: BlockDefinition = {
  type: 'article-hero',
  label: 'Hero Articolo',
  description: 'Banner hero con articolo in evidenza, immagine di sfondo e overlay',
  icon: 'Newspaper',
  category: 'editorial',
  defaultProps: {
    templateId: 'article-hero-cover-story',
    sourceMode: 'automatic',
    autoSource: 'featured',
    articleSlug: '',
    placementSlotId: '',
    manualArticleIds: [],
    useFeatured: true,
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    contentAlign: 'left',
    contentWidth: '780px',
    contentOffsetX: 0,
    contentOffsetY: 0,
    panelStyle: 'none',
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
    params: {
      sourceMode: 'automatic',
      autoSource: 'featured',
      featured: 'true',
      limit: '1',
    },
  },
};

registerBlock(articleHeroBlock);
