import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const cmsFormBlock: BlockDefinition = {
  type: 'cms-form',
  label: 'Form CMS',
  description: 'Collega un form creato nel CMS e renderizza i suoi campi nel layout',
  icon: 'FormInput',
  category: 'editorial',
  defaultProps: {
    templateId: 'form-editorial-card',
    formSlug: '',
    showTitle: true,
    showDescription: true,
    submitButtonText: '',
    buttonPaddingX: 20,
    buttonPaddingY: 14,
    buttonRadius: 12,
    layout: 'stacked',
    visualStyle: 'editorial',
    introBadge: 'Contatti redazione',
    supportText: 'Ti rispondiamo dal desk entro 24 ore',
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '720px',
    },
    background: {
      type: 'color',
      value: '#ffffff',
    },
    border: {
      width: '1px',
      style: 'solid',
      color: '#e5e7eb',
      radius: '16px',
    },
  },
  defaultDataSource: {
    endpoint: 'forms',
    params: {},
  },
  supportsChildren: false,
};

registerBlock(cmsFormBlock);
