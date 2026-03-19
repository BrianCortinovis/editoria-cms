import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const eventListBlock: BlockDefinition = {
  type: 'event-list',
  label: 'Lista Eventi',
  description: 'Lista degli eventi prossimi con data, luogo e dettagli',
  icon: 'CalendarDays',
  category: 'editorial',
  defaultProps: {
    limit: 5,
    showLocation: true,
    showPrice: false,
    layout: 'list',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: { top: '24px', right: '0', bottom: '24px', left: '0' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '1200px',
    },
  },
  supportsChildren: false,
  defaultDataSource: {
    endpoint: 'events',
    params: { limit: '5' },
  },
};

registerBlock(eventListBlock);
