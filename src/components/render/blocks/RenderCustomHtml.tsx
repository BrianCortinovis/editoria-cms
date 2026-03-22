import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

function buildSrcDoc(block: Block) {
  const html = String(block.props.html || '');
  const css = String(block.props.css || '');
  const js = String(block.props.js || '');

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

  return (
    <div style={style} data-block="custom-html">
      <iframe
        title={String(block.label || 'Custom HTML')}
        srcDoc={buildSrcDoc(block)}
        sandbox={sandboxed ? 'allow-scripts allow-same-origin allow-forms' : undefined}
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
