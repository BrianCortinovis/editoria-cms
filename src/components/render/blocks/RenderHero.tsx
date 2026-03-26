import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderHero({ block, style }: Props) {
  const {
    background,
    backgroundImage: styleBackgroundImage,
    backgroundSize: styleBackgroundSize,
    backgroundPosition: styleBackgroundPosition,
    backgroundRepeat: styleBackgroundRepeat,
    ...restStyle
  } = style;
  const title = (block.props.title as string) || '';
  const subtitle = (block.props.subtitle as string) || '';
  const ctaText = (block.props.ctaText as string) || '';
  const ctaUrl = (block.props.ctaUrl as string) || '#';
  const ctaStyle = String(block.props.ctaStyle || 'primary');
  const ctaPaddingX = Number(block.props.ctaPaddingX || 22);
  const ctaPaddingY = Number(block.props.ctaPaddingY || 12);
  const ctaRadius = Number(block.props.ctaRadius || 14);
  const ctaFullWidth = Boolean(block.props.ctaFullWidth);
  const ctaBgColor = String(block.props.ctaBgColor || '').trim();
  const ctaTextColor = String(block.props.ctaTextColor || '').trim();
  const ctaBorderColor = String(block.props.ctaBorderColor || '').trim();
  const backgroundImage = (block.props.backgroundImage as string) || '';
  const eyebrow = String(block.props.eyebrow || '').trim();
  const eyebrowBgColor = String(block.props.eyebrowBgColor || '').trim();
  const eyebrowTextColor = String(block.props.eyebrowTextColor || '').trim();
  const overlayOpacity = (block.props.overlayOpacity as number) ?? 0.5;
  const overlayColor = String(block.props.overlayColor || '#000000');
  const titleTag = String(block.props.titleTag || 'h1').toLowerCase();
  const align = (block.props.textAlign as string) || (block.props.alignment as string) || 'center';
  const contentPosition = String(block.props.contentPosition || 'center');
  const contentWidth = String(block.props.contentWidth || '800px');
  const contentOffsetX = Number(block.props.contentOffsetX || 0);
  const contentOffsetY = Number(block.props.contentOffsetY || 0);
  const contentPaddingX = Number(block.props.contentPaddingX || 32);
  const contentPaddingY = Number(block.props.contentPaddingY || 32);
  const contentGap = Number(block.props.contentGap || 16);
  const ctaOffsetX = Number(block.props.ctaOffsetX || 0);
  const ctaOffsetY = Number(block.props.ctaOffsetY || 0);
  const panelStyle = String(block.props.panelStyle || 'none');
  const height = String(block.props.height || restStyle.minHeight || '60vh');
  const TitleTag = (['h1', 'h2', 'h3', 'div'].includes(titleTag) ? titleTag : 'h1') as 'h1' | 'h2' | 'h3' | 'div';
  const isLeft = contentPosition === 'left';
  const isRight = contentPosition === 'right';
  const isLightPanel = panelStyle === 'solid-light';
  const defaultCtaStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: isLightPanel ? 'var(--e-color-text, #111827)' : 'var(--e-color-primary, #8B0000)',
      color: '#ffffff',
      border: '1px solid transparent',
    },
    dark: {
      backgroundColor: '#0f172a',
      color: '#ffffff',
      border: '1px solid #0f172a',
    },
    light: {
      backgroundColor: '#ffffff',
      color: '#0f172a',
      border: '1px solid rgba(226,232,240,0.95)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: backgroundImage ? '#ffffff' : 'var(--e-color-text, #111827)',
      border: `1px solid ${backgroundImage ? 'rgba(255,255,255,0.88)' : 'var(--e-color-primary, #8B0000)'}`,
    },
    ghost: {
      backgroundColor: backgroundImage ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.06)',
      color: backgroundImage ? '#ffffff' : 'var(--e-color-text, #111827)',
      border: `1px solid ${backgroundImage ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.08)'}`,
      backdropFilter: backgroundImage ? 'blur(12px)' : undefined,
    },
  };
  const resolvedCtaStyle = defaultCtaStyles[ctaStyle] || defaultCtaStyles.primary;
  const ctaButtonStyle: React.CSSProperties = {
    display: ctaFullWidth ? 'block' : 'inline-block',
    width: ctaFullWidth ? '100%' : undefined,
    textAlign: 'center',
    padding: `${ctaPaddingY}px ${ctaPaddingX}px`,
    borderRadius: `${ctaRadius}px`,
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 180ms ease',
    transform: `translate(${ctaOffsetX}px, ${ctaOffsetY}px)`,
    ...resolvedCtaStyle,
  };

  if (ctaBgColor) ctaButtonStyle.backgroundColor = ctaBgColor;
  if (ctaTextColor) ctaButtonStyle.color = ctaTextColor;
  if (ctaBorderColor) ctaButtonStyle.border = `1px solid ${ctaBorderColor}`;

  const panelStyles: Record<string, React.CSSProperties> = {
    none: {},
    glass: {
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '24px',
      boxShadow: '0 18px 40px rgba(15,23,42,0.2)',
    },
    'solid-dark': {
      background: 'rgba(15,23,42,0.78)',
      borderRadius: '22px',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    'solid-light': {
      background: 'rgba(255,255,255,0.92)',
      borderRadius: '22px',
      border: '1px solid rgba(226,232,240,0.9)',
      boxShadow: '0 18px 34px rgba(15,23,42,0.08)',
    },
  };

  return (
    <section
      style={{
        ...restStyle,
        position: 'relative',
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isLeft ? 'flex-start' : isRight ? 'flex-end' : 'center',
        ...(backgroundImage ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : background ? {
          background,
        } : styleBackgroundImage ? {
          backgroundImage: styleBackgroundImage,
          backgroundSize: styleBackgroundSize,
          backgroundPosition: styleBackgroundPosition,
          backgroundRepeat: styleBackgroundRepeat,
        } : {}),
      }}
      data-block="hero"
    >
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}
      <div
        data-hero-part="content"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: `${contentGap}px`,
          textAlign: align as React.CSSProperties['textAlign'],
          maxWidth: contentWidth,
          padding: `${contentPaddingY}px ${contentPaddingX}px`,
          transform: `translate(${contentOffsetX}px, ${contentOffsetY}px)`,
          ...panelStyles[panelStyle],
        }}
      >
        {eyebrow && (
          <div style={{ display: 'inline-flex', alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start', padding: '0.28rem 0.7rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: eyebrowBgColor || (backgroundImage ? 'rgba(255,255,255,0.15)' : 'rgba(139,0,0,0.1)'), color: eyebrowTextColor || (backgroundImage ? '#fff' : 'var(--e-color-primary, #8B0000)') }}>
            {eyebrow}
          </div>
        )}
        {title && (
          <TitleTag
            style={{
              fontFamily: 'var(--e-font-heading)',
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 'bold',
              color: backgroundImage ? '#fff' : 'var(--e-color-text)',
              margin: 0,
            }}
          >
            {title}
          </TitleTag>
        )}
        {subtitle && (
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              color: backgroundImage ? 'rgba(255,255,255,0.9)' : 'var(--e-color-textSecondary)',
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            data-hero-part="cta"
            href={ctaUrl}
            style={ctaButtonStyle}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
