import type { Block } from '@/lib/types/block';

interface FooterColumn {
  title: string;
  links: Array<{ label: string; url: string }>;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderFooter({ block, style }: Props) {
  const columns = (block.props.columns as FooterColumn[]) || [];
  const copyright = (block.props.copyright as string) || '';
  const logoUrl = (block.props.logoUrl as string) || '';
  const description = (block.props.description as string) || '';

  return (
    <footer
      style={{
        ...style,
        padding: style.padding || '3rem 2rem 1.5rem',
        backgroundColor: style.backgroundColor || 'var(--e-color-surface, #1a1a2e)',
        color: style.color || '#ccc',
      }}
      data-block="footer"
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(columns.length, 1) + 1}, 1fr)`, gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          {logoUrl && <img src={logoUrl} alt="" style={{ height: '40px', marginBottom: '1rem', objectFit: 'contain' }} />}
          {description && <p style={{ fontSize: '0.875rem', lineHeight: '1.6', opacity: 0.8 }}>{description}</p>}
        </div>
        {columns.map((col, i) => (
          <div key={i}>
            <h4 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: '600', fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>
              {col.title}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {col.links.map((link, j) => (
                <li key={j} style={{ marginBottom: '0.5rem' }}>
                  <a href={link.url} style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {copyright && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
          {copyright}
        </div>
      )}
    </footer>
  );
}
