import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const timelineBlock: BlockDefinition = {
  type: 'timeline',
  label: 'Timeline',
  description: 'Timeline cronologica con eventi, date e contenuti',
  icon: 'Clock',
  category: 'content',
  defaultProps: {
    events: [
      { id: '1', date: '2024', title: 'Evento 1', description: 'Descrizione evento.', icon: '' },
      { id: '2', date: '2025', title: 'Evento 2', description: 'Descrizione evento.', icon: '' },
      { id: '3', date: '2026', title: 'Evento 3', description: 'Descrizione evento.', icon: '' },
    ],
    layout: 'alternating',
    lineColor: '#e63946',
    animated: true,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
      margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
      width: '100%',
      maxWidth: '900px',
    },
  },
  supportsChildren: false,
};

registerBlock(timelineBlock);
