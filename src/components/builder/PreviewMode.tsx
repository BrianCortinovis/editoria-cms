'use client';

import { useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { DEVICE_WIDTHS, type DeviceMode } from '@/lib/config/breakpoints';
import { cn } from '@/lib/utils/cn';
import {
  X, Monitor, Tablet, Smartphone, RotateCcw,
  ZoomIn, ZoomOut, ExternalLink
} from 'lucide-react';
import type { Block } from '@/lib/types';

interface PreviewGalleryItem {
  id?: string | number;
  src?: string;
  alt?: string;
  type?: string;
  badge?: string;
  caption?: string;
  overlay?: {
    enabled?: boolean;
    color?: string;
    title?: string;
    description?: string;
  };
}

interface PreviewSlideButton {
  id?: string | number;
  text?: string;
  style?: string;
}

interface PreviewSlide {
  image?: string;
  title?: string;
  description?: string;
  overlay?: {
    enabled?: boolean;
    color?: string;
    position?: string;
  };
  textStyle?: {
    color?: string;
    titleSize?: string;
    titleWeight?: string | number;
    descSize?: string;
  };
  buttons?: PreviewSlideButton[];
}

interface PreviewCarouselItem {
  id?: string | number;
  image?: string;
  badge?: string;
  category?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  author?: string;
  date?: string;
  buttons?: PreviewSlideButton[];
}

function PreviewGallery({ p }: { p: Record<string, unknown> }) {
  const config = p as {
    items?: PreviewGalleryItem[];
    images?: PreviewGalleryItem[];
    columns?: number;
    gap?: string;
    borderRadius?: string;
    aspectRatio?: string;
    layout?: string;
    objectFit?: string;
    showCaptions?: boolean;
    captionPosition?: string;
  };
  const items = Array.isArray(config.items) ? config.items : Array.isArray(config.images) ? config.images : [];
  const cols = config.columns || 3;
  const gap = config.gap || '12px';
  const radius = config.borderRadius || '8px';
  const ratio = config.aspectRatio || '4/3';
  const layout = config.layout || 'grid';

  if (items.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ aspectRatio: ratio, background: `linear-gradient(135deg, hsl(${i * 90}, 60%, 85%), hsl(${i * 90 + 40}, 60%, 75%))`, borderRadius: radius, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>
            Immagine {i}
          </div>
        ))}
      </div>
    );
  }

  const gridStyle: React.CSSProperties = layout === 'mosaic'
    ? { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, gridAutoRows: '200px' }
    : layout === 'filmstrip'
    ? { display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory' }
    : { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap };

  return (
    <div style={gridStyle}>
      {items.map((item, i: number) => {
        const isMosaic = layout === 'mosaic' && i === 0;
        return (
          <div key={item.id || i} style={{
            position: 'relative', overflow: 'hidden', borderRadius: radius,
            aspectRatio: layout === 'filmstrip' ? undefined : ratio,
            ...(isMosaic ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}),
            ...(layout === 'filmstrip' ? { minWidth: 280, height: 200, flexShrink: 0, scrollSnapAlign: 'start' } : {}),
          }}>
            {item.src ? (
              <img src={item.src} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: (config.objectFit || 'cover') as React.CSSProperties['objectFit'] }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${i * 60}, 60%, 80%), hsl(${i * 60 + 30}, 70%, 65%))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 0, height: 0, borderLeft: '14px solid #fff', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', marginLeft: 3 }} />
                  </div>
                ) : null}
              </div>
            )}
            {item.badge && (
              <span style={{ position: 'absolute', top: 8, left: 8, background: '#e74c3c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{item.badge}</span>
            )}
            {item.overlay?.enabled && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: item.overlay.color || 'rgba(0,0,0,0.5)',
                padding: '12px 16px', color: '#fff',
              }}>
                {item.overlay.title && <div style={{ fontWeight: 700, fontSize: 14 }}>{item.overlay.title}</div>}
                {item.overlay.description && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{item.overlay.description}</div>}
              </div>
            )}
            {config.showCaptions && item.caption && config.captionPosition === 'below' && (
              <div style={{ padding: '8px 0', fontSize: 12, color: '#666' }}>{item.caption}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PreviewVideo({ p }: { p: Record<string, unknown> }) {
  const config = p as {
    aspectRatio?: string;
    poster?: string;
    objectFit?: string;
    source?: string;
    caption?: string;
    overlay?: {
      enabled?: boolean;
      title?: string;
      description?: string;
      playButtonSize?: string;
      playButtonStyle?: string;
    };
    chapters?: unknown[];
  };
  const ratio = config.aspectRatio || '16/9';
  const overlay = config.overlay || {};
  const btnSize = overlay.playButtonSize === 'small' ? 48 : overlay.playButtonSize === 'medium' ? 64 : 80;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
      <div style={{ aspectRatio: ratio, position: 'relative' }}>
        {config.poster ? (
          <img src={config.poster} alt="" style={{ width: '100%', height: '100%', objectFit: (config.objectFit || 'cover') as React.CSSProperties['objectFit'] }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {/* Play button */}
            <div style={{ width: btnSize, height: btnSize, borderRadius: overlay.playButtonStyle === 'square' ? 12 : '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
              <div style={{ width: 0, height: 0, borderLeft: `${btnSize / 3}px solid #fff`, borderTop: `${btnSize / 5}px solid transparent`, borderBottom: `${btnSize / 5}px solid transparent`, marginLeft: btnSize / 10 }} />
            </div>
            {overlay.enabled && overlay.title && (
              <div style={{ marginTop: 16, fontSize: 18, fontWeight: 600 }}>{overlay.title}</div>
            )}
            {overlay.enabled && overlay.description && (
              <div style={{ marginTop: 4, fontSize: 14, opacity: 0.7 }}>{overlay.description}</div>
            )}
          </div>
        )}
        {/* Source badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
          {String(p.source || 'video').toUpperCase()}
        </div>
      </div>
      {/* Chapters */}
      {Array.isArray(config.chapters) && config.chapters.length > 0 && (
        <div style={{ display: 'flex', gap: 1, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
          {config.chapters.map((_, i: number) => (
            <div key={i} style={{ flex: 1, background: i === 0 ? 'var(--c-accent)' : 'var(--c-bg-2)' }} />
          ))}
        </div>
      )}
      {config.caption && <div style={{ padding: '8px 0', fontSize: 13, color: '#666' }}>{config.caption}</div>}
    </div>
  );
}

function PreviewSlideshow({ p }: { p: Record<string, unknown> }) {
  const config = p as {
    slides?: PreviewSlide[];
    height?: string;
    objectFit?: string;
    showDots?: boolean;
    showArrows?: boolean;
  };
  const slides = Array.isArray(config.slides) ? config.slides : [];
  const height = config.height || '500px';

  if (slides.length === 0) {
    return (
      <div style={{ width: '100%', height, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
        Slideshow
      </div>
    );
  }

  const slide = slides[0];
  const overlayPos = slide.overlay?.position || 'bottom-left';
  const alignMap: Record<string, React.CSSProperties> = {
    'top-left': { top: 32, left: 32 },
    'top-center': { top: 32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
    'top-right': { top: 32, right: 32, textAlign: 'right' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
    'bottom-left': { bottom: 32, left: 32 },
    'bottom-center': { bottom: 32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
    'bottom-right': { bottom: 32, right: 32, textAlign: 'right' },
  };
  const textStyle = slide.textStyle || {};

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 8 }}>
      {slide.image ? (
        <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectFit: (config.objectFit || 'cover') as React.CSSProperties['objectFit'] }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${220}, 70%, 50%), hsl(${280}, 60%, 40%))` }} />
      )}
      {/* Overlay */}
      {slide.overlay?.enabled && (
        <div style={{ position: 'absolute', inset: 0, background: slide.overlay.color || 'rgba(0,0,0,0.4)' }} />
      )}
      {/* Text content */}
      <div style={{ position: 'absolute', maxWidth: '60%', color: textStyle.color || '#fff', ...alignMap[overlayPos] }}>
        {slide.title && <div style={{ fontSize: textStyle.titleSize || '36px', fontWeight: textStyle.titleWeight || 700, lineHeight: 1.2, marginBottom: 8 }}>{slide.title}</div>}
        {slide.description && <div style={{ fontSize: textStyle.descSize || '16px', opacity: 0.9, marginBottom: 16 }}>{slide.description}</div>}
        {Array.isArray(slide.buttons) && slide.buttons.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {slide.buttons.map((btn) => (
              <span key={btn.id} style={{
                padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                ...(btn.style === 'secondary'
                  ? { border: '2px solid #fff', color: '#fff', background: 'transparent' }
                  : { background: 'var(--c-accent)', color: '#fff' })
              }}>{btn.text}</span>
            ))}
          </div>
        )}
      </div>
      {/* Dots */}
      {config.showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {slides.map((_, i: number) => (
            <div key={i} style={{ width: i === 0 ? 24 : 8, height: 8, borderRadius: 4, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width 0.3s' }} />
          ))}
        </div>
      )}
      {/* Arrows */}
      {config.showArrows && slides.length > 1 && (
        <>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>‹</div>
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>›</div>
        </>
      )}
      {/* Counter */}
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, padding: '4px 10px', borderRadius: 12 }}>1 / {slides.length}</div>
    </div>
  );
}

function PreviewCarousel({ p }: { p: Record<string, unknown> }) {
  const config = p as {
    items?: PreviewCarouselItem[];
    slidesPerView?: number;
    spaceBetween?: number;
    cardStyle?: string;
    showArrows?: boolean;
    showCategory?: boolean;
    showExcerpt?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
  };
  const items = Array.isArray(config.items) ? config.items : [];
  const perView = config.slidesPerView || 3;
  const space = config.spaceBetween || 20;
  const cardStyle = config.cardStyle || 'elevated';

  const cardBase: React.CSSProperties = {
    borderRadius: 12, overflow: 'hidden', flexShrink: 0,
    width: `calc(${100 / perView}% - ${space * (perView - 1) / perView}px)`,
    ...(cardStyle === 'elevated' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' } : {}),
    ...(cardStyle === 'bordered' ? { border: '1px solid #e5e7eb' } : {}),
    ...(cardStyle === 'glass' ? { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' } : {}),
    background: cardStyle === 'glass' ? undefined : '#fff',
  };

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', gap: space, overflow: 'hidden' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ ...cardBase, minHeight: 300 }}>
            <div style={{ height: 180, background: `linear-gradient(135deg, hsl(${i * 80}, 60%, 80%), hsl(${i * 80 + 30}, 60%, 65%))` }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Articolo {i}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Descrizione articolo...</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: space, overflow: 'hidden' }}>
        {items.map((item, i: number) => (
          <div key={item.id || i} style={cardBase}>
            {/* Image */}
            <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
              {item.image ? (
                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${i * 70}, 60%, 80%), hsl(${i * 70 + 40}, 60%, 65%))` }} />
              )}
              {item.badge && (
                <span style={{ position: 'absolute', top: 8, left: 8, background: '#e74c3c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{item.badge}</span>
              )}
              {item.category && config.showCategory && (
                <span style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{item.category}</span>
              )}
            </div>
            {/* Content */}
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{item.title || 'Titolo'}</div>
              {(item.excerpt || item.description) && config.showExcerpt !== false && (
                <div style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.excerpt || item.description}</div>
              )}
              {item.author && config.showAuthor && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                  {item.author}{item.date && config.showDate ? ` · ${item.date}` : ''}
                </div>
              )}
              {Array.isArray(item.buttons) && item.buttons.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  {item.buttons.map((btn) => (
                    <span key={btn.id} style={{ padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: btn.style === 'secondary' ? 'transparent' : 'var(--c-accent)', color: btn.style === 'secondary' ? 'var(--c-accent)' : '#fff', border: btn.style === 'secondary' ? '1px solid var(--c-accent)' : 'none' }}>{btn.text}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Arrows */}
      {config.showArrows && items.length > perView && (
        <>
          <div style={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>‹</div>
          <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>›</div>
        </>
      )}
    </div>
  );
}

// Render a block as pure HTML/CSS without any editor chrome
function PreviewBlock({ block }: { block: Block }) {
  if (block.hidden) return null;

  const style = buildPreviewStyle(block);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = block.props as any;

  return (
    <div style={style}>
      {block.type === 'text' || block.type === 'hero' || block.type === 'quote' ? (
        <div dangerouslySetInnerHTML={{ __html: String(p.content || p.html || '') }} />
      ) : block.type === 'image-gallery' ? (
        <PreviewGallery p={p} />
      ) : block.type === 'video' ? (
        <PreviewVideo p={p} />
      ) : block.type === 'slideshow' ? (
        <PreviewSlideshow p={p} />
      ) : block.type === 'carousel' ? (
        <PreviewCarousel p={p} />
      ) : block.type === 'divider' ? (
        <hr style={{ border: 'none', borderTop: `${p.thickness || 1}px ${p.lineStyle || 'solid'} ${p.color || '#e5e7eb'}`, margin: '16px 0' }} />
      ) : block.type === 'navigation' ? (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{String(p.logo || 'Logo')}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {(Array.isArray(p.links) ? p.links : []).map((link: { label: string; href: string }, i: number) => (
              <a key={i} href={link.href || '#'} style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>{link.label}</a>
            ))}
          </div>
        </nav>
      ) : block.type === 'footer' ? (
        <footer style={{ padding: '32px 24px', textAlign: 'center', fontSize: 14, color: '#666' }}>
          <div dangerouslySetInnerHTML={{ __html: String(p.content || p.html || '&copy; 2024') }} />
        </footer>
      ) : block.type === 'newsletter' ? (
        <div style={{ textAlign: 'center', padding: '32px 24px' }}>
          <h3 style={{ marginBottom: 8 }}>{String(p.title || 'Newsletter')}</h3>
          <p style={{ marginBottom: 16, color: '#666' }}>{String(p.subtitle || '')}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 400, margin: '0 auto' }}>
            <input type="email" placeholder="Email" style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }} readOnly />
            <button style={{ padding: '8px 20px', borderRadius: 6, background: 'var(--c-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {String(p.buttonText || 'Iscriviti')}
            </button>
          </div>
        </div>
      ) : block.type === 'counter' ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, padding: '32px 24px' }}>
          {(Array.isArray(p.counters) ? p.counters : []).map((c: { value: string; label: string }, i: number) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{c.value}</div>
              <div style={{ fontSize: 14, color: '#666' }}>{c.label}</div>
            </div>
          ))}
        </div>
      ) : block.type === 'code' ? (
        <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
          <code>{String(p.code || '')}</code>
        </pre>
      ) : block.type === 'table' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {Array.isArray(p.headers) && p.headers.length > 0 && (
              <thead>
                <tr>
                  {p.headers.map((header: string, i: number) => (
                    <th key={i} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', textAlign: 'left', background: '#f8fafc' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(Array.isArray(p.rows) ? p.rows : []).map((row: string[], ri: number) => (
                <tr key={ri}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} style={{ padding: '8px 12px', border: '1px solid #e5e7eb' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : block.type === 'tabs' ? (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {(Array.isArray(p.tabs) ? p.tabs : []).map((tab: { id?: string; title?: string }, i: number) => (
              <span key={tab.id || i} style={{ padding: '8px 12px', borderRadius: 999, background: i === 0 ? 'var(--c-accent)' : '#eef2f7', color: i === 0 ? '#fff' : '#334155', fontSize: 14 }}>
                {tab.title || `Tab ${i + 1}`}
              </span>
            ))}
          </div>
          <div
            style={{ padding: '16px', borderRadius: 12, border: '1px solid #e5e7eb' }}
            dangerouslySetInnerHTML={{ __html: String((Array.isArray(p.tabs) ? p.tabs[0]?.content : '') || '<p>Contenuto tab.</p>') }}
          />
        </div>
      ) : block.type === 'timeline' ? (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: String(p.lineColor || '#e63946') }} />
          {(Array.isArray(p.events) ? p.events : []).map((event: { id?: string; date?: string; title?: string; description?: string }, i: number) => (
            <div key={event.id || i} style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%', background: String(p.lineColor || '#e63946') }} />
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: String(p.lineColor || '#e63946') }}>{event.date}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{event.title}</div>
              <div style={{ marginTop: 4, color: '#64748b' }}>{event.description}</div>
            </div>
          ))}
        </div>
      ) : block.type === 'map' ? (
        <div style={{ width: '100%', height: 300, background: '#e8f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, color: '#666' }}>
          Mappa: {String(p.address || 'Indirizzo')}
        </div>
      ) : block.type === 'banner-ad' ? (
        <div style={{ padding: '24px', textAlign: 'center', background: String(p.bgColor || '#f0f0f0'), borderRadius: 8 }}>
          <div dangerouslySetInnerHTML={{ __html: String(p.content || p.html || 'Banner') }} />
        </div>
      ) : block.type === 'custom-html' ? (
        <div dangerouslySetInnerHTML={{ __html: String(p.html || p.code || '') }} />
      ) : block.type === 'section' ? (
        <div dangerouslySetInnerHTML={{ __html: String(p.content || p.html || '') }} />
      ) : block.type === 'columns' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns || 2}, 1fr)`, gap: p.gap || 16 }}>
          {(Array.isArray(p.items) ? p.items : []).map((item: { content: string }, i: number) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: item.content || '' }} />
          ))}
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: String(p.content || p.html || '') }} />
      )}
    </div>
  );
}

function buildPreviewStyle(block: Block): React.CSSProperties {
  const s = block.style;
  const css: React.CSSProperties = {};

  // Copy the same logic as buildCssFromBlockStyle in CanvasBlock
  if (s.layout.display) css.display = s.layout.display;
  if (s.layout.flexDirection) css.flexDirection = s.layout.flexDirection as 'row' | 'column';
  if (s.layout.justifyContent) css.justifyContent = s.layout.justifyContent;
  if (s.layout.alignItems) css.alignItems = s.layout.alignItems;
  if (s.layout.gap) css.gap = s.layout.gap;
  css.padding = `${s.layout.padding.top} ${s.layout.padding.right} ${s.layout.padding.bottom} ${s.layout.padding.left}`;
  css.margin = `${s.layout.margin.top} ${s.layout.margin.right} ${s.layout.margin.bottom} ${s.layout.margin.left}`;
  if (s.layout.width) css.width = s.layout.width;
  if (s.layout.maxWidth) css.maxWidth = s.layout.maxWidth;
  if (s.layout.minHeight) css.minHeight = s.layout.minHeight;
  if (s.layout.overflow) css.overflow = s.layout.overflow as 'hidden' | 'auto';

  // Background
  if (s.background.type === 'color' && s.background.value) css.backgroundColor = s.background.value;
  else if (s.background.type === 'gradient' && s.background.value) css.background = s.background.value;
  else if (s.background.type === 'image' && s.background.value) {
    css.backgroundImage = `url(${s.background.value})`;
    css.backgroundSize = s.background.size || 'cover';
    css.backgroundPosition = s.background.position || 'center';
    css.backgroundRepeat = s.background.repeat || 'no-repeat';
  }

  // Typography
  if (s.typography.fontFamily) css.fontFamily = s.typography.fontFamily;
  if (s.typography.fontSize) css.fontSize = s.typography.fontSize;
  if (s.typography.fontWeight) css.fontWeight = s.typography.fontWeight;
  if (s.typography.lineHeight) css.lineHeight = s.typography.lineHeight;
  if (s.typography.letterSpacing) css.letterSpacing = s.typography.letterSpacing;
  if (s.typography.color) css.color = s.typography.color;
  if (s.typography.textAlign) css.textAlign = s.typography.textAlign as 'left' | 'center' | 'right';
  if (s.typography.textTransform) css.textTransform = s.typography.textTransform as 'uppercase' | 'lowercase';

  // Border
  if (s.border.width) css.borderWidth = s.border.width;
  if (s.border.style) css.borderStyle = s.border.style;
  if (s.border.color) css.borderColor = s.border.color;
  if (s.border.radius) css.borderRadius = s.border.radius;

  // Shadow, opacity, transform
  if (s.shadow) css.boxShadow = s.shadow;
  if (s.opacity !== undefined) css.opacity = s.opacity;
  if (s.transform) css.transform = s.transform;
  if (s.transition) css.transition = s.transition;

  // Shape
  if (block.shape?.type === 'clip-path' && block.shape.value) {
    (css as Record<string, string>).clipPath = block.shape.value;
  }

  return css;
}

export function PreviewMode() {
  const { blocks } = usePageStore();
  const { togglePreviewMode } = useUiStore();
  const [previewDevice, setPreviewDevice] = useState<DeviceMode>('desktop');
  const [previewZoom, setPreviewZoom] = useState(1);

  const width = DEVICE_WIDTHS[previewDevice];

  const devices: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col">
      {/* Preview toolbar */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-semibold text-zinc-200">Anteprima</span>

        <div className="w-px h-6 bg-zinc-700" />

        {/* Device switcher */}
        {devices.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setPreviewDevice(mode)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              previewDevice === mode
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}

        <div className="w-px h-6 bg-zinc-700" />

        {/* Zoom controls */}
        <button onClick={() => setPreviewZoom(Math.max(0.25, previewZoom - 0.1))} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-mono text-zinc-400 min-w-[40px] text-center">
          {Math.round(previewZoom * 100)}%
        </span>
        <button onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setPreviewZoom(1)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800" title="Reset zoom">
          <RotateCcw size={14} />
        </button>

        <div className="w-px h-6 bg-zinc-700" />

        {/* Size indicator */}
        <span className="text-xs font-mono text-zinc-500">{width}px</span>

        <div className="flex-1" />

        {/* Open in new tab */}
        <button
          onClick={() => {
            const html = document.querySelector('.sb-preview-frame')?.innerHTML || '';
            const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif}</style></head><body>${html}</body></html>`], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          title="Apri in nuova scheda"
        >
          <ExternalLink size={16} />
        </button>

        {/* Close */}
        <button
          onClick={togglePreviewMode}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          title="Chiudi anteprima (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto flex justify-center" style={{ padding: 24 }}>
        <div
          className="shrink-0"
          style={{
            width,
            transform: `scale(${previewZoom})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Device chrome */}
          {previewDevice !== 'desktop' && (
            <div
              className="mx-auto rounded-[2rem] border-4 border-zinc-700 overflow-hidden shadow-2xl"
              style={{ width: width + 8, background: '#18181b' }}
            >
              {/* Notch */}
              <div className="flex justify-center py-2">
                <div className="w-24 h-1.5 bg-zinc-600 rounded-full" />
              </div>
              <div
                className="sb-preview-frame bg-white overflow-auto"
                style={{
                  width,
                  minHeight: previewDevice === 'mobile' ? 667 : 1024,
                  maxHeight: previewDevice === 'mobile' ? 667 : 1024,
                }}
              >
                {blocks.filter(b => !b.hidden).map((block) => (
                  <PreviewBlock key={block.id} block={block} />
                ))}
              </div>
              {/* Home bar */}
              <div className="flex justify-center py-2">
                <div className="w-16 h-1 bg-zinc-600 rounded-full" />
              </div>
            </div>
          )}

          {previewDevice === 'desktop' && (
            <div className="sb-preview-frame bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width, minHeight: 800 }}>
              {blocks.filter(b => !b.hidden).map((block) => (
                <PreviewBlock key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
        Premi <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd> per tornare all&apos;editor
      </div>
    </div>
  );
}
