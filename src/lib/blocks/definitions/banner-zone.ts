import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const bannerZoneBlock: BlockDefinition = {
  type: 'banner-zone',
  label: 'Zona Banner',
  description: 'Zona pubblicitaria che carica banner dal CMS per posizione',
  icon: 'Megaphone',
  category: 'monetization',
  defaultProps: {
    position: 'sidebar',
    fallbackHtml: '',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      minHeight: '90px',
    },
    background: { type: 'color', value: '#f8f9fa' },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'banners',
    params: { position: 'sidebar' },
  },
};

registerBlock(bannerZoneBlock);
