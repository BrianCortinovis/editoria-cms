import { createServiceRoleClientForTenant } from '@/lib/supabase/server';
import { enrichArticlesWithCategories, fetchArticleIdsForCategory } from '@/lib/articles/taxonomy';
import type { DataSource } from '@/lib/types/block';
import { getNavigationMenu, type SiteMenuKey } from '@/lib/site/navigation';
import { normalizeFooterConfig } from '@/lib/site/footer';
import { normalizeNewsletterConfig } from '@/lib/site/newsletter';

/**
 * Resolve data for a data-bound block at render time.
 * Fetches articles, events, breaking news, etc. from Supabase.
 */
export async function resolveBlockData(
  tenantId: string,
  dataSource: DataSource
): Promise<unknown[]> {
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const { endpoint, params = {} } = dataSource;
  const p = params as Record<string, string | undefined>;

  switch (endpoint) {
    case 'articles': {
      const limit = p.limit ? parseInt(p.limit, 10) : undefined;
      const offset = p.offset ? parseInt(p.offset, 10) : 0;
      const safeLimit = limit !== undefined ? limit : 20;
      const articleSelect =
        'id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, is_featured, category_id, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color)';
      const manualIds = (p.ids || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const sourceMode = p.sourceMode || (p.slotId ? 'placement' : manualIds.length > 0 ? 'manual' : 'automatic');
      const autoSource = p.autoSource || (p.tag ? 'tag' : (p.category || p.categorySlug) ? 'category' : p.featured === 'true' ? 'featured' : 'latest');

      const enrichAndOrder = async (
        rows: Array<{ id: string; category_id?: string | null; categories?: { name: string; slug: string; color: string | null } | null }>,
        orderedIds?: string[]
      ) => {
        const enriched = await enrichArticlesWithCategories(
          supabase as never,
          tenantId,
          rows
        );

        if (!orderedIds || orderedIds.length === 0) {
          return enriched;
        }

        const position = new Map(orderedIds.map((id, index) => [id, index]));
        return [...enriched].sort((left, right) => (position.get(left.id) ?? 9999) - (position.get(right.id) ?? 9999));
      };

      const loadArticlesByIds = async (ids: string[]) => {
        if (ids.length === 0) {
          return [];
        }

        const { data } = await supabase
          .from('articles')
          .select(articleSelect)
          .eq('tenant_id', tenantId)
          .eq('status', 'published')
          .in('id', ids);

        return enrichAndOrder(
          (data || []) as unknown as Array<{ id: string; category_id?: string | null; categories?: { name: string; slug: string; color: string | null } | null }>,
          ids
        );
      };

      const resolveTagArticleIds = async (tagSlug?: string) => {
        if (!tagSlug) return null;

        const { data: tag } = await supabase
          .from('tags')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('slug', tagSlug)
          .maybeSingle();

        if (!tag?.id) {
          return [];
        }

        const { data: articleTags } = await supabase
          .from('article_tags')
          .select('article_id')
          .eq('tag_id', tag.id);

        return [...new Set((articleTags || []).map((row) => String(row.article_id)))];
      };

      const createBaseArticleQuery = () =>
        supabase
          .from('articles')
          .select(articleSelect)
          .eq('tenant_id', tenantId)
          .eq('status', 'published');

      const applyAutomaticFilters = async (requestedLimit: number) => {
        let nextQuery = createBaseArticleQuery().order('published_at', { ascending: false }).range(0, Math.max(requestedLimit - 1, 0));

        if (p.slug) {
          nextQuery = nextQuery.eq('slug', p.slug);
        }

        if (autoSource === 'featured' || p.featured === 'true') {
          nextQuery = nextQuery.eq('is_featured', true);
        }

        const categorySlug = p.category || p.categorySlug;
        if (autoSource === 'category' && categorySlug) {
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('slug', categorySlug)
            .maybeSingle();

          if (!cat?.id) {
            return [];
          }

          const matchedIds = await fetchArticleIdsForCategory(supabase as never, cat.id);
          if (matchedIds && matchedIds.length > 0) {
            nextQuery = nextQuery.in('id', matchedIds);
          } else {
            nextQuery = nextQuery.eq('category_id', cat.id);
          }
        }

        if (autoSource === 'tag') {
          const matchedTagIds = await resolveTagArticleIds(p.tag);
          if (!matchedTagIds || matchedTagIds.length === 0) {
            return [];
          }
          nextQuery = nextQuery.in('id', matchedTagIds);
        }

        const { data } = await nextQuery;
        return enrichAndOrder(
          (data || []) as unknown as Array<{ id: string; category_id?: string | null; categories?: { name: string; slug: string; color: string | null } | null }>
        );
      };

      if (p.slotId) {
        const { data: assignments } = await supabase
          .from('slot_assignments')
          .select('article_id, pin_order, expires_at, assigned_at')
          .eq('tenant_id', tenantId)
          .eq('slot_id', p.slotId)
          .order('pin_order', { ascending: true })
          .order('assigned_at', { ascending: false });

        const activeIds = (assignments || [])
          .filter((assignment) => {
            if (!assignment.expires_at) return true;
            const expiresAt = new Date(assignment.expires_at).getTime();
            return !Number.isNaN(expiresAt) && expiresAt > Date.now();
          })
          .map((assignment) => String(assignment.article_id))
          .slice(offset, offset + safeLimit);

        return loadArticlesByIds(activeIds);
      }

      if (sourceMode === 'manual' && manualIds.length > 0) {
        return loadArticlesByIds(manualIds.slice(offset, offset + safeLimit));
      }

      if (sourceMode === 'manual' && p.slug) {
        const { data } = await supabase
          .from('articles')
          .select(articleSelect)
          .eq('tenant_id', tenantId)
          .eq('status', 'published')
          .eq('slug', p.slug)
          .limit(1);

        return enrichAndOrder(
          (data || []) as unknown as Array<{ id: string; category_id?: string | null; categories?: { name: string; slug: string; color: string | null } | null }>
        );
      }

      if (sourceMode === 'mixed') {
        const manualArticles = await loadArticlesByIds(manualIds);
        const remaining = Math.max(safeLimit - manualArticles.length, 0);
        if (remaining === 0) {
          return manualArticles.slice(0, safeLimit);
        }

        const automaticArticles = await applyAutomaticFilters(remaining + manualIds.length + 6);
        const filteredAutomatic = automaticArticles.filter((article) => !manualIds.includes(article.id)).slice(0, remaining);
        return [...manualArticles, ...filteredAutomatic].slice(0, safeLimit);
      }

      return applyAutomaticFilters(safeLimit);
    }

    case 'categories': {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, color, sort_order')
        .eq('tenant_id', tenantId)
        .order('sort_order');
      return data || [];
    }

    case 'events': {
      const limit = p.limit ? parseInt(p.limit) : 10;
      const { data } = await supabase
        .from('events')
        .select('id, title, description, location, image_url, starts_at, ends_at, price')
        .eq('tenant_id', tenantId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(limit);
      return data || [];
    }

    case 'breaking-news': {
      const { data } = await supabase
        .from('breaking_news')
        .select('id, text, link_url, priority')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('priority', { ascending: false });
      return data || [];
    }

    case 'banners': {
      let query = supabase
        .from('banners')
        .select('id, name, image_url, html_content, link_url, type, position, advertiser_id, target_categories')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (p.bannerId) query = query.eq('id', p.bannerId);
      if (p.position) query = query.eq('position', p.position);
      if (p.advertiserId) query = query.eq('advertiser_id', p.advertiserId);

      const { data } = await query;
      let banners = data || [];

      if (p.targetCategory) {
        const acceptedValues = new Set<string>([p.targetCategory]);
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('slug', p.targetCategory)
          .maybeSingle();
        if (category?.id) {
          acceptedValues.add(category.id);
        }

        banners = banners.filter((banner) =>
          Array.isArray(banner.target_categories) &&
          banner.target_categories.some((entry) => acceptedValues.has(String(entry)))
        );
      }

      return banners;
    }

    case 'tags': {
      const { data } = await supabase
        .from('tags')
        .select('id, name, slug')
        .eq('tenant_id', tenantId)
        .order('name');
      return data || [];
    }

    case 'forms': {
      let query = supabase
        .from('site_forms')
        .select('id, name, slug, description, success_message, fields, is_active')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (p.slug) {
        query = query.eq('slug', p.slug);
      }

      if (p.limit) {
        query = query.limit(parseInt(p.limit, 10));
      }

      const { data, error } = await query;
      if (error) {
        return [];
      }

      return data || [];
    }

    case 'site-navigation': {
      const { data, error } = await supabase
        .from('site_config')
        .select('navigation')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        return [];
      }

      return getNavigationMenu(data?.navigation, (p.menu as SiteMenuKey | undefined) || 'primary');
    }

    case 'site-footer': {
      const { data, error } = await supabase
        .from('site_config')
        .select('footer')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        return [];
      }

      return [normalizeFooterConfig(data?.footer)];
    }

    case 'site-newsletter': {
      const { data, error } = await supabase
        .from('site_config')
        .select('footer')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        return [];
      }

      return [normalizeNewsletterConfig(data?.footer)];
    }

    default:
      return [];
  }
}
