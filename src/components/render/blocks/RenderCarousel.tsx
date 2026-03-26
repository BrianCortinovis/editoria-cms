'use client';

import { useMemo, useRef, useState } from 'react';
import type { Block } from '@/lib/types/block';

interface CarouselItem {
  image?: string;
  title: string;
  excerpt?: string;
  url?: string;
  category?: string;
  badge?: string;
  buttons?: Array<{ id?: string; text?: string; url?: string; style?: string }>;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderCarousel({ block, style }: Props) {
  const items = ((block.props.items as CarouselItem[]) || []).map((item) => ({
    ...item,
    image: typeof item.image === 'string' ? item.image.trim() : item.image,
  }));
  const cardWidth = (block.props.cardWidth as string) || '300px';
  const gap = (block.props.gap as string) || '1rem';
  const cardStyle = String(block.props.cardStyle || 'elevated');
  const showArrows = block.props.showArrows !== false;
  const showDots = block.props.showDots !== false;
  const showCategory = block.props.showCategory !== false;
  const showDate = block.props.showDate !== false;
  const showAuthor = block.props.showAuthor !== false;
  const showExcerpt = block.props.showExcerpt !== false;
  const arrowStyle = String(block.props.arrowStyle || 'circle');
  const controlsOffsetX = Number(block.props.controlsOffsetX || 0);
  const controlsOffsetY = Number(block.props.controlsOffsetY || 0);
  const buttonPaddingX = Number(block.props.buttonPaddingX || 14);
  const buttonPaddingY = Number(block.props.buttonPaddingY || 10);
  const buttonRadius = Number(block.props.buttonRadius || 12);
  const buttonBgColor = String(block.props.buttonBgColor || '').trim();
  const buttonTextColor = String(block.props.buttonTextColor || '').trim();
  const buttonBorderColor = String(block.props.buttonBorderColor || '').trim();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const stepSize = useMemo(() => {
    const numericCardWidth = Number.parseInt(cardWidth, 10);
    const numericGap = Number.parseInt(gap, 10);
    return (Number.isFinite(numericCardWidth) ? numericCardWidth : 300) + (Number.isFinite(numericGap) ? numericGap : 16);
  }, [cardWidth, gap]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * stepSize, behavior: 'smooth' });
  };

  return (
    <div style={{ ...style, position: 'relative' }} data-block="carousel">
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const container = event.currentTarget;
          setActiveIndex(Math.max(0, Math.round(container.scrollLeft / stepSize)));
        }}
        style={{
          display: 'flex',
          gap,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          padding: '0.5rem 0',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: `0 0 ${cardWidth}`,
              scrollSnapAlign: 'start',
              borderRadius: 'var(--e-border-radius, 8px)',
              border: cardStyle === 'minimal' ? 'none' : '1px solid var(--e-color-border, #dee2e6)',
              overflow: 'hidden',
              backgroundColor: cardStyle === 'dark' ? '#020617' : 'var(--e-color-surface, #fff)',
              color: cardStyle === 'dark' ? '#f8fafc' : 'var(--e-color-text, #111827)',
              boxShadow: cardStyle === 'elevated' ? '0 14px 34px rgba(15,23,42,0.08)' : undefined,
            }}
          >
            {item.image && (
              <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            )}
            <div style={{ padding: '1rem' }}>
              {showCategory && item.category && (
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: cardStyle === 'dark' ? '#93c5fd' : 'var(--e-color-primary, #8B0000)', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
              )}
              {item.badge && (
                <span
                  style={{
                    display: 'inline-flex',
                    marginLeft: showCategory && item.category ? '0.5rem' : 0,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: cardStyle === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(139,0,0,0.1)',
                    color: cardStyle === 'dark' ? '#fff' : 'var(--e-color-primary, #8B0000)',
                  }}
                >
                  {item.badge}
                </span>
              )}
              <h3 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1rem', color: cardStyle === 'dark' ? '#f8fafc' : 'var(--e-color-text)', margin: '0.25rem 0 0.5rem' }}>
                {item.url ? <a href={item.url} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</a> : item.title}
              </h3>
              {showExcerpt && item.excerpt && <p style={{ fontSize: '0.85rem', color: cardStyle === 'dark' ? 'rgba(248,250,252,0.74)' : 'var(--e-color-textSecondary)', lineHeight: '1.5', margin: 0 }}>{item.excerpt}</p>}
              {Array.isArray(item.buttons) && item.buttons.length > 0 && (
                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
                  {item.buttons.map((button, buttonIndex) => {
                    const isSecondary = button.style === 'secondary' || button.style === 'outline';
                    return (
                      <a
                        key={button.id || `${item.title}-cta-${buttonIndex}`}
                        href={button.url || item.url || '#'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
                          borderRadius: `${buttonRadius}px`,
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          background: buttonBgColor || (isSecondary ? 'transparent' : 'var(--e-color-primary, #8B0000)'),
                          color: buttonTextColor || (isSecondary ? (cardStyle === 'dark' ? '#fff' : '#111827') : '#fff'),
                          border: buttonBorderColor
                            ? `1px solid ${buttonBorderColor}`
                            : isSecondary
                              ? `1px solid ${cardStyle === 'dark' ? 'rgba(255,255,255,0.36)' : 'var(--e-color-border, #d1d5db)'}`
                              : '1px solid transparent',
                        }}
                      >
                        {button.text || 'Apri'}
                      </a>
                    );
                  })}
                </div>
              )}
              {(showDate || showAuthor) && (
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.8rem', fontSize: '0.76rem', color: cardStyle === 'dark' ? 'rgba(248,250,252,0.7)' : 'var(--e-color-textSecondary)' }}>
                  {showAuthor && (item as CarouselItem & { author?: string }).author && <span>{(item as CarouselItem & { author?: string }).author}</span>}
                  {showDate && (item as CarouselItem & { date?: string }).date && <span>{(item as CarouselItem & { date?: string }).date}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showArrows && items.length > 2 && (
        <>
          <button onClick={() => scroll(-1)} data-carousel-part="controls" style={{ position: 'absolute', left: '-16px', top: '50%', transform: `translate(${controlsOffsetX}px, calc(-50% + ${controlsOffsetY}px))`, width: arrowStyle === 'square' ? '38px' : '32px', height: arrowStyle === 'square' ? '38px' : '32px', borderRadius: arrowStyle === 'square' ? '12px' : '50%', border: '1px solid var(--e-color-border)', backgroundColor: cardStyle === 'dark' ? '#0f172a' : 'var(--e-color-surface, #fff)', color: cardStyle === 'dark' ? '#fff' : '#111827', cursor: 'pointer', fontSize: '1.2rem' }}>‹</button>
          <button onClick={() => scroll(1)} data-carousel-part="controls" style={{ position: 'absolute', right: '-16px', top: '50%', transform: `translate(${controlsOffsetX}px, calc(-50% + ${controlsOffsetY}px))`, width: arrowStyle === 'square' ? '38px' : '32px', height: arrowStyle === 'square' ? '38px' : '32px', borderRadius: arrowStyle === 'square' ? '12px' : '50%', border: '1px solid var(--e-color-border)', backgroundColor: cardStyle === 'dark' ? '#0f172a' : 'var(--e-color-surface, #fff)', color: cardStyle === 'dark' ? '#fff' : '#111827', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>
        </>
      )}
      {showDots && items.length > 1 && (
        <div data-carousel-part="controls" style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginTop: '0.9rem', transform: `translate(${controlsOffsetX}px, ${controlsOffsetY}px)` }}>
          {items.map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => scrollRef.current?.scrollTo({ left: index * stepSize, behavior: 'smooth' })}
              style={{
                width: index === activeIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '999px',
                border: 'none',
                background: index === activeIndex ? 'var(--e-color-primary, #8B0000)' : 'rgba(148,163,184,0.48)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
