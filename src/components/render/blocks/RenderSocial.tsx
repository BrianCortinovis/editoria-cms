import type { Block } from '@/lib/types/block';
import { SOCIAL_PLATFORMS } from '@/lib/social/platforms';

interface SocialItem {
  id?: string;
  platform: string;
  label?: string;
  handle?: string;
  badge?: string;
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
  x: '#0f172a',
  linkedin: '#0a66c2',
  youtube: '#ff0000',
  tiktok: '#111111',
  telegram: '#229ED9',
  whatsapp: '#25D366',
  threads: '#111111',
  pinterest: '#BD081C',
  reddit: '#FF4500',
  mastodon: '#6364ff',
  bluesky: '#1185fe',
};

const platformGlyphs: Record<string, string> = {
  facebook: 'f',
  instagram: 'ig',
  twitter: 'x',
  x: 'x',
  linkedin: 'in',
  youtube: 'yt',
  tiktok: 'tt',
  telegram: 'tg',
  whatsapp: 'wa',
  threads: '@',
  pinterest: 'p',
  reddit: 'r',
  mastodon: 'm',
  bluesky: 'bs',
};

export function RenderSocial({ block, style }: Props) {
  const items = ((block.props.platforms as SocialItem[]) || []).filter((item) => item.enabled !== false);
  const size = String(block.props.size || 'medium');
  const variant = String(block.props.style || 'pill');
  const layoutStyle = String(block.props.layoutStyle || variant || 'pill');
  const colorMode = String(block.props.colorMode || 'brand');
  const title = String(block.props.title || '').trim();
  const description = String(block.props.description || '').trim();
  const showLabels = (block.props.showLabels as boolean) ?? true;
  const showHandles = (block.props.showHandles as boolean) ?? false;
  const showBadges = (block.props.showBadges as boolean) ?? true;
  const iconSize = Number(block.props.iconSize || (size === 'small' ? 38 : size === 'large' ? 54 : 46));
  const itemGap = Number(block.props.itemGap || (layoutStyle === 'card' ? 14 : 12));
  const paddingX = Number(block.props.paddingX || (layoutStyle === 'card' ? 16 : 10));
  const paddingY = Number(block.props.paddingY || (layoutStyle === 'card' ? 15 : 8));
  const itemWidth = Number(block.props.itemWidth || 320);
  const itemRadius = Number(block.props.itemRadius || (layoutStyle === 'card' ? 16 : 999));
  const iconShape = String(block.props.iconShape || 'auto');
  const isCard = layoutStyle === 'card';
  const isToolbar = layoutStyle === 'toolbar';
  const isGlass = layoutStyle === 'glass';
  const containerAlign =
    String(block.props.alignment || 'center') === 'left'
      ? 'flex-start'
      : String(block.props.alignment || 'center') === 'right'
        ? 'flex-end'
        : String(block.props.alignment || 'center') === 'stretch'
          ? 'stretch'
          : 'center';

  return (
    <section style={{ ...style, display: 'flex', flexDirection: 'column', gap: '1rem' }} data-block="social">
      {(title || description) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h3>}
          {description && <p style={{ margin: 0, opacity: 0.72 }}>{description}</p>}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${itemGap}px`,
          justifyContent: style.justifyContent || containerAlign,
          alignItems: containerAlign === 'stretch' ? 'stretch' : 'center',
        }}
      >
        {items.map((item) => {
          const spec = SOCIAL_PLATFORMS.find((platform) => platform.key === item.platform);
          const bg = colorMode === 'brand'
            ? (brandColors[item.platform] || 'var(--e-color-primary, #8B0000)')
            : colorMode === 'soft'
              ? 'rgba(148,163,184,0.14)'
              : 'var(--e-color-primary, #8B0000)';
          const fg = colorMode === 'mono' ? 'var(--e-color-text, #111827)' : '#fff';
          const glyph = platformGlyphs[item.platform] || item.platform.slice(0, 2);
          const label = item.label || spec?.label || item.platform;

          const iconBubble = (
            <span
              style={{
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                minWidth: `${iconSize}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: iconShape === 'square' || variant === 'square' ? '14px' : iconShape === 'rounded' ? '18px' : '999px',
                background: isToolbar ? 'transparent' : bg,
                color: fg,
                fontWeight: 700,
                textTransform: 'uppercase',
                border: isToolbar ? '1px solid rgba(148,163,184,0.26)' : 'none',
              }}
            >
              {glyph}
            </span>
          );

          return (
            <a
              key={item.id || item.platform}
              href={item.url || '#'}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: isCard ? 'space-between' : 'flex-start',
                gap: '0.75rem',
                width: isCard ? `min(${itemWidth}px, 100%)` : 'auto',
                minWidth: isToolbar ? 'unset' : undefined,
                padding: showLabels || isCard || showHandles ? `${paddingY}px ${paddingX}px` : 0,
                borderRadius: `${itemRadius}px`,
                background: isGlass
                  ? 'rgba(255,255,255,0.14)'
                  : isCard
                    ? 'var(--e-color-surface, rgba(255,255,255,0.9))'
                    : 'transparent',
                backdropFilter: isGlass ? 'blur(18px)' : undefined,
                border: isCard ? '1px solid rgba(148,163,184,0.16)' : 'none',
                color: 'var(--e-color-text, #111827)',
                textDecoration: 'none',
                boxShadow: isCard ? '0 10px 30px rgba(15,23,42,0.08)' : 'none',
              }}
            >
              {iconBubble}

              {(showLabels || isCard || showHandles) && (
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.16rem' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'inherit' }}>{label}</span>
                  {showHandles && item.handle && (
                    <span style={{ fontSize: '0.78rem', opacity: 0.72 }}>{item.handle}</span>
                  )}
                </span>
              )}

              {showBadges && item.badge && (
                <span
                  style={{
                    marginLeft: isCard ? 'auto' : 0,
                    padding: '0.14rem 0.42rem',
                    borderRadius: '999px',
                    background: 'var(--e-color-primary, #8B0000)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
