import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const counterBlock: BlockDefinition = {
  type: 'counter',
  label: 'Contatori',
  description: 'Contatori animati per statistiche e numeri',
  icon: 'BarChart3',
  category: 'interactive',
  defaultProps: {
    counters: [
      { id: '1', value: 1500, label: 'Clienti', prefix: '', suffix: '+', duration: 2000 },
      { id: '2', value: 350, label: 'Progetti', prefix: '', suffix: '', duration: 2000 },
      { id: '3', value: 99, label: 'Soddisfazione', prefix: '', suffix: '%', duration: 2000 },
      { id: '4', value: 10, label: 'Anni Esperienza', prefix: '', suffix: '', duration: 2000 },
    ],
    animated: true,
    triggerOnScroll: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '48px',
      padding: { top: '48px', right: '32px', bottom: '48px', left: '32px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'color',
      value: '#1a1a2e',
    },
    typography: {
      color: '#ffffff',
      textAlign: 'center',
    },
  },
  supportsChildren: false,
};

registerBlock(counterBlock);
