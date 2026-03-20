import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const accordionBlock: BlockDefinition = {
  type: 'accordion',
  label: 'Accordion / FAQ',
  description: 'Pannelli espandibili per FAQ, dettagli e contenuti a comparsa',
  icon: 'ChevronDown',
  category: 'content',
  defaultProps: {
    items: [
      { id: '1', title: 'Domanda 1?', content: 'Risposta alla prima domanda.', open: false },
      { id: '2', title: 'Domanda 2?', content: 'Risposta alla seconda domanda.', open: false },
      { id: '3', title: 'Domanda 3?', content: 'Risposta alla terza domanda.', open: false },
    ],
    allowMultiple: false,
    iconPosition: 'right',
    animated: true,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '800px',
    },
  },
  supportsChildren: false,
};

registerBlock(accordionBlock);
