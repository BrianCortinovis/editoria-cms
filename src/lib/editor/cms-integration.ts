'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { enrichArticlesWithCategories, fetchArticleIdsForCategory } from '@/lib/articles/taxonomy';
import type { DataSource } from '@/lib/types/block';
import { getNavigationMenu, type SiteMenuItem, type SiteMenuKey } from '@/lib/site/navigation';
import { normalizeFooterConfig } from '@/lib/site/footer';
import { normalizeNewsletterConfig, type SiteNewsletterConfig } from '@/lib/site/newsletter';

export interface EditorCmsArticlePreview {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes?: number | null;
  categories?: Array<{ id?: string; name: string; slug: string; color: string | null }> | null;
}

export interface EditorCmsCategoryPreview {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface EditorCmsBannerPreview {
  id: string;
  name: string;
  position: string;
  type: string;
  image_url?: string | null;
  html_content?: string | null;
  link_url?: string | null;
}

export interface EditorCmsBreakingPreview {
  id: string;
  text: string;
  link_url?: string | null;
  priority?: number | null;
}

export interface EditorCmsEventPreview {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
}

export interface EditorCmsPagePreview {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at?: string | null;
}

export interface EditorCmsTagPreview {
  id: string;
  name: string;
  slug: string;
}

export interface EditorCmsFormFieldPreview {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label?: string; value?: string } | string>;
}

export interface EditorCmsFormPreview {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  success_message: string | null;
  fields: EditorCmsFormFieldPreview[];
  is_active: boolean;
}

export interface EditorCmsLayoutSlotPreview {
  slot_key: string;
  label: string;
  content_type: string;
  category?: { name: string; slug: string; color: string | null } | null;
  items: unknown[];
}

export interface EditorCmsDataset {
  tenantName?: string;
  articles: EditorCmsArticlePreview[];
  categories: EditorCmsCategoryPreview[];
  pages: EditorCmsPagePreview[];
  tags: EditorCmsTagPreview[];
  forms: EditorCmsFormPreview[];
  banners: EditorCmsBannerPreview[];
  breakingNews: EditorCmsBreakingPreview[];
  events: EditorCmsEventPreview[];
  layoutSlots: EditorCmsLayoutSlotPreview[];
}

export type EditorCmsNewsletterPreview = SiteNewsletterConfig;

async function queryForms(tenantId: string, dataSource?: DataSource) {
  const supabase = createClient();
  const params = (dataSource?.params || {}) as Record<string, string | undefined>;

  let query = supabase
    .from('site_forms')
    .select('id, name, slug, description, success_message, fields, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  if (params.slug) {
    query = query.eq('slug', params.slug);
  }

  if (params.limit) {
    query = query.limit(parseInt(params.limit, 10));
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }

  return (data || []).map((form) => ({
    id: String(form.id),
    name: String(form.name),
    slug: String(form.slug),
    description: form.description ? String(form.description) : null,
    success_message: form.success_message ? String(form.success_message) : null,
    fields: Array.isArray(form.fields) ? (form.fields as EditorCmsFormFieldPreview[]) : [],
    is_active: Boolean(form.is_active),
  })) as EditorCmsFormPreview[];
}

async function queryArticles(tenantId: string, limit = 12, dataSource?: DataSource) {
  const supabase = createClient();
  const params = (dataSource?.params || {}) as Record<string, string | undefined>;
  type ArticleRow = {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    cover_image_url: string | null;
    published_at: string | null;
    reading_time_minutes?: number | null;
    category_id?: string | null;
    categories?: { id?: string; name: string; slug: string; color: string | null } | null;
  };

  let query = supabase
    .from('articles')
    .select('id, title, slug, summary, cover_image_url, published_at, reading_time_minutes, is_featured, category_id, profiles!articles_author_id_fkey(full_name, avatar_url), categories(id, name, slug, color)')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (params.slug) {
    query = query.eq('slug', params.slug);
  }
  if (params.featured === 'true') {
    query = query.eq('is_featured', true);
  }

  const categorySlug = params.category || params.categorySlug;
  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', categorySlug)
      .single();

    if (category?.id) {
      const articleIds = await fetchArticleIdsForCategory(supabase as never, category.id);
      if (articleIds && articleIds.length > 0) {
        query = query.in('id', articleIds);
      } else {
        query = query.eq('category_id', category.id);
      }
    }
  }

  const { data } = await query;
  const enriched = await enrichArticlesWithCategories(
    supabase as never,
    tenantId,
    (data || []) as unknown as ArticleRow[]
  );

  return enriched.map((article) => ({
    ...article,
    categories: article.all_categories || (article.categories ? [article.categories] : []),
  })) as unknown as EditorCmsArticlePreview[];
}

