'use client';

import type { Block } from '@/lib/types/block';
import { normalizeFooterConfig } from '@/lib/site/footer';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

export function RenderFooter({ block, data, style }: Props) {
  const mode = String(block.props.mode || 'global');
  const footerConfig = mode === 'global'
    ? normalizeFooterConfig((data as unknown[])[0] || {})
    : normalizeFooterConfig(block.props);
  const variant = String(block.props.variant || 'columns');
  const columns = footerConfig.columns;

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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: variant === 'compact' ? '1.4fr 1fr' : variant === 'minimal' ? '1fr' : `repeat(${Math.max(columns.length, 1) + 1}, minmax(0, 1fr))`,
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          <div>
            {footerConfig.logoUrl && <img src={footerConfig.logoUrl} alt="" style={{ height: '40px', marginBottom: '1rem', objectFit: 'contain' }} />}
            {footerConfig.description && <p style={{ fontSize: '0.875rem', lineHeight: '1.6', opacity: 0.8 }}>{footerConfig.description}</p>}

            {footerConfig.socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {footerConfig.socialLinks.map((social, index) => (
                  <a
                    key={`${social.platform}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.85 }}
                  >
                    {social.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {variant !== 'minimal' && columns.map((col, i) => (
            <div key={i}>
              <h4 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: '600', fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>
                {col.title}
              </h4>
              {col.text && <p style={{ fontSize: '0.875rem', lineHeight: '1.6', opacity: 0.8, marginTop: 0 }}>{col.text}</p>}
              {col.links?.length ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {col.links.map((link, j) => (
                    <li key={j} style={{ marginBottom: '0.5rem' }}>
                      <a href={link.url} target={link.target || '_self'} rel={link.target === '_blank' ? 'noreferrer' : undefined} style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        {footerConfig.links.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            {footerConfig.links.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target={link.target || '_self'}
                rel={link.target === '_blank' ? 'noreferrer' : undefined}
                style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.875rem', opacity: 0.8 }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {footerConfig.newsletter.enabled && (
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>{footerConfig.newsletter.title || 'Newsletter'}</div>
            {footerConfig.newsletter.description && (
              <div style={{ fontSize: '0.875rem', opacity: 0.82 }}>{footerConfig.newsletter.description}</div>
            )}
          </div>
        )}

        {footerConfig.copyright && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
            {footerConfig.copyright}
          </div>
        )}
      </div>
    </footer>
  );
}
