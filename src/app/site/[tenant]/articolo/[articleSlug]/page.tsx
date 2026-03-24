import { notFound, redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { SiteLayout } from '@/components/render/SiteLayout';
import { ArticleComments } from '@/components/site/ArticleComments';
import { enrichArticlesWithCategories } from '@/lib/articles/taxonomy';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildTenantPublicUrl } from '@/lib/site/public-url';
import { sanitizeHtml } from '@/lib/security/html';

export const revalidate = 300;

interface Props {
  params: Promise<{ tenant: string; articleSlug: string }>;
}

interface SiteArticleRecord {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  body: string;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  category_id?: string | null;
  profiles?: { full_name: string; avatar_url: string | null; bio: string | null } | null;
  categories?: { name: string; slug: string; color: string | null } | null;
}

export default async function ArticlePage({ params }: Props) {
  const { tenant: tenantSlug, articleSlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config } = resolved;
  const supabase = await createServiceRoleClient();

  const { data: article } = await supabase
    .from('articles')
    .select('id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, category_id, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories:categories!articles_category_id_fkey(id, name, slug, color)')
    .eq('tenant_id', tenant.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single();

  if (!article) {
    const matchedRedirect = await resolveRedirect(tenant.id, `/articolo/${articleSlug}`);
    if (matchedRedirect) {
      redirect(buildTenantRedirectUrl(tenant.slug, matchedRedirect.targetPath));
    }
    notFound();
  }

  const [enrichedArticle] = await enrichArticlesWithCategories(
    supabase as never,
    tenant.id,
    [article as unknown as SiteArticleRecord]
  );

  // Increment view count
  await supabase.rpc('increment_view_count', { article_id: article.id });

  const author = enrichedArticle.profiles as unknown as { full_name: string; avatar_url: string | null; bio: string | null } | null;
  const categories = (enrichedArticle.all_categories as Array<{ name: string; slug: string; color: string | null }> | undefined) || [];
  const canonicalUrl = buildTenantPublicUrl(tenant, `/articolo/${articleSlug}`);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: enrichedArticle.meta_title || enrichedArticle.title,
    description: enrichedArticle.meta_description || enrichedArticle.summary || '',
    image: [enrichedArticle.og_image_url || enrichedArticle.cover_image_url].filter(Boolean),
    datePublished: enrichedArticle.published_at,
    dateModified: enrichedArticle.published_at,
    mainEntityOfPage: canonicalUrl,
    author: author?.full_name ? [{ '@type': 'Person', name: author.full_name }] : undefined,
    publisher: {
      '@type': 'Organization',
      name: tenant.name,
      logo: tenant.logo_url ? { '@type': 'ImageObject', url: tenant.logo_url } : undefined,
    },
  };

  return (
    <SiteLayout tenant={tenant} config={config}>
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--e-section-gap, 48px) 0' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        {/* Category */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {categories.map((category) => (
              <a
                key={category.slug}
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
            ))}
          </div>
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
          {enrichedArticle.subtitle && (
          <p style={{ fontSize: '20px', color: 'var(--e-color-textSecondary)', marginTop: '12px', lineHeight: 1.4 }}>
            {enrichedArticle.subtitle}
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
          {enrichedArticle.published_at && (
            <time>{new Date(enrichedArticle.published_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
          )}
          <span>{enrichedArticle.reading_time_minutes} min di lettura</span>
        </div>

        {/* Cover image */}
        {enrichedArticle.cover_image_url && (
          <img
            src={enrichedArticle.cover_image_url}
            alt={enrichedArticle.title}
            style={{ width: '100%', borderRadius: 'var(--e-border-radius, 8px)', marginTop: '32px' }}
          />
        )}

        {/* Body */}
        <div
          className="prose prose-lg max-w-none"
          style={{ marginTop: '32px', lineHeight: 1.8, fontSize: '18px' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(enrichedArticle.body) }}
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

        <ArticleComments
          tenantSlug={tenantSlug}
          articleSlug={articleSlug}
        />
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
  const canonical = buildTenantPublicUrl(resolved.tenant, `/articolo/${articleSlug}`);

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || '',
    alternates: {
      canonical,
    },
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || '',
      type: 'article',
      url: canonical,
      images: article.og_image_url || article.cover_image_url ? [{ url: article.og_image_url || article.cover_image_url }] : [],
    },
  };
}
