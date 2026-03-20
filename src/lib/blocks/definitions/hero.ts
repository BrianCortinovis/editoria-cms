import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const heroBlock: BlockDefinition = {
  type: 'hero',
  label: 'Hero',
  description: 'Sezione hero con titolo, sottotitolo, sfondo parallax, video e CTA',
  icon: 'Layers',
  category: 'editorial',
  defaultProps: {
    title: 'Titolo Principale',
    subtitle: 'Sottotitolo di supporto',
    ctaText: 'Scopri di più',
    ctaUrl: '#',
    ctaStyle: 'primary',
    titleTag: 'h1',
    alignment: 'center',
    overlayOpacity: 0.5,
    overlayColor: '#000000',
    videoUrl: '',
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: { top: '120px', right: '48px', bottom: '120px', left: '48px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
      minHeight: '600px',
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

registerBlock(heroBlock);
