import Link from 'next/link';
import type { Block } from '@/lib/types/block';

interface RelatedItem {
  id?: string;
  title: string;
  excerpt?: string;
  image?: string;
  url?: string;
  date?: string;
  slug?: string;
  cover_image_url?: string | null;
  summary?: string | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug: string;
}

export function RenderRelatedContent({ block, data, style, tenantSlug }: Props) {
  const items = (Array.isArray(data) && data.length > 0 ? data : block.props.items) as RelatedItem[] || [];
  const title = String(block.props.title || 'Contenuti correlati');
  const columns = Number(block.props.columns || 3);
  const showDate = block.props.showDate !== false;
  const showExcerpt = block.props.showExcerpt !== false;
  const showImage = block.props.showImage !== false;

  return (
    <section style={style} data-block="related-content">
      <h3 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--e-color-text)', marginBottom: '1rem' }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '1.25rem' }}>
        {items.map((item, index) => {
          const href = item.url || (item.slug ? `/site/${tenantSlug}/articolo/${item.slug}` : '#');
          const image = item.image || item.cover_image_url || '';
          const excerpt = item.excerpt || item.summary || '';

          return (
            <article key={item.id || index} style={{ border: '1px solid var(--e-color-border, #dbe2ea)', borderRadius: '16px', overflow: 'hidden', background: 'var(--e-color-surface, #fff)' }}>
              {showImage && image && (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--e-color-text)' }}>
                  <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
                </h4>
                {showExcerpt && excerpt && (
                  <p style={{ marginTop: '0.55rem', color: 'var(--e-color-textSecondary)', lineHeight: 1.6 }}>{excerpt}</p>
                )}
                {showDate && item.date && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--e-color-textSecondary)' }}>{item.date}</div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
