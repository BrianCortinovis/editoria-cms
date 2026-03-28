import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getPublishedCategoryBySlug, resolveTenant } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { SiteLayout } from '@/components/render/SiteLayout';
import { enrichArticlesWithCategories, fetchArticleIdsForCategory } from '@/lib/articles/taxonomy';
import { getActiveExclusivePlacementArticleIds } from '@/lib/editorial/placements';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

export const revalidate = 120;

interface Props {
  params: Promise<{ tenant: string; categorySlug: string }>;
}

interface CategoryPageArticleRecord {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  category_id?: string | null;
  profiles?: { full_name: string } | null;
  categories?: { name: string; slug: string; color: string | null } | null;
}

export default async function CategoryPage({ params }: Props) {
  const { tenant: tenantSlug, categorySlug } = await params;

  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) notFound();

  const { tenant, config, tenantSettings } = resolved;
  const publishedCategory = await getPublishedCategoryBySlug(tenant.slug, categorySlug);
  let category = publishedCategory?.category
    ? {
        id: publishedCategory.category.id,
        name: publishedCategory.category.name,
        slug: publishedCategory.category.slug,
        description: publishedCategory.category.description,
        color: publishedCategory.category.color,
      }
    : null;
  let enrichedArticles:
    | Array<CategoryPageArticleRecord & { all_categories?: Array<{ name: string; slug: string; color?: string | null }> }>
    | null = publishedCategory?.articles
      ? (publishedCategory.articles as Array<CategoryPageArticleRecord & { all_categories?: Array<{ name: string; slug: string; color?: string | null }> }>)
      : null;

  if (!category) {
    const supabase = await createServiceRoleClient();

    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, description, color')
      .eq('tenant_id', tenant.id)
      .eq('slug', categorySlug)
      .single();

    category = data;

    if (category) {
      const relatedArticleIds = await fetchArticleIdsForCategory(supabase as never, category.id);
      const hiddenArticleIds = new Set(
        await getActiveExclusivePlacementArticleIds(supabase as never, tenant.id)
      );

      const createArticleQuery = () =>
        supabase
          .from('articles')
          .select('id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, category_id, profiles!articles_author_id_fkey(full_name), categories:categories!articles_category_id_fkey(id, name, slug, color)')
          .eq('tenant_id', tenant.id)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(30);

      let articles: CategoryPageArticleRecord[] | null = null;

      if (relatedArticleIds && relatedArticleIds.length > 0) {
        const visibleRelatedArticleIds = relatedArticleIds.filter((articleId) => !hiddenArticleIds.has(articleId));

        if (visibleRelatedArticleIds.length > 0) {
          const { data: rows } = await createArticleQuery().in('id', visibleRelatedArticleIds);
          articles = (rows || []) as unknown as CategoryPageArticleRecord[];
        } else {
          articles = [];
        }
      } else {
        const { data: rows } = await createArticleQuery().eq('category_id', category.id);
        articles = ((rows || []) as unknown as CategoryPageArticleRecord[]).filter(
          (article) => !hiddenArticleIds.has(article.id)
        );
      }

      enrichedArticles = (await enrichArticlesWithCategories(
        supabase as never,
        tenant.id,
        (articles || []) as unknown as CategoryPageArticleRecord[]
      )) as Array<CategoryPageArticleRecord & {
        all_categories?: Array<{ name: string; slug: string; color?: string | null }>;
      }>;
    }
  }

  if (!category) {
    const matchedRedirect = await resolveRedirect(tenant.id, `/categoria/${categorySlug}`);
    if (matchedRedirect) {
      redirect(buildTenantRedirectUrl(tenant.slug, matchedRedirect.targetPath));
    }
    notFound();
  }

  const articles = (enrichedArticles || []) as Array<CategoryPageArticleRecord & {
    all_categories?: Array<{ name: string; slug: string; color?: string | null }>;
  }>;

  return (
    <SiteLayout tenant={tenant} config={config} tenantSettings={tenantSettings}>
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
          {articles.map((article) => (
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
                <Image src={article.cover_image_url} alt={article.title} width={300} height={169} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px" loading="lazy" style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover' }} />
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

  const publishedCategory = await getPublishedCategoryBySlug(resolved.tenant.slug, categorySlug);
  let category = publishedCategory?.category
    ? {
        name: publishedCategory.category.name,
        description: publishedCategory.category.description,
      }
    : null;

  if (!category) {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from('categories')
      .select('name, description')
      .eq('tenant_id', resolved.tenant.id)
      .eq('slug', categorySlug)
      .single();
    category = data;
  }

  if (!category) return {};
  const canonical = buildTenantPublicUrl(resolved.tenant, `/categoria/${categorySlug}`);
  return {
    title: `${category.name} - ${resolved.tenant.name}`,
    description: category.description || `Articoli nella categoria ${category.name}`,
    alternates: {
      canonical,
    },
    twitter: {
      card: 'summary',
      title: `${category.name} - ${resolved.tenant.name}`,
      description: category.description || `Articoli nella categoria ${category.name}`,
    },
  };
}
