import type { Block } from '@/lib/types/block';

interface SocialItem {
  id?: string;
  platform: string;
  url: string;
  enabled?: boolean;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

const brandColors: Record<string, string> = {
  facebook: '#1877f2',
  instagram: '#e1306c',
  twitter: '#0f172a',
  linkedin: '#0a66c2',
  youtube: '#ff0000',
  tiktok: '#111111',
};

export function RenderSocial({ block, style }: Props) {
  const items = ((block.props.platforms as SocialItem[]) || []).filter((item) => item.enabled !== false);
  const size = String(block.props.size || 'medium');
  const variant = String(block.props.style || 'rounded');
  const colorMode = String(block.props.colorMode || 'brand');
  const sizeMap = size === 'small' ? 38 : size === 'large' ? 54 : 46;

  return (
    <div style={{ ...style, display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: style.justifyContent || 'center' }} data-block="social">
      {items.map((item) => {
        const bg = colorMode === 'brand' ? (brandColors[item.platform] || 'var(--e-color-primary, #8B0000)') : 'var(--e-color-primary, #8B0000)';
        return (
          <a
            key={item.id || item.platform}
            href={item.url || '#'}
            target="_blank"
            rel="noreferrer"
            aria-label={item.platform}
            style={{
              width: sizeMap,
              height: sizeMap,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: variant === 'square' ? '14px' : '999px',
              background: bg,
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            {item.platform.slice(0, 2)}
          </a>
        );
      })}
    </div>
  );
}
