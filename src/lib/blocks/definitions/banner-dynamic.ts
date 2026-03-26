import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const bannerDynamicBlock: BlockDefinition = {
  type: 'banner-dynamic',
  label: 'Banner Dinamico',
  description: 'Banner con transizioni, effetti, carousel e contenuti animati',
  icon: 'Megaphone',
  category: 'editorial',
  defaultProps: {
    layout: 'carousel',
    banners: [
      {
        id: 'banner-1',
        title: 'Primo Banner',
        description: 'Descrizione del primo banner',
        image: '',
        url: '',
        buttonText: 'Scopri di più',
        animation: 'fadeIn',
        duration: 0.8,
        delay: 0,
      },
      {
        id: 'banner-2',
        title: 'Secondo Banner',
        description: 'Descrizione del secondo banner',
        image: '',
        url: '',
        buttonText: 'Scopri di più',
        animation: 'slideInRight',
        duration: 0.8,
        delay: 0.2,
      },
    ],
    autoplay: true,
    autoplayInterval: 5000,
    transitionDuration: 600,
    transitionType: 'fade',
    showDots: true,
    showArrows: true,
    loop: true,
    height: 400,
    overlayOpacity: 0.3,
    overlayColor: '#000000',
    effectType: 'none',
    enableParallax: false,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'color',
      value: '#000000',
    },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'banners',
    params: {},
  },
};

registerBlock(bannerDynamicBlock);
