import { notFound } from 'next/navigation';
import { resolveTenant, getPublishedPage } from '@/lib/site/tenant-resolver';
import { SiteLayout } from '@/components/render/SiteLayout';
import { BlockRenderer } from '@/components/render/BlockRenderer';
import { PageBackgroundFrame } from '@/components/render/PageBackgroundFrame';
import { buildBreadcrumbSchema, buildPageSchema, resolveCanonicalUrl } from '@/lib/seo/runtime';

export const revalidate = 60;

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantHomePage({ params }: Props) {
  const { tenant: tenantSlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config, tenantSettings } = resolved;

  // Try homepage slug, then "/"
  const page = await getPublishedPage(tenant.id, 'homepage')
    || await getPublishedPage(tenant.id, '/');
  const meta = (page?.meta || {}) as Record<string, unknown>;
  const canonical = resolveCanonicalUrl(tenant, meta.canonicalPath, '/');
  const pageSchema = buildPageSchema({
    schemaType: meta.schemaType,
    title: typeof meta.title === 'string' && meta.title.trim() ? meta.title : tenant.name,
    description:
      typeof meta.description === 'string' && meta.description.trim()
        ? meta.description
        : `${tenant.name} - Testata giornalistica`,
    url: canonical,
    siteName: tenant.name,
    imageUrl: tenant.logo_url || null,
  });
  const breadcrumbSchema = buildBreadcrumbSchema({
    tenant,
    items: [{ name: 'Home', path: '/' }],
  });

  return (
    <SiteLayout tenant={tenant} config={config} tenantSettings={tenantSettings}>
      {page ? (
        <PageBackgroundFrame meta={page.meta as Record<string, unknown>} scopeId={`public-home-${page.id}`}>
          {pageSchema ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
          ) : null}
          {breadcrumbSchema ? (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
          ) : null}
          <BlockRenderer
            blocks={page.blocks as import('@/lib/types/block').Block[]}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            resolvedDataMap={(page as { resolved_data_map?: Record<string, unknown[]> }).resolved_data_map}
          />
        </PageBackgroundFrame>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--e-color-textSecondary)' }}>
          <h1 style={{ fontFamily: 'var(--e-font-heading)', fontSize: '32px', fontWeight: 'bold', color: 'var(--e-color-text)' }}>
            {tenant.name}
          </h1>
          <p style={{ marginTop: '16px' }}>Sito in costruzione</p>
        </div>
      )}
    </SiteLayout>
  );
}

export async function generateMetadata({ params }: Props) {
  const { tenant: tenantSlug } = await params;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) return {};
  const page = await getPublishedPage(resolved.tenant.id, 'homepage')
    || await getPublishedPage(resolved.tenant.id, '/');
  const meta = (page?.meta || {}) as Record<string, unknown>;
  const canonical = resolveCanonicalUrl(
    resolved.tenant,
    meta.canonicalPath,
    '/'
  );
  return {
    title: typeof meta.title === 'string' && meta.title.trim() ? meta.title : resolved.tenant.name,
    description: typeof meta.description === 'string' && meta.description.trim()
      ? meta.description
      : `${resolved.tenant.name} - Testata giornalistica`,
    alternates: {
      canonical,
    },
    robots: {
      index: meta.noindex ? false : true,
      follow: meta.nofollow ? false : true,
    },
    openGraph: {
      title: typeof meta.ogTitle === 'string' && meta.ogTitle.trim()
        ? meta.ogTitle
        : (typeof meta.title === 'string' && meta.title.trim() ? meta.title : resolved.tenant.name),
      description: typeof meta.ogDescription === 'string' && meta.ogDescription.trim()
        ? meta.ogDescription
        : (typeof meta.description === 'string' && meta.description.trim()
            ? meta.description
            : `${resolved.tenant.name} - Testata giornalistica`),
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof meta.ogTitle === 'string' && meta.ogTitle.trim()
        ? meta.ogTitle
        : (typeof meta.title === 'string' && meta.title.trim() ? meta.title : resolved.tenant.name),
      description: typeof meta.ogDescription === 'string' && meta.ogDescription.trim()
        ? meta.ogDescription
        : (typeof meta.description === 'string' && meta.description.trim()
            ? meta.description
            : `${resolved.tenant.name} - Testata giornalistica`),
    },
  };
}
