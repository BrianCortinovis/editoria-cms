import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getPublishedCategoryBySlug, resolveTenant } from '@/lib/site/tenant-resolver';
import { buildTenantRedirectUrl, resolveRedirect } from '@/lib/site/redirects';
import { SiteLayout } from '@/components/render/SiteLayout';
import { enrichArticlesWithCategories, fetchArticleIdsForCategory } from '@/lib/articles/taxonomy';
import { getActiveExclusivePlacementArticleIds } from '@/lib/editorial/placements';
import { createServiceRoleClientForTenant } from '@/lib/supabase/server';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

export const revalidate = 120;

const ARTICLES_PER_PAGE = 24;

interface Props {
  params: Promise<{ tenant: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
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

export default async function CategoryPage({ params, searchParams }: Props) {
  const { tenant: tenantSlug, categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10) || 1);

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
  let totalArticleCount = 0;
  const allPublishedArticles = publishedCategory?.articles
    ? (publishedCategory.articles as Array<CategoryPageArticleRecord & { all_categories?: Array<{ name: string; slug: string; color?: string | null }> }>)
    : null;
  let enrichedArticles:
    | Array<CategoryPageArticleRecord & { all_categories?: Array<{ name: string; slug: string; color?: string | null }> }>
    | null = null;

  if (allPublishedArticles) {
    totalArticleCount = allPublishedArticles.length;
    const offset = (currentPage - 1) * ARTICLES_PER_PAGE;
    enrichedArticles = allPublishedArticles.slice(offset, offset + ARTICLES_PER_PAGE);
  }

  if (!category) {
    const supabase = await createServiceRoleClientForTenant(tenant.id);

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

      const offset = (currentPage - 1) * ARTICLES_PER_PAGE;
      const createArticleQuery = () =>
        supabase
          .from('articles')
          .select('id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, category_id, profiles!articles_author_id_fkey(full_name), categories:categories!articles_category_id_fkey(id, name, slug, color)', { count: 'exact' })
          .eq('tenant_id', tenant.id)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .range(offset, offset + ARTICLES_PER_PAGE - 1);

      let articles: CategoryPageArticleRecord[] | null = null;
      let totalCount = 0;

      if (relatedArticleIds && relatedArticleIds.length > 0) {
        const visibleRelatedArticleIds = relatedArticleIds.filter((articleId) => !hiddenArticleIds.has(articleId));

        if (visibleRelatedArticleIds.length > 0) {
          const { data: rows, count } = await createArticleQuery().in('id', visibleRelatedArticleIds);
          articles = (rows || []) as unknown as CategoryPageArticleRecord[];
          totalCount = count || visibleRelatedArticleIds.length;
        } else {
          articles = [];
        }
      } else {
        const { data: rows, count } = await createArticleQuery().eq('category_id', category.id);
        articles = ((rows || []) as unknown as CategoryPageArticleRecord[]).filter(
          (article) => !hiddenArticleIds.has(article.id)
        );
        totalCount = count || 0;
      }

      totalArticleCount = totalCount;
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
  const totalPages = Math.ceil(totalArticleCount / ARTICLES_PER_PAGE);
  const basePath = `/site/${tenantSlug}/categoria/${categorySlug}`;

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
          {totalArticleCount > 0 && (
            <p style={{ color: 'var(--e-color-textSecondary)', marginTop: '4px', fontSize: '14px' }}>
              {totalArticleCount} articol{totalArticleCount === 1 ? 'o' : 'i'}
              {totalPages > 1 && ` — Pagina ${currentPage} di ${totalPages}`}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '48px' }}>
            {currentPage > 1 && (
              <a
                href={currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--e-border-radius, 8px)',
                  border: '1px solid var(--e-color-border)',
                  textDecoration: 'none',
                  color: 'var(--e-color-text)',
                  fontSize: '14px',
                }}
              >
                &larr; Precedente
              </a>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <a
                  key={pageNum}
                  href={pageNum === 1 ? basePath : `${basePath}?page=${pageNum}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--e-border-radius, 8px)',
                    border: '1px solid var(--e-color-border)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: pageNum === currentPage ? 700 : 400,
                    color: pageNum === currentPage ? 'var(--e-color-bg)' : 'var(--e-color-text)',
                    background: pageNum === currentPage ? (category.color || 'var(--e-color-text)') : 'transparent',
                  }}
                >
                  {pageNum}
                </a>
              );
            })}
            {currentPage < totalPages && (
              <a
                href={`${basePath}?page=${currentPage + 1}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--e-border-radius, 8px)',
                  border: '1px solid var(--e-color-border)',
                  textDecoration: 'none',
                  color: 'var(--e-color-text)',
                  fontSize: '14px',
                }}
              >
                Successiva &rarr;
              </a>
            )}
          </nav>
        )}
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
    const supabase = await createServiceRoleClientForTenant(resolved.tenant.id);
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
