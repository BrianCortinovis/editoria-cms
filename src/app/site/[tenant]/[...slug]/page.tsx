import { notFound, redirect } from 'next/navigation';
import { resolveTenant, getPublishedPage } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { SiteLayout } from '@/components/render/SiteLayout';
import { BlockRenderer } from '@/components/render/BlockRenderer';
import type { Block } from '@/lib/types/block';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

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
      <BlockRenderer
        blocks={page.blocks as Block[]}
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
      />
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
  const meta = page.meta as Record<string, string>;
  const canonical = buildTenantPublicUrl(resolved.tenant, `/${slug.join('/')}`);
  return {
    title: meta?.title || page.title,
    description: meta?.description || `${page.title} - ${resolved.tenant.name}`,
    alternates: {
      canonical,
    },
  };
}
