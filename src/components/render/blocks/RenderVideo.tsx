import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export function RenderVideo({ block, style }: Props) {
  const url = (block.props.url as string) || '';
  const title = (block.props.title as string) || '';
  const caption = (block.props.caption as string) || '';
  const aspectRatio = (block.props.aspectRatio as string) || '16/9';

  const embedUrl = getEmbedUrl(url);

  return (
    <figure style={{ ...style, margin: style.margin || '2rem 0' }} data-block="video">
      <div style={{ position: 'relative', aspectRatio, overflow: 'hidden', borderRadius: 'var(--e-border-radius, 8px)' }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || 'Video'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : url ? (
          <video
            src={url}
            controls
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          >
            <track kind="captions" />
          </video>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--e-color-surface, #f8f9fa)', color: 'var(--e-color-textSecondary)' }}>
            Nessun video configurato
          </div>
        )}
      </div>
      {caption && (
        <figcaption style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--e-color-textSecondary)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
