import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const bannerAdBlock: BlockDefinition = {
  type: 'banner-ad',
  label: 'Banner ADV',
  description: 'Spazio pubblicitario con tutti i formati IAB standard',
  icon: 'Megaphone',
  category: 'monetization',
  defaultProps: {
    format: 'leaderboard',
    width: 728,
    height: 90,
    adCode: '',
    fallbackImage: '',
    fallbackUrl: '',
    label: 'Pubblicità',
    showLabel: true,
    responsive: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: { top: '16px', right: '0', bottom: '16px', left: '0' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'color',
      value: '#f5f5f5',
    },
  },
  supportsChildren: false,
};

registerBlock(bannerAdBlock);
