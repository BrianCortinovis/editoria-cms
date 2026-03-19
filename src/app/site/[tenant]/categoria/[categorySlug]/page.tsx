import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/site/tenant-resolver';
import { SiteLayout } from '@/components/render/SiteLayout';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const revalidate = 120;

interface Props {
  params: Promise<{ tenant: string; categorySlug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { tenant: tenantSlug, categorySlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config } = resolved;
  const supabase = await createServiceRoleClient();

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, description, color')
    .eq('tenant_id', tenant.id)
    .eq('slug', categorySlug)
    .single();

  if (!category) notFound();

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, profiles!articles_author_id_fkey(full_name)')
    .eq('tenant_id', tenant.id)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30);

  return (
    <SiteLayout tenant={tenant} config={config}>
      <div style={{ padding: 'var(--e-section-gap, 48px) 0' }}>
        {/* Category header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--e-font-heading)',
            fontSize: '32px',
            fontWeight: 800,
            color: category.color || 'var(--e-color-text)',
          }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ color: 'var(--e-color-textSecondary)', marginTop: '8px', fontSize: '16px' }}>
              {category.description}
            </p>
          )}
        </div>

        {/* Articles grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {(articles || []).map((article) => (
            <a
              key={article.id}
              href={`/site/${tenantSlug}/articolo/${article.slug}`}
              style={{
                display: 'block',
                borderRadius: 'var(--e-border-radius, 8px)',
                border: '1px solid var(--e-color-border)',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              {article.cover_image_url && (
                <img src={article.cover_image_url} alt={article.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} loading="lazy" />
              )}
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontFamily: 'var(--e-font-heading)', fontWeight: 700, fontSize: '18px', color: 'var(--e-color-text)' }}>
                  {article.title}
                </h3>
                {article.summary && (
                  <p style={{ fontSize: '14px', color: 'var(--e-color-textSecondary)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {article.summary}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: 'var(--e-color-textSecondary)' }}>
                  <span>{(article.profiles as unknown as { full_name: string })?.full_name}</span>
                  {article.published_at && <time>{new Date(article.published_at).toLocaleDateString('it-IT')}</time>}
                  <span>{article.reading_time_minutes} min</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

export async function generateMetadata({ params }: Props) {
  const { tenant: tenantSlug, categorySlug } = await params;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) return {};

  const supabase = await createServiceRoleClient();
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('tenant_id', resolved.tenant.id)
    .eq('slug', categorySlug)
    .single();

  if (!category) return {};
  return {
    title: `${category.name} - ${resolved.tenant.name}`,
    description: category.description || `Articoli nella categoria ${category.name}`,
  };
}
