'use client';

import { useRef } from 'react';
import type { Block } from '@/lib/types/block';

interface CarouselItem {
  image?: string;
  title: string;
  excerpt?: string;
  url?: string;
  category?: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div style={{ ...style, position: 'relative' }} data-block="carousel">
      <div
        ref={scrollRef}
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
              border: '1px solid var(--e-color-border, #dee2e6)',
              overflow: 'hidden',
              backgroundColor: 'var(--e-color-surface, #fff)',
            }}
          >
            {item.image && (
              <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
            )}
            <div style={{ padding: '1rem' }}>
              {item.category && (
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--e-color-primary, #8B0000)', textTransform: 'uppercase' }}>
                  {item.category}
                </span>
              )}
              <h3 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1rem', color: 'var(--e-color-text)', margin: '0.25rem 0 0.5rem' }}>
                {item.url ? <a href={item.url} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</a> : item.title}
              </h3>
              {item.excerpt && <p style={{ fontSize: '0.85rem', color: 'var(--e-color-textSecondary)', lineHeight: '1.5', margin: 0 }}>{item.excerpt}</p>}
            </div>
          </div>
        ))}
      </div>
      {items.length > 2 && (
        <>
          <button onClick={() => scroll(-1)} style={{ position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--e-color-border)', backgroundColor: 'var(--e-color-surface, #fff)', cursor: 'pointer', fontSize: '1.2rem' }}>‹</button>
          <button onClick={() => scroll(1)} style={{ position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--e-color-border)', backgroundColor: 'var(--e-color-surface, #fff)', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>
        </>
      )}
    </div>
  );
}
