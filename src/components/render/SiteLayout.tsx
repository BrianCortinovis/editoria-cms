import type { ResolvedTenant, SiteConfig, TenantSettings } from '@/lib/site/tenant-resolver';
import { themeToCSS } from '@/lib/site/theme-injector';
import { getNavigationMenu, normalizeNavigationConfig } from '@/lib/site/navigation';
import { normalizeFooterConfig } from '@/lib/site/footer';
import { sanitizeCss } from '@/lib/security/html';
import { PublicSiteRuntime } from './PublicSiteRuntime';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

interface Props {
  tenant: ResolvedTenant;
  config: SiteConfig | null;
  tenantSettings?: TenantSettings;
  children: React.ReactNode;
}

function getStringSetting(settings: TenantSettings | undefined, key: string) {
  const value = settings?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function SiteLayout({ tenant, config, tenantSettings, children }: Props) {
  const themeCSS = config?.theme ? themeToCSS(config.theme) : '';
  const themeConfig = (config?.theme || {}) as Record<string, unknown>;
  const navigationConfig = normalizeNavigationConfig(config?.navigation || []);
  const topbarMenu = getNavigationMenu(navigationConfig, 'secondary');
  const primaryMenu = getNavigationMenu(navigationConfig, 'primary');
  const footerMenu = getNavigationMenu(navigationConfig, 'footer');
  const footerConfig = normalizeFooterConfig(config?.footer || {});
  const chromePreset = typeof themeConfig.layoutPreset === 'string' ? themeConfig.layoutPreset : 'default';
  const isNewspaperChrome = chromePreset === 'newspaper';
  const mastheadNote = typeof themeConfig.mastheadNote === 'string' ? themeConfig.mastheadNote : '';
  const siteDescription = getStringSetting(tenantSettings, 'site_description');
  const gaId = getStringSetting(tenantSettings, 'google_analytics');
  const gtmId = getStringSetting(tenantSettings, 'google_tag_manager');
  const adsenseId = getStringSetting(tenantSettings, 'google_adsense');
  const searchConsoleVerification = getStringSetting(tenantSettings, 'google_search_console_verification');
  const googleNewsPublicationName = getStringSetting(tenantSettings, 'google_news_publication_name');
  const publicBaseUrl = buildTenantPublicUrl(tenant, '/');
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: googleNewsPublicationName || tenant.name,
    url: publicBaseUrl,
    description: siteDescription || undefined,
    logo: tenant.logo_url ? { '@type': 'ImageObject', url: tenant.logo_url } : undefined,
  };
  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {siteDescription ? <meta name="description" content={siteDescription} /> : null}
        {searchConsoleVerification ? <meta name="google-site-verification" content={searchConsoleVerification} /> : null}
        {config?.favicon_url && <link rel="icon" href={config.favicon_url} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        {gtmId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
                `,
              }}
            />
          </>
        ) : gaId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        ) : null}
        {adsenseId ? (
          <script
            async
            crossOrigin="anonymous"
            data-ad-client={adsenseId}
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          />
        ) : null}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: sanitizeCss(themeCSS) }} />}
        {config?.global_css && <style dangerouslySetInnerHTML={{ __html: sanitizeCss(config.global_css) }} />}
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
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ) : null}
        <PublicSiteRuntime />
        {topbarMenu.length > 0 && (
          <div
            style={{
              borderBottom: isNewspaperChrome ? '1px solid var(--e-color-accent, #c1121f)' : '1px solid var(--e-color-border, #dee2e6)',
              backgroundColor: isNewspaperChrome ? 'var(--e-color-primary, #0b1f44)' : 'var(--e-color-background, #ffffff)',
            }}
          >
            <div
              style={{
                maxWidth: 'var(--e-container-max, 1200px)',
                margin: '0 auto',
                padding: isNewspaperChrome ? '10px 24px 8px' : '8px 24px',
                display: 'flex',
                gap: isNewspaperChrome ? '16px' : '18px',
                flexWrap: 'wrap',
                justifyContent: isNewspaperChrome ? 'center' : 'flex-start',
              }}
            >
              {topbarMenu.map((item, index) => (
                <a
                  key={`${item.id || item.url}-${index}`}
                  href={item.url}
                  target={item.target || '_self'}
                  rel={item.target === '_blank' ? 'noreferrer' : undefined}
                  style={{
                    color: isNewspaperChrome ? 'rgba(255,255,255,0.92)' : 'var(--e-color-textSecondary)',
                    textDecoration: 'none',
                    fontSize: isNewspaperChrome ? '11px' : '12px',
                    fontWeight: isNewspaperChrome ? 700 : 500,
                    letterSpacing: isNewspaperChrome ? '0.12em' : 'normal',
                    textTransform: isNewspaperChrome ? 'uppercase' : 'none',
                  }}
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
            backgroundColor: isNewspaperChrome ? 'var(--e-color-background, #ffffff)' : 'var(--e-color-surface, #f8f9fa)',
          }}
        >
          {isNewspaperChrome ? (
            <>
              <div style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', padding: '12px 24px 6px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: '18px' }}>
                <div style={{ fontSize: '11px', color: 'var(--e-color-textSecondary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                  {formattedDate}
                </div>
                <a href={`/site/${tenant.slug}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tenant.logo_url ? '8px' : '0', textDecoration: 'none' }}>
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt={tenant.name} style={{ height: '42px', width: 'auto' }} />
                  ) : null}
                  <span style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 0.92, color: 'var(--e-color-text)', textAlign: 'center' }}>
                    {tenant.name}
                  </span>
                </a>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontSize: '11px', color: 'var(--e-color-accent, #c1121f)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>
                  {mastheadNote || 'Digital edition'}
                </div>
              </div>
              {primaryMenu.length > 0 && (
                <div style={{ borderTop: '1px solid var(--e-color-accent, #c1121f)', borderBottom: '1px solid var(--e-color-accent, #c1121f)', backgroundColor: 'var(--e-color-primary, #0b1f44)' }}>
                  <nav style={{ maxWidth: 'var(--e-container-max, 1200px)', margin: '0 auto', padding: '11px 24px', display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {primaryMenu.map((item, i) => (
                      <a
                        key={`${item.id || item.url}-${i}`}
                        href={item.url}
                        target={item.target || '_self'}
                        rel={item.target === '_blank' ? 'noreferrer' : undefined}
                        style={{ color: '#ffffff', textDecoration: 'none', fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </>
          ) : (
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
          )}
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
