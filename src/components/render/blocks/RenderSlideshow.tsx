'use client';

import { useEffect, useState } from 'react';
import type { Block } from '@/lib/types/block';

interface SlideButton {
  id?: string;
  text?: string;
  url?: string;
  style?: string;
}

interface Slide {
  id?: string;
  image?: string;
  title?: string;
  description?: string;
  overlay?: { enabled?: boolean; color?: string; position?: string };
  buttons?: SlideButton[];
  textStyle?: { titleSize?: string; titleWeight?: string | number; descSize?: string; color?: string };
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderSlideshow({ block, style }: Props) {
  const slides = ((block.props.slides as Slide[]) || []).filter((slide) => slide).map((slide) => ({
    ...slide,
    image: String(slide.image || '').trim(),
  }));
  const autoplay = Boolean(block.props.autoplay);
  const interval = Number(block.props.interval || 5000);
  const showDots = block.props.showDots !== false;
  const showArrows = block.props.showArrows !== false;
  const height = String(block.props.height || '500px');
  const objectFit = String(block.props.objectFit || 'cover') as React.CSSProperties['objectFit'];
  const contentPosition = String(block.props.contentPosition || 'bottom-left');
  const contentOffsetX = Number(block.props.contentOffsetX || 0);
  const contentOffsetY = Number(block.props.contentOffsetY || 0);
  const buttonsOffsetX = Number(block.props.buttonsOffsetX || 0);
  const buttonsOffsetY = Number(block.props.buttonsOffsetY || 0);
  const arrowStyle = String(block.props.arrowStyle || 'circle');
  const panelStyle = String(block.props.panelStyle || 'none');
  const buttonPaddingX = Number(block.props.buttonPaddingX || 16);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 12);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const buttonBgColor = String(block.props.buttonBgColor || '').trim();
  const buttonTextColor = String(block.props.buttonTextColor || '').trim();
  const buttonBorderColor = String(block.props.buttonBorderColor || '').trim();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoplay, interval, slides.length]);

  if (slides.length === 0) {
    return <div style={{ ...style, minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--e-color-textSecondary)' }}>Nessuna slide configurata</div>;
  }

  const current = slides[index];
  const contentPositionStyle: React.CSSProperties =
    contentPosition === 'center'
      ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', maxWidth: '680px' }
      : contentPosition === 'center-left'
        ? { left: '2rem', top: '50%', transform: 'translateY(-50%)', maxWidth: '620px' }
        : { left: '2rem', right: '2rem', bottom: '2rem' };
  const contentBaseTransform = typeof contentPositionStyle.transform === 'string' ? contentPositionStyle.transform : '';
  const panelStyles: Record<string, React.CSSProperties> = {
    none: {},
    glass: {
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(18px)',
      borderRadius: '22px',
      border: '1px solid rgba(255,255,255,0.16)',
      padding: '1rem 1.1rem',
      boxShadow: '0 18px 40px rgba(15,23,42,0.2)',
    },
    'solid-dark': {
      background: 'rgba(15,23,42,0.76)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '1rem 1.1rem',
    },
    'solid-light': {
      background: 'rgba(255,255,255,0.92)',
      color: '#0f172a',
      borderRadius: '20px',
      padding: '1rem 1.1rem',
    },
  };
  const arrowBaseStyle: React.CSSProperties = arrowStyle === 'square'
    ? { width: '44px', height: '44px', borderRadius: '12px' }
    : arrowStyle === 'minimal'
      ? { width: '32px', height: '32px', borderRadius: '999px', background: 'rgba(15,23,42,0.68)', color: '#fff' }
      : { width: '40px', height: '40px', borderRadius: '999px' };

  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden', borderRadius: 'inherit', height }} data-block="slideshow">
      {current.image ? (
        <img src={current.image} alt={current.title || ''} style={{ width: '100%', height: '100%', objectFit }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }} />
      )}

      {current.overlay?.enabled && (
        <div style={{ position: 'absolute', inset: 0, background: current.overlay.color || 'rgba(0,0,0,0.35)' }} />
      )}

      <div
        data-slideshow-part="content"
        style={{ position: 'absolute', color: current.textStyle?.color || '#fff', ...contentPositionStyle, transform: `${contentBaseTransform} translate(${contentOffsetX}px, ${contentOffsetY}px)`.trim() }}
      >
        <div style={panelStyles[panelStyle]}>
        {current.title && (
          <h3 style={{ fontSize: current.textStyle?.titleSize || '2rem', fontWeight: current.textStyle?.titleWeight || 800, marginBottom: '0.45rem' }}>
            {current.title}
          </h3>
        )}
        {current.description && (
          <p style={{ maxWidth: '640px', fontSize: current.textStyle?.descSize || '1rem', lineHeight: 1.6 }}>{current.description}</p>
        )}
        {Array.isArray(current.buttons) && current.buttons.length > 0 && (
          <div data-slideshow-part="buttons" style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem', transform: `translate(${buttonsOffsetX}px, ${buttonsOffsetY}px)` }}>
            {current.buttons.map((button) => (
              <a
                key={button.id || button.text}
                href={button.url || '#'}
                style={{
                  padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
                  borderRadius: `${buttonRadius}px`,
                  textDecoration: 'none',
                  fontWeight: 700,
                  background: buttonBgColor || (button.style === 'secondary' ? 'transparent' : '#fff'),
                  color: buttonTextColor || (button.style === 'secondary' ? '#fff' : '#111827'),
                  border: buttonBorderColor
                    ? `1px solid ${buttonBorderColor}`
                    : button.style === 'secondary'
                      ? '1px solid rgba(255,255,255,0.8)'
                      : 'none',
                }}
              >
                {button.text}
              </a>
            ))}
          </div>
        )}
        </div>
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: arrowStyle === 'minimal' ? 'rgba(15,23,42,0.68)' : 'rgba(255,255,255,0.9)', cursor: 'pointer', ...arrowBaseStyle }}>‹</button>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex + 1) % slides.length)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: arrowStyle === 'minimal' ? 'rgba(15,23,42,0.68)' : 'rgba(255,255,255,0.9)', cursor: 'pointer', ...arrowBaseStyle }}>›</button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.45rem' }}>
          {slides.map((slide, slideIndex) => (
            <button key={slide.id || slideIndex} type="button" onClick={() => setIndex(slideIndex)} style={{ width: slideIndex === index ? '24px' : '8px', height: '8px', borderRadius: '999px', border: 'none', background: slideIndex === index ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer' }} />
          ))}
        </div>
      )}
    </div>
  );
}
