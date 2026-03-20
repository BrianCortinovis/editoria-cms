import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const tabsBlock: BlockDefinition = {
  type: 'tabs',
  label: 'Tab',
  description: 'Contenuto a schede con navigazione tab',
  icon: 'SquareStack',
  category: 'content',
  defaultProps: {
    tabs: [
      { id: '1', title: 'Tab 1', content: '<p>Contenuto della prima scheda.</p>' },
      { id: '2', title: 'Tab 2', content: '<p>Contenuto della seconda scheda.</p>' },
      { id: '3', title: 'Tab 3', content: '<p>Contenuto della terza scheda.</p>' },
    ],
    activeTab: '1',
    style: 'default',
    alignment: 'left',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '900px',
    },
  },
  supportsChildren: false,
};

registerBlock(tabsBlock);
