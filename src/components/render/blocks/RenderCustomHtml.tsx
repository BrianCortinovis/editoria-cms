import type { Block } from '@/lib/types/block';
import { sanitizeCss, sanitizeHtml } from '@/lib/security/html';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

function buildSrcDoc(block: Block) {
  const html = sanitizeHtml(String(block.props.html || ''));
  const css = sanitizeCss(String(block.props.css || ''));
  const allowScripts = block.props.allowScripts === true;
  const js = allowScripts ? String(block.props.js || '').replace(/<\/script/gi, '<\\/script') : '';

  return `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: system-ui, sans-serif; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    ${js ? `<script>${js}<\/script>` : ''}
  </body>
</html>`;
}

export function RenderCustomHtml({ block, style }: Props) {
  const sandboxed = block.props.sandboxed !== false;
  const allowScripts = block.props.allowScripts === true;
  const sandbox = sandboxed
    ? ['allow-forms', 'allow-popups', 'allow-popups-to-escape-sandbox', allowScripts ? 'allow-scripts' : '']
        .filter(Boolean)
        .join(' ')
    : undefined;

  return (
    <div style={style} data-block="custom-html">
      <iframe
        title={String(block.label || 'Custom HTML')}
        srcDoc={buildSrcDoc(block)}
        sandbox={sandbox}
        style={{
          width: '100%',
          minHeight: typeof block.style.layout.minHeight === 'string' ? block.style.layout.minHeight : '220px',
          border: 'none',
          borderRadius: 'inherit',
          background: 'transparent',
        }}
      />
    </div>
  );
}
