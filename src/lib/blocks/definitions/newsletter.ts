import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const newsletterBlock: BlockDefinition = {
  type: 'newsletter',
  label: 'Newsletter',
  description: 'Form di iscrizione newsletter con titolo, descrizione e campo email',
  icon: 'Mail',
  category: 'interactive',
  defaultProps: {
    title: 'Iscriviti alla Newsletter',
    description: 'Ricevi le ultime novità direttamente nella tua casella di posta.',
    placeholder: 'La tua email',
    buttonText: 'Iscriviti',
    successMessage: 'Grazie per l\'iscrizione!',
    formAction: '',
    layout: 'inline',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: { top: '48px', right: '32px', bottom: '48px', left: '32px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '100%',
    },
    background: {
      type: 'color',
      value: '#f0f4f8',
    },
    typography: {
      textAlign: 'center',
    },
  },
  supportsChildren: false,
};

registerBlock(newsletterBlock);
