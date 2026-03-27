import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const customHtmlBlock: BlockDefinition = {
  type: 'custom-html',
  label: 'HTML Custom',
  description: 'Blocco HTML/CSS avanzato in iframe sicuro, ideale per layout personalizzati e animazioni CSS',
  icon: 'FileCode',
  category: 'content',
  defaultProps: {
    html: '<div style="padding: 24px; text-align: center;">\n  <p>Il tuo HTML personalizzato qui</p>\n</div>',
    css: '',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '100%',
    },
  },
  supportsChildren: false,
};

registerBlock(customHtmlBlock);
