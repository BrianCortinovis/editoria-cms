import type { Block } from '@/lib/types/block';
import { sanitizeExternalUrl, sanitizeHtml } from '@/lib/security/html';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderBannerAd({ block, style }: Props) {
  const adCode = sanitizeHtml(String(block.props.adCode || ''));
  const fallbackImage = String(block.props.fallbackImage || '');
  const fallbackUrl = sanitizeExternalUrl(String(block.props.fallbackUrl || '#')) || '#';
  const width = Number(block.props.width || 728);
  const height = Number(block.props.height || 90);
  const label = String(block.props.label || 'Pubblicità');
  const showLabel = block.props.showLabel !== false;

  return (
    <div style={{ ...style, textAlign: 'center' }} data-block="banner-ad">
      {showLabel && (
        <div style={{ marginBottom: '0.35rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--e-color-textSecondary)' }}>
          {label}
        </div>
      )}
      {adCode ? (
        <iframe
          title={label}
          srcDoc={`<!doctype html><html><body style="margin:0">${adCode}</body></html>`}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          style={{ width: '100%', minHeight: `${height}px`, border: 'none', background: 'transparent' }}
        />
      ) : fallbackImage ? (
        <a href={fallbackUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'inline-block' }}>
          <img src={fallbackImage} alt={label} style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px`, objectFit: 'cover', borderRadius: '12px' }} />
        </a>
      ) : (
        <div style={{ width: '100%', maxWidth: `${width}px`, minHeight: `${height}px`, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px dashed var(--e-color-border, #dbe2ea)', color: 'var(--e-color-textSecondary)' }}>
          {label} {width}x{height}
        </div>
      )}
    </div>
  );
}
