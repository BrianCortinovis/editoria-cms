import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const carouselBlock: BlockDefinition = {
  type: 'carousel',
  label: 'Carosello',
  description: 'Carosello con card scorrevoli, contenuti multipli e navigazione',
  icon: 'GalleryHorizontalEnd',
  category: 'media',
  defaultProps: {
    templateId: 'carousel-editorial-rail',
    items: [
      { id: '1', type: 'article', image: '', title: 'Articolo in evidenza', excerpt: 'Breve descrizione dell\'articolo con anteprima del contenuto...',
        category: 'Politica', date: '2024-03-15', author: 'Mario Rossi', url: '#',
        badge: 'BREAKING',
        overlay: { enabled: true, position: 'bottom', color: 'rgba(0,0,0,0.6)' }
      },
      { id: '2', type: 'article', image: '', title: 'Secondo articolo', excerpt: 'Un altro articolo importante della giornata...',
        category: 'Economia', date: '2024-03-15', author: 'Laura Bianchi', url: '#',
        badge: '',
        overlay: { enabled: true, position: 'bottom', color: 'rgba(0,0,0,0.5)' }
      },
      { id: '3', type: 'card', image: '', title: 'Card elemento', description: 'Contenuto della card',
        buttons: [{ id: 'b1', text: 'Leggi', url: '#', style: 'primary' }],
        badge: 'NEW',
        overlay: { enabled: false }
      },
    ],
    scrollDirection: 'horizontal',
    scrollSnap: true,
    showArrows: true,
    showDots: true,
    autoplay: false,
    interval: 4000,
    loop: true,
    slidesPerView: 3,
    slidesPerViewTablet: 2,
    slidesPerViewMobile: 1,
    spaceBetween: 20,
    centeredSlides: false,
    freeScroll: false,
    transition: 'slide',
    transitionSpeed: 400,
    height: 'auto',
    cardStyle: 'elevated',
    arrowStyle: 'circle',
    controlsOffsetX: 0,
    controlsOffsetY: 0,
    buttonPaddingX: 14,
    buttonPaddingY: 10,
    buttonRadius: 12,
    buttonBgColor: '',
    buttonTextColor: '',
    buttonBorderColor: '',
    showCategory: true,
    showDate: true,
    showAuthor: true,
    showExcerpt: true,
    hoverEffect: 'lift',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
};

registerBlock(carouselBlock);
