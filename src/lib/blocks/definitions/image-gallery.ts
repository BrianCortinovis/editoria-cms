import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const imageGalleryBlock: BlockDefinition = {
  type: 'image-gallery',
  label: 'Galleria Immagini',
  description: 'Galleria media professionale con overlay, badge, lightbox e layout avanzati',
  icon: 'GalleryVerticalEnd',
  category: 'media',
  defaultProps: {
    items: [
      {
        id: '1', type: 'image', src: '', alt: 'Immagine 1', caption: 'Didascalia foto',
        overlay: { enabled: true, title: 'Titolo', description: 'Descrizione', position: 'bottom', color: 'rgba(0,0,0,0.5)' },
        buttons: [{ id: 'btn1', text: 'Vedi dettaglio', url: '#', style: 'primary' }],
        badge: '',
        link: '#',
      },
      {
        id: '2', type: 'video', src: '', alt: 'Video 1', caption: 'Video editoriale',
        overlay: { enabled: true, title: 'Video', description: '', position: 'center', color: 'rgba(0,0,0,0.4)' },
        buttons: [],
        badge: 'VIDEO',
        link: '#',
        videoUrl: '',
      },
      {
        id: '3', type: 'image', src: '', alt: 'Immagine 2', caption: '',
        overlay: { enabled: false },
        buttons: [],
        badge: '',
        link: '#',
      },
    ],
    layout: 'grid',
    columns: 3,
    gap: '12px',
    aspectRatio: '4/3',
    objectFit: 'cover',
    borderRadius: '8px',
    hoverEffect: 'zoom',
    lightbox: true,
    showCaptions: true,
    captionPosition: 'below',
    filterTags: [],
    showFilter: false,
    maxItems: 0,
    loadMore: false,
    animation: 'fade-in',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
};

registerBlock(imageGalleryBlock);
