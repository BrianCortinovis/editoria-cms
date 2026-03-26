import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const socialBlock: BlockDefinition = {
  type: 'social',
  label: 'Social',
  description: 'Icone social media e pulsanti di condivisione',
  icon: 'Share2',
  category: 'interactive',
  defaultProps: {
    mode: 'links',
    templateId: 'social-editorial-row',
    platforms: [
      { id: 'fb', platform: 'facebook', label: 'Facebook', handle: '@testata', url: '#', enabled: true, badge: 'Live' },
      { id: 'ig', platform: 'instagram', label: 'Instagram', handle: '@testata', url: '#', enabled: true },
      { id: 'tw', platform: 'x', label: 'X', handle: '@testata', url: '#', enabled: true },
      { id: 'li', platform: 'linkedin', label: 'LinkedIn', handle: '/company/testata', url: '#', enabled: true },
      { id: 'yt', platform: 'youtube', label: 'YouTube', handle: '@testata', url: '#', enabled: false },
      { id: 'tk', platform: 'tiktok', label: 'TikTok', handle: '@testata', url: '#', enabled: false },
    ],
    title: 'Seguici',
    description: 'Canali ufficiali della testata',
    style: 'pill',
    size: 'medium',
    colorMode: 'brand',
    alignment: 'center',
    showLabels: true,
    showHandles: false,
    showBadges: true,
    layoutStyle: 'pill',
    itemGap: 14,
    iconSize: 46,
    paddingX: 14,
    paddingY: 10,
    itemWidth: 320,
    itemRadius: 16,
    iconShape: 'auto',
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
