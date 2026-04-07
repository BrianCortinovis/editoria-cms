import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderAuthorBio({ block, style }: Props) {
  const name = (block.props.name as string) || '';
  const role = (block.props.role as string) || '';
  const bio = (block.props.bio as string) || '';
  const avatarUrl = String(block.props.avatarUrl || block.props.avatar || '');
  const layout = (block.props.layout as string) || 'horizontal';
  const socialLinks = Array.isArray(block.props.socialLinks)
    ? (block.props.socialLinks as Array<{ platform?: string; url?: string }>).filter((item) => item?.url)
    : [];

  const isVertical = layout === 'vertical';

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'center' : 'flex-start',
        gap: '1.5rem',
        padding: style.padding || '2rem',
        textAlign: isVertical ? 'center' : 'left',
      }}
      data-block="author-bio"
    >
      {avatarUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarUrl}
          alt={name}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
          loading="lazy"
        />
      )}
      <div>
        {name && (
          <h3 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--e-color-text)', margin: '0 0 0.25rem' }}>
            {name}
          </h3>
        )}
        {role && (
          <p style={{ fontSize: '0.875rem', color: 'var(--e-color-primary, #8B0000)', fontWeight: '500', margin: '0 0 0.75rem' }}>
            {role}
          </p>
        )}
        {bio && (
          <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--e-color-textSecondary)', margin: 0 }}>
            {bio}
          </p>
        )}
        {socialLinks.length > 0 && (
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
            {socialLinks.map((item, index) => (
              <a
                key={`${item.platform || 'social'}-${index}`}
                href={item.url || '#'}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--e-color-primary, #8B0000)',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {item.platform || 'social'}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
