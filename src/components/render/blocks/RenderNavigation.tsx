import type { Block } from '@/lib/types/block';

interface NavItem {
  label: string;
  url: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderNavigation({ block, style }: Props) {
  const logoUrl = (block.props.logoUrl as string) || '';
  const logoText = (block.props.logoText as string) || '';
  const items = (block.props.items as NavItem[]) || [];
  const ctaText = (block.props.ctaText as string) || '';
  const ctaUrl = (block.props.ctaUrl as string) || '#';
  const sticky = (block.props.sticky as boolean) ?? false;

  return (
    <nav
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: style.padding || '1rem 2rem',
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
      }}
      data-block="navigation"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {logoUrl && <img src={logoUrl} alt={logoText || 'Logo'} style={{ height: '40px', objectFit: 'contain' }} />}
        {logoText && (
          <span style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--e-color-text)' }}>
            {logoText}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            style={{ color: 'var(--e-color-text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
          >
            {item.label}
          </a>
        ))}
        {ctaText && (
          <a
            href={ctaUrl}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--e-color-primary, #8B0000)',
              color: '#fff',
              borderRadius: 'var(--e-border-radius, 8px)',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </nav>
  );
}
