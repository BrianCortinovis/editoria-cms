import type { Block } from '@/lib/types/block';

interface GalleryImage {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  type?: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderImageGallery({ block, style }: Props) {
  const images = ((block.props.items as GalleryImage[]) || (block.props.images as GalleryImage[]) || []).map((item) => ({
    ...item,
    url: item.url || item.src || '',
  }));
  const columns = (block.props.columns as number) || 3;
  const gap = (block.props.gap as string) || '0.5rem';
  const aspectRatio = (block.props.aspectRatio as string) || '1/1';
  const layout = (block.props.layout as string) || 'grid';

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
        {images.map((img, i) => (
          <figure key={i} style={{ margin: `0 0 ${gap} 0`, breakInside: 'avoid' as const }}>
            <img src={img.url} alt={img.alt || ''} style={{ width: '100%', borderRadius: 'var(--e-border-radius, 8px)', display: 'block' }} loading="lazy" />
            {img.caption && <figcaption style={{ fontSize: '0.8rem', color: 'var(--e-color-textSecondary)', marginTop: '0.25rem' }}>{img.caption}</figcaption>}
          </figure>
        ))}
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
      {images.map((img, i) => (
        <figure key={i} style={{ margin: 0, overflow: 'hidden', borderRadius: 'var(--e-border-radius, 8px)' }}>
          <img
            src={img.url}
            alt={img.alt || ''}
            style={{ width: '100%', aspectRatio, objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
          {img.caption && <figcaption style={{ fontSize: '0.8rem', padding: '0.5rem', color: 'var(--e-color-textSecondary)' }}>{img.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
