import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const codeBlock: BlockDefinition = {
  type: 'code',
  label: 'Codice',
  description: 'Blocco codice con syntax highlighting e copia',
  icon: 'Code',
  category: 'content',
  defaultProps: {
    code: '// Il tuo codice qui\nfunction hello() {\n  console.log("Hello World");\n}',
    language: 'javascript',
    showLineNumbers: true,
    highlightLines: [],
    filename: '',
    theme: 'dark',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '900px',
    },
  },
  supportsChildren: false,
};

registerBlock(codeBlock);
