import type { Block } from '@/lib/types/block';

interface GalleryImage {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  type?: string;
  badge?: string;
  link?: string;
  overlay?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    position?: string;
    color?: string;
  };
  buttons?: Array<{ id?: string; text?: string; url?: string; style?: string }>;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderImageGallery({ block, style }: Props) {
  const images = ((block.props.items as GalleryImage[]) || (block.props.images as GalleryImage[]) || [])
    .map((item) => ({
      ...item,
      url: String(item.url || item.src || '').trim(),
    }))
    .filter((item) => item.url.length > 0);
  const columns = (block.props.columns as number) || 3;
  const gap = (block.props.gap as string) || '0.5rem';
  const aspectRatio = (block.props.aspectRatio as string) || '1/1';
  const layout = (block.props.layout as string) || 'grid';
  const borderRadius = String(block.props.borderRadius || '8px');
  const showCaptions = block.props.showCaptions !== false;
  const captionPosition = String(block.props.captionPosition || 'below');
  const hoverEffect = String(block.props.hoverEffect || 'none');
  const buttonPaddingX = Number(block.props.buttonPaddingX || 14);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 10);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const buttonBgColor = String(block.props.buttonBgColor || '').trim();
  const buttonTextColor = String(block.props.buttonTextColor || '').trim();
  const buttonBorderColor = String(block.props.buttonBorderColor || '').trim();

  const renderFigure = (img: GalleryImage, i: number, masonry = false) => {
    const overlay = img.overlay;
    const hasOverlay = Boolean(overlay?.enabled && (overlay?.title || overlay?.description || (Array.isArray(img.buttons) && img.buttons.length > 0)));
    const media = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={img.alt || ''}
        style={{
          width: '100%',
          aspectRatio: masonry ? undefined : aspectRatio,
          objectFit: 'cover',
          display: 'block',
          transform: hoverEffect === 'zoom' ? 'scale(1)' : undefined,
          transition: hoverEffect === 'zoom' ? 'transform 220ms ease' : undefined,
          opacity: hoverEffect === 'fade' ? 0.96 : 1,
        }}
        loading="lazy"
      />
      </>
    );

    return (
      <figure key={i} style={{ margin: masonry ? `0 0 ${gap} 0` : 0, breakInside: masonry ? ('avoid' as const) : undefined, overflow: 'hidden', borderRadius, position: 'relative' }}>
        {img.link ? (
          <a href={img.link} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
            {media}
          </a>
        ) : media}
        {img.badge && (
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              zIndex: 2,
              padding: '0.25rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(15,23,42,0.75)',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {img.badge}
          </span>
        )}
        {hasOverlay && (
          <figcaption
            style={{
              position: 'absolute',
              inset:
                overlay?.position === 'center'
                  ? '0'
                  : overlay?.position === 'top'
                    ? '0 0 auto 0'
                    : 'auto 0 0 0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: overlay?.position === 'center' ? 'center' : overlay?.position === 'top' ? 'flex-start' : 'flex-end',
              gap: '0.45rem',
              padding: '1rem',
              background: overlay?.color || 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.82) 100%)',
              color: '#fff',
            }}
          >
            {overlay?.title && <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{overlay.title}</div>}
            {overlay?.description && <div style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.9 }}>{overlay.description}</div>}
            {Array.isArray(img.buttons) && img.buttons.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {img.buttons.map((button, buttonIndex) => {
                  const isSecondary = button.style === 'secondary' || button.style === 'outline';
                  return (
                    <a
                      key={button.id || `${img.alt || 'item'}-${buttonIndex}`}
                      href={button.url || img.link || '#'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
                        borderRadius: `${buttonRadius}px`,
                        textDecoration: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: buttonBgColor || (isSecondary ? 'transparent' : '#fff'),
                        color: buttonTextColor || (isSecondary ? '#fff' : '#0f172a'),
                        border: buttonBorderColor
                          ? `1px solid ${buttonBorderColor}`
                          : isSecondary
                            ? '1px solid rgba(255,255,255,0.72)'
                            : '1px solid transparent',
                      }}
                    >
                      {button.text || 'Apri'}
                    </a>
                  );
                })}
              </div>
            )}
          </figcaption>
        )}
        {showCaptions && img.caption && captionPosition === 'overlay' && !hasOverlay && (
          <figcaption style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '0.75rem 0.85rem', background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.82) 100%)', color: '#fff', fontSize: '0.82rem' }}>
            {img.caption}
          </figcaption>
        )}
        {showCaptions && img.caption && captionPosition !== 'overlay' && (
          <figcaption style={{ fontSize: '0.8rem', padding: '0.5rem', color: 'var(--e-color-textSecondary)' }}>
            {img.caption}
          </figcaption>
        )}
      </figure>
    );
  };

  if (images.length === 0) {
    return (
      <div style={{ ...style, padding: '2rem', textAlign: 'center', color: 'var(--e-color-textSecondary)' }} data-block="image-gallery">
        Nessuna immagine
      </div>
    );
  }

  if (layout === 'masonry') {
    return (
      <div
        style={{ ...style, columns: columns, columnGap: gap }}
        data-block="image-gallery"
      >
        {images.map((img, i) => renderFigure(img, i, true))}
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
      data-block="image-gallery"
    >
      {images.map((img, i) => renderFigure(img, i))}
    </div>
  );
}
