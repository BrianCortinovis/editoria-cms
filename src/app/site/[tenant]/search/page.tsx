import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteLayout } from '@/components/render/SiteLayout';
import { resolveTenant } from '@/lib/site/tenant-resolver';
import { searchSiteContent } from '@/lib/site/search';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

export const revalidate = 120;

interface Props {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ q?: string; mode?: string }>;
}

export default async function TenantSearchPage({ params, searchParams }: Props) {
  const { tenant: tenantSlug } = await params;
  const { q = '', mode = 'simple' } = await searchParams;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const query = q.trim();
  const results = query
    ? await searchSiteContent({
        tenantSlug,
        query,
        mode: mode === 'semantic' ? 'semantic' : 'simple',
        limit: 20,
      })
    : null;

  return (
    <SiteLayout tenant={resolved.tenant} config={resolved.config}>
      <section style={{ maxWidth: '980px', margin: '0 auto', padding: 'var(--e-section-gap, 48px) 0' }}>
        <div style={{ display: 'grid', gap: '18px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--e-color-textSecondary)' }}>
              Ricerca sito
            </div>
            <h1 style={{ fontFamily: 'var(--e-font-heading)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--e-color-text)', marginTop: '8px' }}>
              {query ? `Risultati per "${query}"` : 'Cerca nel sito'}
            </h1>
            <p style={{ marginTop: '10px', color: 'var(--e-color-textSecondary)', lineHeight: 1.6 }}>
              Cerca articoli e pagine pubblicate come in un CMS editoriale classico, con supporto a contenuti WordPress-like.
            </p>
          </div>

          <form method="get" style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr auto auto' }}>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cerca articoli, pagine, rubriche..."
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--e-color-border)',
                background: 'var(--e-color-surface, #fff)',
                color: 'var(--e-color-text)',
              }}
            />
            <select
              name="mode"
              defaultValue={mode === 'semantic' ? 'semantic' : 'simple'}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--e-color-border)',
                background: 'var(--e-color-surface, #fff)',
                color: 'var(--e-color-text)',
              }}
            >
              <option value="simple">Ricerca classica</option>
              <option value="semantic">Ricerca AI</option>
            </select>
            <button
              type="submit"
              style={{
                padding: '0.95rem 1.2rem',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--e-color-primary, #8B0000)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerca
            </button>
          </form>
        </div>

        {!query && (
          <div style={{ padding: '28px', borderRadius: '18px', background: 'var(--e-color-surface)', color: 'var(--e-color-textSecondary)' }}>
            Inserisci una parola chiave per cercare tra articoli e pagine pubblicate.
          </div>
        )}

        {query && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', color: 'var(--e-color-textSecondary)', fontSize: '14px' }}>
              <span>{results?.results.length || 0} risultati</span>
              <span>Modalità: {results?.mode === 'semantic' ? 'AI semantica' : results?.mode === 'fallback' ? 'fallback classico' : 'classica'}</span>
            </div>

            {(results?.results || []).length === 0 && (
              <div style={{ padding: '28px', borderRadius: '18px', background: 'var(--e-color-surface)', color: 'var(--e-color-textSecondary)' }}>
                Nessun risultato trovato. Prova con parole chiave più generiche o una forma singolare/plurale diversa.
              </div>
            )}

            {(results?.results || []).map((result) => {
              const href = result.url;
              const prettyUrl = (() => {
                try {
                  const parsed = new URL(result.url);
                  return `${parsed.pathname}${parsed.search}`;
                } catch {
                  return result.url;
                }
              })();

              return (
                <article
                  key={`${result.type}-${result.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: result.imageUrl ? '180px 1fr' : '1fr',
                    gap: '20px',
                    padding: '20px',
                    borderRadius: '18px',
                    border: '1px solid var(--e-color-border)',
                    background: 'var(--e-color-surface, #fff)',
                  }}
                >
                  {result.imageUrl && (
                    <div
                      style={{
                        minHeight: '120px',
                        borderRadius: '14px',
                        backgroundImage: `url(${result.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--e-color-textSecondary)' }}>
                      <span>{result.type === 'article' ? 'Articolo' : 'Pagina'}</span>
                      {result.publishedAt && (
                        <time>{new Date(result.publishedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                      )}
                    </div>
                    <h2 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--e-color-text)' }}>
                      <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {result.title}
                      </Link>
                    </h2>
                    {result.excerpt && (
                      <p style={{ marginTop: '10px', color: 'var(--e-color-textSecondary)', lineHeight: 1.7 }}>
                        {result.excerpt}
                      </p>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--e-color-textSecondary)' }}>
                      <span>{prettyUrl}</span>
                      {result.readingTimeMinutes ? <span>{result.readingTimeMinutes} min lettura</span> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { tenant: tenantSlug } = await params;
  const { q = '' } = await searchParams;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) return {};

  const canonical = buildTenantPublicUrl(resolved.tenant, `/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);

  return {
    title: q.trim() ? `Ricerca: ${q.trim()} - ${resolved.tenant.name}` : `Ricerca - ${resolved.tenant.name}`,
    description: `Ricerca interna del sito ${resolved.tenant.name}`,
    alternates: {
      canonical,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}
