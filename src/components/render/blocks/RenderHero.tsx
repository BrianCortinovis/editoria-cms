import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderHero({ block, style }: Props) {
  const title = (block.props.title as string) || '';
  const subtitle = (block.props.subtitle as string) || '';
  const ctaText = (block.props.ctaText as string) || '';
  const ctaUrl = (block.props.ctaUrl as string) || '#';
  const backgroundImage = (block.props.backgroundImage as string) || '';
  const overlayOpacity = (block.props.overlayOpacity as number) ?? 0.5;
  const align = (block.props.textAlign as string) || 'center';

  return (
    <section
      style={{
        ...style,
        position: 'relative',
        minHeight: style.minHeight || '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}),
      }}
      data-block="hero"
    >
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,' + overlayOpacity + ')',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: align as React.CSSProperties['textAlign'],
          maxWidth: '800px',
          padding: '2rem',
        }}
      >
        {title && (
          <h1
            style={{
              fontFamily: 'var(--e-font-heading)',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 'bold',
              color: backgroundImage ? '#fff' : 'var(--e-color-text)',
              marginBottom: '1rem',
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              color: backgroundImage ? 'rgba(255,255,255,0.9)' : 'var(--e-color-textSecondary)',
              marginBottom: '2rem',
            }}
          >
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaUrl}
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--e-color-primary, #8B0000)',
              color: '#fff',
              borderRadius: 'var(--e-border-radius, 8px)',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
