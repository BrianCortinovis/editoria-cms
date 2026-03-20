import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const audioBlock: BlockDefinition = {
  type: 'audio',
  label: 'Audio',
  description: 'Player audio per podcast, musica e contenuti audio',
  icon: 'Music',
  category: 'media',
  defaultProps: {
    source: 'file',
    url: '',
    title: 'Titolo Audio',
    artist: '',
    coverImage: '',
    autoplay: false,
    loop: false,
    showWaveform: true,
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '800px',
    },
    background: {
      type: 'color',
      value: '#f8f9fa',
    },
    border: {
      radius: '12px',
    },
  },
  supportsChildren: false,
};

registerBlock(audioBlock);
