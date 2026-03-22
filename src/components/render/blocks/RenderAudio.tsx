import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderAudio({ block, style }: Props) {
  const title = String(block.props.title || 'Audio');
  const artist = String(block.props.artist || '');
  const url = String(block.props.url || '');
  const coverImage = String(block.props.coverImage || '');
  const loop = Boolean(block.props.loop);
  const autoplay = Boolean(block.props.autoplay);

  return (
    <section
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: coverImage ? '120px 1fr' : '1fr',
        gap: '1rem',
        alignItems: 'center',
        borderRadius: '16px',
      }}
      data-block="audio"
    >
      {coverImage && (
        <div style={{ width: '120px', aspectRatio: '1/1', borderRadius: '14px', overflow: 'hidden' }}>
          <img src={coverImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--e-color-textSecondary)' }}>
          Audio
        </div>
        <h3 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--e-color-text)' }}>
          {title}
        </h3>
        {artist && <p style={{ marginTop: '0.35rem', color: 'var(--e-color-textSecondary)' }}>{artist}</p>}
        <div style={{ marginTop: '0.9rem' }}>
          {url ? (
            <audio src={url} controls loop={loop} autoPlay={autoplay} preload="metadata" style={{ width: '100%' }}>
              <track kind="captions" />
            </audio>
          ) : (
            <div style={{ padding: '0.9rem 1rem', borderRadius: '12px', background: 'var(--e-color-surface, #f8fafc)', color: 'var(--e-color-textSecondary)' }}>
              Nessun file audio configurato
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