export async function resolveEditorCmsDataSource(tenantId: string, dataSource?: DataSource) {
  if (!tenantId || !dataSource?.endpoint) {
    return [];
  }

  const supabase = createClient();
  const params = (dataSource.params || {}) as Record<string, string | undefined>;

  switch (dataSource.endpoint) {
    case 'articles':
      return queryArticles(tenantId, params.limit ? parseInt(params.limit, 10) : 9, dataSource);

    case 'categories': {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, color, sort_order')
        .eq('tenant_id', tenantId)
        .order('sort_order');
      return data || [];
    }

    case 'events': {
      let query = supabase
        .from('events')
        .select('id, title, starts_at, location')
        .eq('tenant_id', tenantId)
        .order('starts_at', { ascending: true });

      if (params.limit) {
        query = query.limit(parseInt(params.limit, 10));
      }

      const { data } = await query;
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
        .select('id, name, position, type, image_url, html_content, link_url')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (params.position) {
        query = query.eq('position', params.position);
      }

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

    case 'forms':
      return queryForms(tenantId, dataSource);

    case 'site-navigation': {
      const { data, error } = await supabase
        .from('site_config')
        .select('navigation')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        return [];
      }

      return getNavigationMenu(data?.navigation, (params.menu as SiteMenuKey | undefined) || 'primary') as SiteMenuItem[];
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

export async function loadEditorCmsDataset(tenantId: string) {
  const supabase = createClient();

  const [
    articles,
    categoriesRes,
    pagesRes,
    tagsRes,
    forms,
    bannersRes,
    breakingRes,
    eventsRes,
    templateRes,
  ] = await Promise.all([
    queryArticles(tenantId, 12),
    supabase
      .from('categories')
      .select('id, name, slug, color, sort_order')
      .eq('tenant_id', tenantId)
      .order('sort_order'),
    supabase
      .from('site_pages')
      .select('id, title, slug, is_published, updated_at')
      .eq('tenant_id', tenantId)
      .eq('is_published', true)
      .order('updated_at', { ascending: false }),
    supabase
      .from('tags')
      .select('id, name, slug')
      .eq('tenant_id', tenantId)
      .order('name'),
    queryForms(tenantId),
    supabase
      .from('banners')
      .select('id, name, position, type, image_url, html_content, link_url')
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase
      .from('breaking_news')
      .select('id, text, link_url, priority')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('priority', { ascending: false }),
    supabase
      .from('events')
      .select('id, title, starts_at, location')
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true })
      .limit(8),
    supabase
      .from('layout_templates')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('page_type', 'homepage')
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  let layoutSlots: EditorCmsLayoutSlotPreview[] = [];
  if (templateRes.data?.id) {
    const { data } = await supabase
      .from('layout_slots')
      .select('slot_key, label, content_type, category_id, categories(name, slug, color)')
      .eq('template_id', templateRes.data.id)
      .order('sort_index');

    layoutSlots = (data || []).map((slot: Record<string, unknown>) => ({
      slot_key: String(slot.slot_key || ''),
      label: String(slot.label || slot.slot_key || ''),
      content_type: String(slot.content_type || 'articles'),
      category: (slot.categories as EditorCmsLayoutSlotPreview['category']) || null,
      items: [],
    }));
  }

  return {
    articles,
    categories: categoriesRes.data || [],
    pages: pagesRes.data || [],
    tags: tagsRes.data || [],
    forms,
    banners: bannersRes.data || [],
    breakingNews: breakingRes.data || [],
    events: eventsRes.data || [],
    layoutSlots,
  } as EditorCmsDataset;
}

export function useEditorBlockPreviewData(tenantId?: string, dataSource?: DataSource) {
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const signature = useMemo(() => JSON.stringify(dataSource || null), [dataSource]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!tenantId || !dataSource?.endpoint) {
        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
      }

      try {
        const result = await resolveEditorCmsDataSource(tenantId, dataSource);
        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [tenantId, signature, dataSource]);

  return { data, loading };
}
