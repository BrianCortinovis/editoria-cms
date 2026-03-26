import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const bannerModuleBlock: BlockDefinition = {
  type: 'banner-module',
  label: 'Modulo Banner Pubblicitario',
  description: 'Gestione banner configurabili (colonne, righe, grid, caroselli)',
  icon: 'Images',
  category: 'monetization',
  defaultProps: {
    layout: 'single', // single, column-single, column-double, column-triple, row, grid-2x2, carousel
    banners: [
      {
        id: 'banner-1',
        imageUrl: '',
        link: '',
        altText: 'Banner 1',
        duration: 0,
      },
    ],
    carouselEnabled: false,
    carouselSpeed: 5,
    carouselAutoPlay: true,
    aspectRatio: '1/1', // 1/1 quadrato, 16/9, 4/3, 3/4, 2/1, ecc
    showControls: true,
  },
  defaultStyle: {
    layout: {
      width: '100%',
      maxWidth: '100%',
      padding: { top: '12px', right: '12px', bottom: '12px', left: '12px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      display: 'flex',
      gap: '12px',
    },
    background: { type: 'color', value: 'transparent' },
  },
  supportsChildren: false,
};

registerBlock(bannerModuleBlock);
