import type { ResolvedTenant, SiteConfig } from '@/lib/site/tenant-resolver';
import { themeToCSS } from '@/lib/site/theme-injector';
import { getNavigationMenu, normalizeNavigationConfig } from '@/lib/site/navigation';
import { normalizeFooterConfig } from '@/lib/site/footer';
import { PublicSiteRuntime } from './PublicSiteRuntime';

interface Props {
  tenant: ResolvedTenant;
  config: SiteConfig | null;
  children: React.ReactNode;
}

export function SiteLayout({ tenant, config, children }: Props) {
  const themeCSS = config?.theme ? themeToCSS(config.theme) : '';
  const navigationConfig = normalizeNavigationConfig(config?.navigation || []);
  const topbarMenu = getNavigationMenu(navigationConfig, 'secondary');
  const primaryMenu = getNavigationMenu(navigationConfig, 'primary');
  const footerMenu = getNavigationMenu(navigationConfig, 'footer');
  const footerConfig = normalizeFooterConfig(config?.footer || {});

  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {config?.favicon_url && <link rel="icon" href={config.favicon_url} />}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
        {config?.global_css && <style dangerouslySetInnerHTML={{ __html: config.global_css }} />}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee { animation: marquee linear infinite; }
          body {
            font-family: var(--e-font-body, 'Inter', sans-serif);
            color: var(--e-color-text, #1a1a2e);
            background: var(--e-color-background, #ffffff);
            margin: 0;
          }
        `}} />
      </head>
      <body>
        <PublicSiteRuntime />
        {topbarMenu.length > 0 && (
          <div
            style={{
              borderBottom: '1px solid var(--e-color-border, #dee2e6)',
              backgroundColor: 'var(--e-color-background, #ffffff)',
            }}
          >
            <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', padding: '8px 24px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
              {topbarMenu.map((item, index) => (
                <a
                  key={`${item.id || item.url}-${index}`}
                  href={item.url}
                  target={item.target || '_self'}
                  rel={item.target === '_blank' ? 'noreferrer' : undefined}
                  style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Header / Navigation */}
        <header
          style={{
            borderBottom: '1px solid var(--e-color-border, #dee2e6)',
            backgroundColor: 'var(--e-color-surface, #f8f9fa)',
          }}
        >
          <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href={`/site/${tenant.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt={tenant.name} style={{ height: '40px', width: 'auto' }} />
              )}
              <span style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 'bold', fontSize: '20px', color: 'var(--e-color-text)' }}>
                {tenant.name}
              </span>
            </a>
            {primaryMenu.length > 0 && (
              <nav style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {primaryMenu.map((item, i) => (
                  <a
                    key={`${item.id || item.url}-${i}`}
                    href={item.url}
                    target={item.target || '_self'}
                    rel={item.target === '_blank' ? 'noreferrer' : undefined}
                    style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </header>

        {/* Page content */}
        <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', padding: '0 24px' }}>
          {children}
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 'var(--e-section-gap, 48px)',
            borderTop: '1px solid var(--e-color-border, #dee2e6)',
            backgroundColor: 'var(--e-color-surface, #f8f9fa)',
            padding: '32px 24px',
          }}
        >
          <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', color: 'var(--e-color-textSecondary)', fontSize: '14px' }}>
            {(footerConfig.description || footerConfig.columns.length > 0 || footerConfig.socialLinks.length > 0) && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(footerConfig.columns.length, 1) + 1}, minmax(0, 1fr))`,
                  gap: '24px',
                  textAlign: 'left',
                  marginBottom: '24px',
                }}
              >
                <div>
                  {footerConfig.logoUrl ? <img src={footerConfig.logoUrl} alt="" style={{ height: '40px', width: 'auto', marginBottom: '12px' }} /> : null}
                  {footerConfig.description ? <p style={{ margin: 0, lineHeight: 1.6 }}>{footerConfig.description}</p> : null}
                  {footerConfig.socialLinks.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {footerConfig.socialLinks.map((item, index) => (
                        <a key={`${item.platform}-${index}`} href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none', fontSize: '13px' }}>
                          {item.platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {footerConfig.columns.map((column, index) => (
                  <div key={`${column.title}-${index}`}>
                    <div style={{ color: 'var(--e-color-text)', fontWeight: 700, marginBottom: '10px' }}>{column.title}</div>
                    {column.text ? <p style={{ marginTop: 0, lineHeight: 1.6 }}>{column.text}</p> : null}
                    {column.links?.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {column.links.map((link, linkIndex) => (
                          <a key={`${link.url}-${linkIndex}`} href={link.url} target={link.target || '_self'} rel={link.target === '_blank' ? 'noreferrer' : undefined} style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none' }}>
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {footerMenu.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {footerMenu.map((item, index) => (
                  <a
                    key={`${item.id || item.url}-${index}`}
                    href={item.url}
                    target={item.target || '_self'}
                    rel={item.target === '_blank' ? 'noreferrer' : undefined}
                    style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none', fontSize: '14px' }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
            {footerConfig.links.length ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {footerConfig.links.map((item, index) => (
                  <a key={`${item.url}-${index}`} href={item.url} target={item.target || '_self'} rel={item.target === '_blank' ? 'noreferrer' : undefined} style={{ color: 'var(--e-color-textSecondary)', textDecoration: 'none', fontSize: '14px' }}>
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
            {footerConfig.newsletter.enabled && footerConfig.newsletter.title && (
              <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                <strong>{footerConfig.newsletter.title}</strong>
                {footerConfig.newsletter.description ? ` · ${footerConfig.newsletter.description}` : ''}
              </div>
            )}
            {footerConfig.copyright || `© ${new Date().getFullYear()} ${tenant.name}. Tutti i diritti riservati.`}
          </div>
        </footer>
      </body>
    </html>
  );
}
