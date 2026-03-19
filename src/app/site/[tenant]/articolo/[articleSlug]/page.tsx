import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/site/tenant-resolver';
import { SiteLayout } from '@/components/render/SiteLayout';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const revalidate = 300;

interface Props {
  params: Promise<{ tenant: string; articleSlug: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { tenant: tenantSlug, articleSlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config } = resolved;
  const supabase = await createServiceRoleClient();

  const { data: article } = await supabase
    .from('articles')
    .select('id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories(name, slug, color)')
    .eq('tenant_id', tenant.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single();

  if (!article) notFound();

  // Increment view count
  await supabase.rpc('increment_view_count', { article_id: article.id });

  const author = article.profiles as unknown as { full_name: string; avatar_url: string | null; bio: string | null } | null;
  const category = article.categories as unknown as { name: string; slug: string; color: string | null } | null;

  return (
    <SiteLayout tenant={tenant} config={config}>
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--e-section-gap, 48px) 0' }}>
        {/* Category */}
        {category && (
          <a
            href={`/site/${tenantSlug}/categoria/${category.slug}`}
            style={{
              color: category.color || 'var(--e-color-primary)',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
            }}
          >
            {category.name}
          </a>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--e-font-heading)',
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginTop: '12px',
          color: 'var(--e-color-text)',
        }}>
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p style={{ fontSize: '20px', color: 'var(--e-color-textSecondary)', marginTop: '12px', lineHeight: 1.4 }}>
            {article.subtitle}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--e-color-border)', fontSize: '14px', color: 'var(--e-color-textSecondary)' }}>
          {author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {author.avatar_url && (
                <img src={author.avatar_url} alt={author.full_name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span style={{ fontWeight: 600 }}>{author.full_name}</span>
            </div>
          )}
          {article.published_at && (
            <time>{new Date(article.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          )}
          <span>{article.reading_time_minutes} min di lettura</span>
        </div>

        {/* Cover image */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            style={{ width: '100%', borderRadius: 'var(--e-border-radius, 8px)', marginTop: '32px' }}
          />
        )}

        {/* Body */}
        <div
          className="prose prose-lg max-w-none"
          style={{ marginTop: '32px', lineHeight: 1.8, fontSize: '18px' }}
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Author bio */}
        {author?.bio && (
          <div style={{ marginTop: '48px', padding: '24px', backgroundColor: 'var(--e-color-surface)', borderRadius: 'var(--e-border-radius, 8px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {author.avatar_url && (
                <img src={author.avatar_url} alt={author.full_name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <div>
                <div style={{ fontWeight: 700 }}>{author.full_name}</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--e-color-textSecondary)', lineHeight: 1.6 }}>{author.bio}</p>
          </div>
        )}
      </article>
    </SiteLayout>
  );
}

export async function generateMetadata({ params }: Props) {
  const { tenant: tenantSlug, articleSlug } = await params;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) return {};

  const supabase = await createServiceRoleClient();
  const { data: article } = await supabase
    .from('articles')
    .select('title, meta_title, meta_description, og_image_url, cover_image_url')
    .eq('tenant_id', resolved.tenant.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single();

  if (!article) return {};

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || '',
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || '',
      images: article.og_image_url || article.cover_image_url ? [{ url: article.og_image_url || article.cover_image_url }] : [],
    },
  };
}
