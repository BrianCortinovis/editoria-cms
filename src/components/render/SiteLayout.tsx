import type { ResolvedTenant, SiteConfig } from '@/lib/site/tenant-resolver';
import { themeToCSS } from '@/lib/site/theme-injector';

interface Props {
  tenant: ResolvedTenant;
  config: SiteConfig | null;
  children: React.ReactNode;
}

export function SiteLayout({ tenant, config, children }: Props) {
  const themeCSS = config?.theme ? themeToCSS(config.theme) : '';
  const nav = config?.navigation || [];

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
            {nav.length > 0 && (
              <nav style={{ display: 'flex', gap: '24px' }}>
                {nav.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
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
          <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', textAlign: 'center', color: 'var(--e-color-textSecondary)', fontSize: '14px' }}>
            &copy; {new Date().getFullYear()} {tenant.name}. Tutti i diritti riservati.
          </div>
        </footer>
      </body>
    </html>
  );
}
