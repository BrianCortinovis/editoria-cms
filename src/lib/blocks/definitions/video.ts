import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const videoBlock: BlockDefinition = {
  type: 'video',
  label: 'Video',
  description: 'Embed video da YouTube, Vimeo o self-hosted con player personalizzabile',
  icon: 'Play',
  category: 'media',
  defaultProps: {
    source: 'youtube',
    url: '',
    videoId: '',
    poster: '',
    autoplay: false,
    loop: false,
    muted: false,
    controls: true,
    aspectRatio: '16/9',
    objectFit: 'cover',
    caption: '',
    overlay: {
      enabled: true,
      title: 'Video',
      description: '',
      playButtonStyle: 'circle',
      playButtonSize: 'large',
      color: 'rgba(0,0,0,0.4)',
      position: 'center',
    },
    pip: false,
    chapters: [],
    thumbnail: {
      show: true,
      text: 'Guarda il video',
      style: 'overlay',
    },
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '960px',
      overflow: 'hidden',
    },
    border: {
      radius: '8px',
    },
  },
  supportsChildren: false,
};

registerBlock(videoBlock);
