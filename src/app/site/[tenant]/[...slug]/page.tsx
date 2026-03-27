import { notFound, redirect } from 'next/navigation';
import { resolveTenant, getPublishedPage } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { SiteLayout } from '@/components/render/SiteLayout';
import { BlockRenderer } from '@/components/render/BlockRenderer';
import type { Block } from '@/lib/types/block';
import { buildTenantPublicUrl } from '@/lib/site/public-url';
import { PageBackgroundFrame } from '@/components/render/PageBackgroundFrame';

export const revalidate = 120;

interface Props {
  params: Promise<{ tenant: string; slug: string[] }>;
}

export default async function TenantCatchAllPage({ params }: Props) {
  const { tenant: tenantSlug, slug } = await params;
  const pageSlug = slug.join('/');

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config } = resolved;
  const page = await getPublishedPage(tenant.id, pageSlug);
  if (!page) {
    const matchedRedirect = await resolveRedirect(tenant.id, `/${pageSlug}`);
    if (matchedRedirect) {
      redirect(buildTenantRedirectUrl(tenant.slug, matchedRedirect.targetPath));
    }
    notFound();
  }

  return (
    <SiteLayout tenant={tenant} config={config}>
      <PageBackgroundFrame meta={page.meta as Record<string, unknown>} scopeId={`public-page-${page.id}`}>
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
  const page = await getPublishedPage(resolved.tenant.id, slug.join('/'));
  if (!page) {
    return {};
  }
  const meta = page.meta as Record<string, unknown>;
  const canonical = buildTenantPublicUrl(
    resolved.tenant,
    typeof meta?.canonicalPath === 'string' && meta.canonicalPath.trim()
      ? meta.canonicalPath
      : `/${slug.join('/')}`
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
  };
}
