import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const socialBlock: BlockDefinition = {
  type: 'social',
  label: 'Social',
  description: 'Icone social media e pulsanti di condivisione',
  icon: 'Share2',
  category: 'interactive',
  defaultProps: {
    mode: 'links',
    platforms: [
      { id: 'fb', platform: 'facebook', url: '#', enabled: true },
      { id: 'ig', platform: 'instagram', url: '#', enabled: true },
      { id: 'tw', platform: 'twitter', url: '#', enabled: true },
      { id: 'li', platform: 'linkedin', url: '#', enabled: true },
      { id: 'yt', platform: 'youtube', url: '#', enabled: false },
      { id: 'tk', platform: 'tiktok', url: '#', enabled: false },
    ],
    style: 'rounded',
    size: 'medium',
    colorMode: 'brand',
    alignment: 'center',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
  },
  supportsChildren: false,
};

registerBlock(socialBlock);
