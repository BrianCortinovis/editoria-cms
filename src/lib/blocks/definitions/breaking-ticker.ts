import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const breakingTickerBlock: BlockDefinition = {
  type: 'breaking-ticker',
  label: 'Ticker Breaking News',
  description: 'Barra scorrevole con notizie dell\'ultima ora',
  icon: 'Zap',
  category: 'editorial',
  defaultProps: {
    speed: 50,
    icon: 'Zap',
    label: 'ULTIMA ORA',
    direction: 'left',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      alignItems: 'center',
      padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
    },
    background: { type: 'color', value: '#8B0000' },
    typography: { color: '#ffffff', fontWeight: '600', fontSize: '14px' },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'breaking-news',
    params: {},
    refreshInterval: 30,
  },
};

registerBlock(breakingTickerBlock);
