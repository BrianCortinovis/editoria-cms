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

      <div style={{ position: 'absolute', left: '2rem', right: '2rem', bottom: '2rem', color: current.textStyle?.color || '#fff' }}>
        {current.title && (
          <h3 style={{ fontSize: current.textStyle?.titleSize || '2rem', fontWeight: current.textStyle?.titleWeight || 800, marginBottom: '0.45rem' }}>
            {current.title}
          </h3>
        )}
        {current.description && (
          <p style={{ maxWidth: '640px', fontSize: current.textStyle?.descSize || '1rem', lineHeight: 1.6 }}>{current.description}</p>
        )}
        {Array.isArray(current.buttons) && current.buttons.length > 0 && (
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {current.buttons.map((button) => (
              <a
                key={button.id || button.text}
                href={button.url || '#'}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  background: button.style === 'secondary' ? 'transparent' : '#fff',
                  color: button.style === 'secondary' ? '#fff' : '#111827',
                  border: button.style === 'secondary' ? '1px solid rgba(255,255,255,0.8)' : 'none',
                }}
              >
                {button.text}
              </a>
            ))}
          </div>
        )}
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex - 1 + slides.length) % slides.length)} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>‹</button>
          <button type="button" onClick={() => setIndex((currentIndex) => (currentIndex + 1) % slides.length)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>›</button>
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
