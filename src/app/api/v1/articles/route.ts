import { createServiceRoleClient } from '@/lib/supabase/server';
import { getTenantFromRequest } from '@/lib/cache/tenant-context';
import { getCacheHeadersWithSecurity } from '@/lib/cache/cache-headers';
import { enrichArticlesWithCategories } from '@/lib/articles/taxonomy';
import { readPublishedJson } from '@/lib/publish/storage';
import type { PublishedPostsDocument } from '@/lib/publish/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/articles
 * Optimized article listing with composite indexes
 * Cache: 60s at edge, SWR 300s
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404, headers: { 'Cache-Control': 'private, max-age=0' } }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const featured = url.searchParams.get('featured') === 'true';
    const categorySlug = url.searchParams.get('category') || '';

    // Published JSON fallback (skip if category filter is active — JSON doesn't support it well)
    if (!categorySlug) {
      const publishedPosts = await readPublishedJson<PublishedPostsDocument>(`sites/${encodeURIComponent(tenant.tenantSlug)}/posts.json`);
      if (publishedPosts?.articles) {
        const articles = featured
          ? publishedPosts.articles.filter((article) => article.is_featured === true)
          : publishedPosts.articles;

        return NextResponse.json(
          {
            articles: articles.slice(offset, offset + limit),
            total: articles.length,
          },
          {
            headers: getCacheHeadersWithSecurity('ARTICLES_LIST'),
          }
        );
      }
    }

    const supabase = await createServiceRoleClient();

    let query = supabase
      .from('articles')
      .select('*, author:profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color), article_tags(tags(name, slug))', {
        count: 'exact',
      })
      .eq('tenant_id', tenant.tenantId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (featured) {
      query = query.eq('is_featured', true);
    }

    if (categorySlug) {
      // Resolve category slug to ID, then filter
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('tenant_id', tenant.tenantId)
        .eq('slug', categorySlug)
        .single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }

    const { data: articles, error, count } = await query;

    if (error) {
      console.error('Articles query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500, headers: getCacheHeadersWithSecurity('ADMIN') }
      );
    }

    const enrichedArticles = await enrichArticlesWithCategories(
      supabase as never,
      tenant.tenantId,
      (articles || []) as unknown as Array<{ id: string; category_id?: string | null; categories?: { id?: string; name: string; slug: string; color: string | null } | null }>
    );

    return NextResponse.json(
      { articles: enrichedArticles, total: count || 0 },
      {
        headers: getCacheHeadersWithSecurity('ARTICLES_LIST'),
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCacheHeadersWithSecurity('ADMIN') }
    );
  }
}
