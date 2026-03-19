import { notFound } from 'next/navigation';
import { resolveTenant, getPublishedPage } from '@/lib/site/tenant-resolver';
import { SiteLayout } from '@/components/render/SiteLayout';
import { BlockRenderer } from '@/components/render/BlockRenderer';

export const revalidate = 60;

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantHomePage({ params }: Props) {
  const { tenant: tenantSlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config } = resolved;

  // Try homepage slug, then "/"
  const page = await getPublishedPage(tenant.id, 'homepage')
    || await getPublishedPage(tenant.id, '/');

  return (
    <SiteLayout tenant={tenant} config={config}>
      {page ? (
        <BlockRenderer
          blocks={page.blocks as import('@/lib/types/block').Block[]}
          tenantId={tenant.id}
          tenantSlug={tenant.slug}
        />
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
  return {
    title: resolved.tenant.name,
    description: `${resolved.tenant.name} - Testata giornalistica`,
  };
}
