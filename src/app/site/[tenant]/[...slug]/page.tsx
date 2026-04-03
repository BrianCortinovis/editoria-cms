import { notFound, redirect } from 'next/navigation';
import { resolveTenant, getPublishedPage } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { resolveCompliancePageBySlug } from '@/lib/legal/public-compliance';
import { SiteLayout } from '@/components/render/SiteLayout';
import { BlockRenderer } from '@/components/render/BlockRenderer';
import { LegalPageTemplate } from '@/components/render/LegalPageTemplate';
import type { Block } from '@/lib/types/block';
import { buildTenantPublicUrl } from '@/lib/site/public-url';
import { PageBackgroundFrame } from '@/components/render/PageBackgroundFrame';
import { buildBreadcrumbSchema, buildPageSchema, resolveCanonicalUrl } from '@/lib/seo/runtime';

export const revalidate = 120;

interface Props {
  params: Promise<{ tenant: string; slug: string[] }>;
}

export default async function TenantCatchAllPage({ params }: Props) {
  const { tenant: tenantSlug, slug } = await params;
  const pageSlug = slug.join('/');

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config, tenantSettings } = resolved;
  const compliancePage = resolveCompliancePageBySlug(tenant, tenantSettings, slug);
  if (compliancePage) {
    return (
      <SiteLayout tenant={tenant} config={config} tenantSettings={tenantSettings}>
        <LegalPageTemplate page={compliancePage} siteName={tenant.name} />
      </SiteLayout>
    );
  }

  const page = await getPublishedPage(tenant.id, pageSlug);
  if (!page) {
    const matchedRedirect = await resolveRedirect(tenant.id, `/${pageSlug}`);
    if (matchedRedirect) {
      redirect(buildTenantRedirectUrl(tenant.slug, matchedRedirect.targetPath));
    }
    notFound();
  }

  const pageMeta = (page.meta || {}) as Record<string, unknown>;
  const canonical = resolveCanonicalUrl(
    tenant,
    pageMeta.canonicalPath,
    `/${slug.join('/')}`
  );
  const breadcrumbSchema = buildBreadcrumbSchema({
    tenant,
    items: [
      { name: 'Home', path: '/' },
      { name: page.title, path: `/${slug.join('/')}` },
    ],
  });
  const pageSchema = buildPageSchema({
    schemaType: pageMeta.schemaType,
    title: typeof pageMeta.title === 'string' && pageMeta.title.trim() ? pageMeta.title : page.title,
    description:
      typeof pageMeta.description === 'string' && pageMeta.description.trim()
        ? pageMeta.description
        : `${page.title} - ${tenant.name}`,
    url: canonical,
    siteName: tenant.name,
    imageUrl: tenant.logo_url || null,
  });

  return (
    <SiteLayout tenant={tenant} config={config} tenantSettings={tenantSettings}>
      <PageBackgroundFrame meta={page.meta as Record<string, unknown>} scopeId={`public-page-${page.id}`}>
        {pageSchema ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
        ) : null}
        {breadcrumbSchema ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        ) : null}
        <BlockRenderer
          blocks={page.blocks as Block[]}
          tenantId={tenant.id}
          tenantSlug={tenant.slug}
          resolvedDataMap={(page as { resolved_data_map?: Record<string, unknown[]> }).resolved_data_map}
        />
      </PageBackgroundFrame>
    </SiteLayout>
  );
}

export async function generateMetadata({ params }: Props) {
  const { tenant: tenantSlug, slug } = await params;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) return {};
  const compliancePage = resolveCompliancePageBySlug(resolved.tenant, resolved.tenantSettings, slug);
  if (compliancePage) {
    const canonical = buildTenantPublicUrl(resolved.tenant, compliancePage.path);
    return {
      title: compliancePage.title,
      description: compliancePage.summary,
      alternates: {
        canonical,
      },
      openGraph: {
        title: compliancePage.title,
        description: compliancePage.summary,
        url: canonical,
      },
      twitter: {
        card: 'summary_large_image',
        title: compliancePage.title,
        description: compliancePage.summary,
      },
    };
  }
  const page = await getPublishedPage(resolved.tenant.id, slug.join('/'));
  if (!page) {
    return {};
  }
  const meta = page.meta as Record<string, unknown>;
  const canonical = resolveCanonicalUrl(
    resolved.tenant,
    meta?.canonicalPath,
    `/${slug.join('/')}`
  );
  return {
    title: typeof meta?.title === 'string' && meta.title.trim() ? meta.title : page.title,
    description: typeof meta?.description === 'string' && meta.description.trim()
      ? meta.description
      : `${page.title} - ${resolved.tenant.name}`,
    alternates: {
      canonical,
    },
    robots: {
      index: meta?.noindex ? false : true,
      follow: meta?.nofollow ? false : true,
    },
    openGraph: {
      title: typeof meta?.ogTitle === 'string' && meta.ogTitle.trim()
        ? meta.ogTitle
        : (typeof meta?.title === 'string' && meta.title.trim() ? meta.title : page.title),
      description: typeof meta?.ogDescription === 'string' && meta.ogDescription.trim()
        ? meta.ogDescription
        : (typeof meta?.description === 'string' && meta.description.trim()
            ? meta.description
            : `${page.title} - ${resolved.tenant.name}`),
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof meta?.ogTitle === 'string' && meta.ogTitle.trim()
        ? meta.ogTitle
        : (typeof meta?.title === 'string' && meta.title.trim() ? meta.title : page.title),
      description: typeof meta?.ogDescription === 'string' && meta.ogDescription.trim()
        ? meta.ogDescription
        : (typeof meta?.description === 'string' && meta.description.trim()
            ? meta.description
            : `${page.title} - ${resolved.tenant.name}`),
    },
  };
}
