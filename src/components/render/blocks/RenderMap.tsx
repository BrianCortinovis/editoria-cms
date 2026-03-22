import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderMap({ block, style }: Props) {
  const lat = Number(block.props.lat || 45.4642);
  const lng = Number(block.props.lng || 9.19);
  const zoom = Number(block.props.zoom || 14);
  const address = String(block.props.address || 'Località');
  const markerTitle = String(block.props.markerTitle || address);
  const height = String(block.props.height || '400px');
  const query = encodeURIComponent(address);
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.03}%2C${lng + 0.03}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;
  const directUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <figure style={{ ...style }} data-block="map">
      <div style={{ borderRadius: 'inherit', overflow: 'hidden', minHeight: height }}>
        <iframe
          title={markerTitle}
          src={embedUrl}
          style={{ width: '100%', height, border: 'none' }}
          loading="lazy"
        />
      </div>
      <figcaption style={{ marginTop: '0.65rem', fontSize: '0.88rem', color: 'var(--e-color-textSecondary)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <span>{address}</span>
        <a href={query ? directUrl : '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--e-color-primary, #8B0000)' }}>
          Apri mappa
        </a>
      </figcaption>
    </figure>
  );
}
