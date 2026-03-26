import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const newsletterSignupBlock: BlockDefinition = {
  type: 'newsletter-signup',
  label: 'Iscrizione Newsletter',
  description: 'Form di iscrizione alla newsletter della testata',
  icon: 'Mail',
  category: 'editorial',
  defaultProps: {
    mode: 'global',
    title: 'Resta aggiornato',
    description: 'Iscriviti alla nostra newsletter per ricevere le notizie più importanti.',
    buttonText: 'Iscriviti',
    buttonPaddingX: 20,
    buttonPaddingY: 14,
    buttonRadius: 12,
    placeholder: 'La tua email',
    privacyText: 'Iscrivendoti accetti informative e comunicazioni editoriali.',
    formSlug: '',
    compact: false,
    style: 'inline',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: { top: '48px', right: '24px', bottom: '48px', left: '24px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '600px',
    },
    background: { type: 'color', value: '#f8f9fa' },
    border: { radius: '12px' },
    typography: { textAlign: 'center' },
  },
  defaultDataSource: {
    endpoint: 'site-newsletter',
    params: {},
  },
  supportsChildren: false,
};

registerBlock(newsletterSignupBlock);
