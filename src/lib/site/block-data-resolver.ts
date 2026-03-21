import { createServiceRoleClient } from '@/lib/supabase/server';
import type { DataSource } from '@/lib/types/block';

/**
 * Resolve data for a data-bound block at render time.
 * Fetches articles, events, breaking news, etc. from Supabase.
 */
export async function resolveBlockData(
  tenantId: string,
  dataSource: DataSource
): Promise<unknown[]> {
  const supabase = await createServiceRoleClient();
  const { endpoint, params = {} } = dataSource;

  switch (endpoint) {
    case 'articles': {
      let query = supabase
        .from('articles')
        .select('id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, is_featured, profiles!articles_author_id_fkey(full_name, avatar_url), categories(name, slug, color)')
        .eq('tenant_id', tenantId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const p = params as Record<string, string | undefined>;
      if (p.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('slug', p.category)
          .single();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (p.featured === 'true') query = query.eq('is_featured', true);
      if (p.limit) query = query.limit(parseInt(p.limit));

      const { data } = await query;
      return data || [];
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
        .select('id, name, image_url, html_content, link_url, type, position')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (p.position) query = query.eq('position', p.position);

      const { data } = await query;
      return data || [];
    }

    case 'tags': {
      const { data } = await supabase
        .from('tags')
        .select('id, name, slug')
        .eq('tenant_id', tenantId)
        .order('name');
      return data || [];
    }

    default:
      return [];
  }
}
