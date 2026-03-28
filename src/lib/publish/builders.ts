import { createServiceRoleClient, createServiceRoleClientForTenant } from '@/lib/supabase/server';
import { enrichArticlesWithCategories, fetchArticleIdsForCategory } from '@/lib/articles/taxonomy';
import { resolveBlockData } from '@/lib/site/block-data-resolver';
import { getActiveExclusivePlacementArticleIds, isPlacementActive } from '@/lib/editorial/placements';
import { normalizeFooterConfig } from '@/lib/site/footer';
import { normalizeNavigationConfig } from '@/lib/site/navigation';
import type { Block } from '@/lib/types/block';
import type {
  PublishedArticleDocument,
  PublishedArticleSummary,
  PublishedBannersDocument,
  PublishedBannerZonesDocument,
  PublishedBreakingNewsDocument,
  PublishedCategoryDocument,
  PublishedEventsDocument,
  PublishedLayoutDocument,
  PublishedManifest,
  PublishedMediaItem,
  PublishedMediaManifestDocument,
  PublishedMenuDocument,
  PublishedModuleEntry,
  PublishedModulesDocument,
  PublishedPageDocument,
  PublishedPostsDocument,
  PublishedSearchDocument,
  PublishedSettingsDocument,
  PublishedTagsDocument,
} from '@/lib/publish/types';
import { buildPublishedPath } from '@/lib/publish/storage';

interface PublishSiteContext {
  siteId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantDomain: string | null;
  tenantLogoUrl: string | null;
}

interface ArticleRow {
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
  is_featured: boolean;
  is_breaking: boolean;
  is_premium: boolean;
  profiles?: { full_name: string; avatar_url: string | null; bio?: string | null } | null;
  categories?: { id?: string; name: string; slug: string; color: string | null; description?: string | null } | null;
}

interface LayoutSlotRow {
  id: string;
  slot_key: string;
  label: string;
  content_type: string;
  category_id: string | null;
  max_items: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  style_hint: string | null;
  assignment_mode: string | null;
  placement_duration_hours: number | null;
  categories: { name: string; slug: string; color: string | null } | null;
}

interface PinnedArticleRow {
  expires_at: string | null;
  articles: {
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    summary: string | null;
    cover_image_url: string | null;
    is_featured: boolean;
    is_premium: boolean;
    reading_time_minutes: number;
    published_at: string | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
    categories: { name: string; slug: string; color: string | null } | null;
  } | null;
}

type SlotArticle = NonNullable<PinnedArticleRow['articles']>;

export async function resolvePublishSiteContext(tenantId: string): Promise<PublishSiteContext | null> {
  // Use tenant-aware client: shared DB for shared tenants, dedicated DB for enterprise
  const supabase = await createServiceRoleClientForTenant(tenantId);
  const { data } = await supabase
    .from('sites')
    .select('id, tenant_id, slug, name, deleted_at, tenants!inner(id, slug, name, domain, logo_url)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const tenantRecord = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;

  return {
    siteId: data.id,
    tenantId: data.tenant_id,
    tenantSlug: tenantRecord?.slug || data.slug,
    tenantName: tenantRecord?.name || data.name,
    tenantDomain: tenantRecord?.domain || null,
    tenantLogoUrl: tenantRecord?.logo_url || null,
  };
}

async function buildResolvedDataMap(tenantId: string, blocks: Block[]) {
  const map: Record<string, unknown[]> = {};

  async function visit(entries: Block[]) {
    for (const block of entries) {
      if (block.dataSource && block.id) {
        map[block.id] = await resolveBlockData(tenantId, block.dataSource);
      }
      if (Array.isArray(block.children) && block.children.length > 0) {
        await visit(block.children);
      }
    }
  }

  await visit(blocks);
  return map;
}

function normalizeArticleSummary(article: ArticleRow & { all_categories?: Array<{ id?: string; name: string; slug: string; color?: string | null; description?: string | null }> }): PublishedArticleSummary {
  return {
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    summary: article.summary,
    cover_image_url: article.cover_image_url,
    published_at: article.published_at,
    reading_time_minutes: article.reading_time_minutes,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    og_image_url: article.og_image_url,
    is_featured: article.is_featured,
    is_breaking: article.is_breaking,
    is_premium: article.is_premium,
    profiles: article.profiles || null,
    categories: article.categories || null,
    all_categories: article.all_categories || [],
  };
}

function normalizePageSlug(slug: string, pageType: string) {
  if (pageType === 'homepage' || slug === '/' || slug === 'homepage') {
    return 'homepage';
  }
  return String(slug || '').replace(/^\/+|\/+$/g, '') || 'page';
}

function looksLikeAssetUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('/storage/') ||
    normalized.startsWith('/published/') ||
    normalized.startsWith('/media/') ||
    /\.(png|jpe?g|gif|webp|svg|mp4|webm|mp3|wav|pdf)$/i.test(normalized)
  );
}

function collectAssetRefs(input: unknown, refs = new Set<string>()) {
  if (typeof input === 'string') {
    if (looksLikeAssetUrl(input)) {
      refs.add(input.trim());
    }
    return refs;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      collectAssetRefs(item, refs);
    }
    return refs;
  }

  if (input && typeof input === 'object') {
    for (const value of Object.values(input as Record<string, unknown>)) {
      collectAssetRefs(value, refs);
    }
  }

  return refs;
}

function collectModuleEntries(input: {
  pageId: string;
  pageSlug: string;
  pageType: string;
  updatedAt: string;
  blocks: Block[];
  resolvedDataMap: Record<string, unknown[]>;
}) {
  const modules: PublishedModuleEntry[] = [];

  function visit(blocks: Block[]) {
    for (const block of blocks) {
      const resolvedData = input.resolvedDataMap[block.id] || [];
      const assetRefs = Array.from(
        collectAssetRefs({
          props: block.props,
          styleBackground: block.style?.background?.value,
        }),
      );

      modules.push({
        key: `${input.pageSlug}:${block.id}`,
        pageId: input.pageId,
        pageSlug: input.pageSlug,
        pageType: input.pageType,
        blockId: block.id,
        blockType: block.type,
        label: block.label,
        props: (block.props || {}) as Record<string, unknown>,
        dataSource: block.dataSource ? (block.dataSource as Record<string, unknown>) : null,
        resolvedData,
        assetRefs,
        childIds: Array.isArray(block.children) ? block.children.map((child) => child.id) : [],
        updatedAt: input.updatedAt,
      });

      if (Array.isArray(block.children) && block.children.length > 0) {
        visit(block.children);
      }
    }
  }

  visit(input.blocks);
  return modules;
}

export async function buildPublishedSettingsDocument(context: PublishSiteContext): Promise<PublishedSettingsDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const [{ data: tenant }, { data: config }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, slug, domain, logo_url, settings')
      .eq('id', context.tenantId)
      .single(),
    supabase
      .from('site_config')
      .select('theme, navigation, footer, favicon_url, og_defaults, global_css')
      .eq('tenant_id', context.tenantId)
      .maybeSingle(),
  ]);

  return {
    type: 'settings',
    generatedAt: new Date().toISOString(),
    siteId: context.siteId,
    tenantId: context.tenantId,
    tenant: {
      id: tenant?.id || context.tenantId,
      name: tenant?.name || context.tenantName,
      slug: tenant?.slug || context.tenantSlug,
      domain: tenant?.domain || context.tenantDomain,
      logo_url: tenant?.logo_url || context.tenantLogoUrl,
    },
    config: config
      ? {
          theme: (config.theme || {}) as Record<string, unknown>,
          navigation: (config.navigation || []) as Record<string, unknown>,
          footer: (config.footer || {}) as Record<string, unknown>,
          favicon_url: config.favicon_url || null,
          og_defaults: (config.og_defaults || {}) as Record<string, unknown>,
          global_css: config.global_css || null,
        }
      : null,
    tenantSettings: (tenant?.settings || {}) as Record<string, unknown>,
  };
}

export async function buildPublishedMenuDocument(context: PublishSiteContext): Promise<PublishedMenuDocument> {
  const settings = await buildPublishedSettingsDocument(context);
  const navigation = normalizeNavigationConfig(settings.config?.navigation || []);
  const footer = normalizeFooterConfig(settings.config?.footer || {});

  return {
    type: 'menu',
    generatedAt: settings.generatedAt,
    tenantId: context.tenantId,
    tenantSlug: context.tenantSlug,
    navigation,
    footer,
  };
}

export async function buildPublishedPageDocument(context: PublishSiteContext, pageId: string): Promise<PublishedPageDocument | null> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data: page } = await supabase
    .from('site_pages')
    .select('id, title, slug, page_type, meta, blocks, custom_css, updated_at, is_published')
    .eq('tenant_id', context.tenantId)
    .eq('id', pageId)
    .maybeSingle();

  if (!page || !page.is_published) {
    return null;
  }

  const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
  const resolvedDataMap = await buildResolvedDataMap(context.tenantId, blocks);

  return {
    type: 'page',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      pageType: page.page_type,
      meta: (page.meta || {}) as Record<string, unknown>,
      blocks,
      customCss: page.custom_css,
      updatedAt: page.updated_at,
    },
    resolvedDataMap,
  };
}

export async function buildPublishedArticleDocument(context: PublishSiteContext, articleId: string): Promise<PublishedArticleDocument | null> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('articles')
    .select('id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, category_id, is_featured, is_breaking, is_premium, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories:categories!articles_category_id_fkey(id, name, slug, color, description)')
    .eq('tenant_id', context.tenantId)
    .eq('id', articleId)
    .eq('status', 'published')
    .maybeSingle();

  if (!data) {
    return null;
  }

  const [article] = await enrichArticlesWithCategories(
    supabase as never,
    context.tenantId,
    [data as unknown as ArticleRow]
  );

  return {
    type: 'article',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    article: {
      ...normalizeArticleSummary(article as ArticleRow & { all_categories?: PublishedArticleSummary['all_categories'] }),
      body: data.body,
      is_featured: data.is_featured,
      is_breaking: data.is_breaking,
      is_premium: data.is_premium,
    },
  };
}

export async function buildPublishedCategoryDocument(context: PublishSiteContext, categoryId: string): Promise<PublishedCategoryDocument | null> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, description, color, created_at')
    .eq('tenant_id', context.tenantId)
    .eq('id', categoryId)
    .maybeSingle();

  if (!category) {
    return null;
  }

  const relatedArticleIds = await fetchArticleIdsForCategory(supabase as never, category.id);
  let query = supabase
    .from('articles')
    .select('id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, category_id, is_featured, is_breaking, is_premium, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories:categories!articles_category_id_fkey(id, name, slug, color, description)')
    .eq('tenant_id', context.tenantId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30);

  if (relatedArticleIds && relatedArticleIds.length > 0) {
    query = query.in('id', relatedArticleIds);
  } else {
    query = query.eq('category_id', category.id);
  }

  const { data: rows } = await query;
  const enriched = await enrichArticlesWithCategories(
    supabase as never,
    context.tenantId,
    (rows || []) as unknown as ArticleRow[]
  );

  return {
    type: 'category',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      updatedAt: category.created_at,
    },
    articles: enriched.map((article) => normalizeArticleSummary(article as ArticleRow & { all_categories?: PublishedArticleSummary['all_categories'] })),
  };
}

export async function buildPublishedPostsDocument(context: PublishSiteContext): Promise<PublishedPostsDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('articles')
    .select('id, title, subtitle, slug, summary, body, cover_image_url, published_at, reading_time_minutes, meta_title, meta_description, og_image_url, category_id, is_featured, is_breaking, is_premium, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories:categories!articles_category_id_fkey(id, name, slug, color, description)')
    .eq('tenant_id', context.tenantId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100);

  const enriched = await enrichArticlesWithCategories(
    supabase as never,
    context.tenantId,
    (data || []) as unknown as ArticleRow[]
  );

  return {
    type: 'posts',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    articles: enriched.map((article) => normalizeArticleSummary(article as ArticleRow & { all_categories?: PublishedArticleSummary['all_categories'] })),
    total: enriched.length,
  };
}

function excerpt(value?: string | null, maxLength = 180) {
  const clean = String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

export async function buildPublishedSearchDocument(context: PublishSiteContext): Promise<PublishedSearchDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const [posts, pages] = await Promise.all([
    buildPublishedPostsDocument(context),
    supabase
      .from('site_pages')
      .select('id, title, slug, page_type, meta, updated_at')
      .eq('tenant_id', context.tenantId)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(40),
  ]);

  const entries = [
    ...posts.articles.map((article) => ({
      id: article.id,
      type: 'article' as const,
      title: article.title,
      slug: article.slug,
      excerpt: excerpt(article.summary),
      urlPath: `/articolo/${article.slug}`,
      imageUrl: article.cover_image_url,
      publishedAt: article.published_at,
      readingTimeMinutes: article.reading_time_minutes,
    })),
    ...((pages.data || []).map((page) => {
      const meta = (page.meta || {}) as Record<string, unknown>;
      const pagePath = page.page_type === 'homepage' || page.slug === '/' || page.slug === 'homepage'
        ? '/'
        : `/${String(page.slug || '').replace(/^\/+/, '')}`;

      return {
        id: page.id,
        type: 'page' as const,
        title: page.title,
        slug: page.slug,
        excerpt: excerpt(String(meta.description || meta.title || page.title)),
        urlPath: pagePath,
        updatedAt: page.updated_at || null,
      };
    })),
  ];

  return {
    type: 'search',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    entries,
  };
}

export async function buildPublishedTagsDocument(context: PublishSiteContext): Promise<PublishedTagsDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('tenant_id', context.tenantId)
    .order('name');

  return {
    type: 'tags',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    tags: (data || []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
  };
}

export async function buildPublishedEventsDocument(context: PublishSiteContext): Promise<PublishedEventsDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', context.tenantId)
    .order('starts_at', { ascending: true })
    .limit(100);

  return {
    type: 'events',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    events: (data || []) as Array<Record<string, unknown>>,
  };
}

export async function buildPublishedBreakingNewsDocument(context: PublishSiteContext): Promise<PublishedBreakingNewsDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('breaking_news')
    .select('*')
    .eq('tenant_id', context.tenantId)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    type: 'breaking-news',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    items: (data || []) as Array<Record<string, unknown>>,
  };
}

export async function buildPublishedBannersDocument(context: PublishSiteContext): Promise<PublishedBannersDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('banners')
    .select('id, name, position, type, image_url, html_content, link_url, target_device, weight, starts_at, ends_at, advertiser_id, target_categories, is_active')
    .eq('tenant_id', context.tenantId)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  return {
    type: 'banners',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    banners: (data || []) as Array<Record<string, unknown>>,
  };
}

export async function buildPublishedBannerZonesDocument(context: PublishSiteContext): Promise<PublishedBannerZonesDocument> {
  const banners = await buildPublishedBannersDocument(context);
  const grouped = new Map<string, Array<Record<string, unknown>>>();

  for (const banner of banners.banners) {
    const position = String(banner.position || 'default');
    const targetDevice = String(banner.target_device || 'all');
    const zoneKey = `${position}:${targetDevice}`;
    const items = grouped.get(zoneKey) || [];
    items.push(banner);
    grouped.set(zoneKey, items);
  }

  return {
    type: 'banner-zones',
    generatedAt: banners.generatedAt,
    tenantId: context.tenantId,
    siteId: context.siteId,
    zones: Array.from(grouped.entries()).map(([zoneKey, items]) => ({
      zoneKey,
      position: zoneKey.split(':')[0] || 'default',
      targetDevice: zoneKey.split(':')[1] || 'all',
      selectionMode: 'weighted_rotation',
      items: [...items].sort((left, right) => Number(right.weight || 0) - Number(left.weight || 0)),
    })),
  };
}

export async function buildPublishedMediaManifestDocument(context: PublishSiteContext): Promise<PublishedMediaManifestDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data } = await supabase
    .from('media')
    .select('id, filename, original_filename, mime_type, size_bytes, width, height, url, thumbnail_url, alt_text, folder, created_at')
    .eq('tenant_id', context.tenantId)
    .order('created_at', { ascending: false });

  const items = Object.fromEntries(
    (data || []).map((item) => [
      item.id,
      {
        id: item.id,
        filename: item.filename,
        originalFilename: item.original_filename,
        mimeType: item.mime_type,
        sizeBytes: item.size_bytes,
        width: item.width,
        height: item.height,
        url: item.url,
        thumbnailUrl: item.thumbnail_url,
        altText: item.alt_text,
        folder: item.folder,
        createdAt: item.created_at,
      } satisfies PublishedMediaItem,
    ]),
  );

  const byFilename = Object.fromEntries(
    (Object.values(items) as PublishedMediaItem[]).map((item) => [item.filename, item.id]),
  );

  return {
    type: 'media-manifest',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    items,
    byFilename,
  };
}

export async function buildPublishedModulesDocument(context: PublishSiteContext): Promise<PublishedModulesDocument> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data: pages } = await supabase
    .from('site_pages')
    .select('id, slug, page_type, blocks, updated_at')
    .eq('tenant_id', context.tenantId)
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  const modules = (
    await Promise.all(
      (pages || []).map(async (page) => {
        const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];
        const resolvedDataMap = await buildResolvedDataMap(context.tenantId, blocks);
        return collectModuleEntries({
          pageId: page.id,
          pageSlug: normalizePageSlug(page.slug, page.page_type),
          pageType: page.page_type,
          updatedAt: page.updated_at,
          blocks,
          resolvedDataMap,
        });
      }),
    )
  ).flat();

  return {
    type: 'modules',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    modules,
  };
}

export async function buildPublishedLayoutDocument(
  context: PublishSiteContext,
  pageType: string
): Promise<PublishedLayoutDocument | null> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const { data: siteConfig } = await supabase
    .from('site_config')
    .select('theme')
    .eq('tenant_id', context.tenantId)
    .maybeSingle();

  const editorialAutomation = ((siteConfig?.theme as Record<string, unknown> | null)?.editorialAutomation || {}) as Record<string, unknown>;
  const homepageFreshHours = typeof editorialAutomation.homepageFreshHours === 'number'
    ? editorialAutomation.homepageFreshHours
    : 0;
  const homepageFreshThreshold = homepageFreshHours > 0
    ? new Date(Date.now() - homepageFreshHours * 60 * 60 * 1000).toISOString()
    : null;

  const { data: template } = await supabase
    .from('layout_templates')
    .select('id, name, page_type, screenshot_url')
    .eq('tenant_id', context.tenantId)
    .eq('page_type', pageType)
    .eq('is_active', true)
    .maybeSingle();

  if (!template) {
    return null;
  }

  let slotsResponse: {
    data: Array<Record<string, unknown>> | null;
    error: { code?: string | null } | null;
  } = await supabase
    .from('layout_slots')
    .select('id, slot_key, label, content_type, category_id, max_items, sort_by, sort_order, style_hint, assignment_mode, placement_duration_hours, categories(name, slug, color)')
    .eq('template_id', template.id)
    .order('sort_index');

  if (slotsResponse.error?.code === '42703') {
    slotsResponse = await supabase
      .from('layout_slots')
      .select('id, slot_key, label, content_type, category_id, max_items, sort_by, sort_order, style_hint, assignment_mode, categories(name, slug, color)')
      .eq('template_id', template.id)
      .order('sort_index');
  }

  const slots = (slotsResponse.data || []) as unknown as LayoutSlotRow[];
  const exclusivePlacementArticleIds = new Set(
    await getActiveExclusivePlacementArticleIds(supabase as never, context.tenantId)
  );

  const slotsWithContent = await Promise.all(
    slots.map(async (slot) => {
      let content: Array<Record<string, unknown>> = [];

      if (slot.content_type === 'articles') {
        const mode = slot.assignment_mode ?? 'auto';
        let pinned: SlotArticle[] = [];

        if (mode === 'manual' || mode === 'mixed') {
          let pinnedResponse: {
            data: Array<Record<string, unknown>> | null;
            error: { code?: string | null } | null;
          } = await supabase
            .from('slot_assignments')
            .select(
              'expires_at, articles(id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color))'
            )
            .eq('slot_id', slot.id)
            .order('pin_order');

          if (pinnedResponse.error?.code === '42703') {
            pinnedResponse = await supabase
              .from('slot_assignments')
              .select(
                'articles(id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color))'
              )
              .eq('slot_id', slot.id)
              .order('pin_order');
          }

          pinned = ((pinnedResponse.data as PinnedArticleRow[] | null) || [])
            .filter((row) => isPlacementActive(row.expires_at))
            .map((row) => row.articles)
            .filter(Boolean) as SlotArticle[];
        }

        if (mode === 'manual') {
          content = pinned.slice(0, slot.max_items) as Array<Record<string, unknown>>;
        } else {
          const remaining = slot.max_items - pinned.length;
          let auto: SlotArticle[] = [];

          if (remaining > 0 || mode === 'auto') {
            const pinnedIds = pinned.map((article) => article.id);
            let query = supabase
              .from('articles')
              .select(
                'id, title, subtitle, slug, summary, cover_image_url, is_featured, is_premium, reading_time_minutes, published_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories:categories!articles_category_id_fkey(id, name, slug, color)'
              )
              .eq('tenant_id', context.tenantId)
              .eq('status', 'published')
              .order(slot.sort_by, { ascending: slot.sort_order === 'asc' })
              .limit(mode === 'auto' ? slot.max_items : remaining);

            if (pageType === 'homepage' && homepageFreshThreshold) {
              query = query.gte('published_at', homepageFreshThreshold);
            }

            if (slot.category_id) {
              const matchingArticleIds = await fetchArticleIdsForCategory(supabase as never, slot.category_id);
              if (matchingArticleIds && matchingArticleIds.length > 0) {
                query = query.in('id', matchingArticleIds);
              } else {
                query = query.eq('category_id', slot.category_id);
              }
            }

            if (pinnedIds.length > 0) {
              const safeIds = pinnedIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
              if (safeIds.length > 0) {
                query = query.not('id', 'in', `(${safeIds.join(',')})`);
              }
            }

            const { data } = await query;
            auto = ((data || []) as unknown as SlotArticle[]).filter(
              (article) => !exclusivePlacementArticleIds.has(article.id)
            );
          }

          content = [...pinned, ...auto] as Array<Record<string, unknown>>;
        }
      } else if (slot.content_type === 'events') {
        const events = await buildPublishedEventsDocument(context);
        content = events.events.slice(0, slot.max_items);
      } else if (slot.content_type === 'breaking_news') {
        const breakingNews = await buildPublishedBreakingNewsDocument(context);
        content = breakingNews.items.slice(0, slot.max_items);
      }

      return {
        slot_key: slot.slot_key,
        label: slot.label,
        content_type: slot.content_type,
        category: slot.categories,
        style_hint: slot.style_hint,
        items: content,
      };
    })
  );

  return {
    type: 'layout',
    generatedAt: new Date().toISOString(),
    tenantId: context.tenantId,
    siteId: context.siteId,
    pageType,
    template: {
      id: template.id,
      name: template.name,
      pageType: template.page_type,
      screenshotUrl: template.screenshot_url,
    },
    slots: slotsWithContent,
  };
}

export async function buildPublishedManifest(context: PublishSiteContext, releaseId: string): Promise<PublishedManifest> {
  const supabase = await createServiceRoleClientForTenant(context.tenantId);
  const [{ data: pages }, { data: articles }, { data: categories }, { data: layouts }] = await Promise.all([
    supabase
      .from('site_pages')
      .select('slug, page_type')
      .eq('tenant_id', context.tenantId)
      .eq('is_published', true),
    supabase
      .from('articles')
      .select('slug')
      .eq('tenant_id', context.tenantId)
      .eq('status', 'published'),
    supabase
      .from('categories')
      .select('slug')
      .eq('tenant_id', context.tenantId),
    supabase
      .from('layout_templates')
      .select('page_type')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
  ]);

  const pageMap: Record<string, string> = {};
  let homepagePath: string | null = null;

  for (const page of pages || []) {
    if (page.page_type === 'homepage' || page.slug === 'homepage' || page.slug === '/') {
      homepagePath = buildPublishedPath(context.tenantSlug, 'homepage');
      continue;
    }
    pageMap[page.slug] = buildPublishedPath(context.tenantSlug, 'page', page.slug);
  }

  const articleMap = Object.fromEntries(
    (articles || []).map((article) => [article.slug, buildPublishedPath(context.tenantSlug, 'article', article.slug)])
  );
  const categoryMap = Object.fromEntries(
    (categories || []).map((category) => [category.slug, buildPublishedPath(context.tenantSlug, 'category', category.slug)])
  );
  const layoutMap = Object.fromEntries(
    (layouts || []).map((layout) => [layout.page_type, buildPublishedPath(context.tenantSlug, 'layout', layout.page_type)])
  );

  return {
    siteId: context.siteId,
    tenantId: context.tenantId,
    tenantSlug: context.tenantSlug,
    releaseId,
    generatedAt: new Date().toISOString(),
    documents: {
      settings: buildPublishedPath(context.tenantSlug, 'settings'),
      menu: buildPublishedPath(context.tenantSlug, 'menu'),
      homepage: homepagePath,
      posts: buildPublishedPath(context.tenantSlug, 'posts'),
      search: buildPublishedPath(context.tenantSlug, 'search'),
      tags: buildPublishedPath(context.tenantSlug, 'tags'),
      events: buildPublishedPath(context.tenantSlug, 'events'),
      breakingNews: buildPublishedPath(context.tenantSlug, 'breaking-news'),
      banners: buildPublishedPath(context.tenantSlug, 'banners'),
      bannerZones: buildPublishedPath(context.tenantSlug, 'banner-zones'),
      mediaManifest: buildPublishedPath(context.tenantSlug, 'media-manifest'),
      modules: buildPublishedPath(context.tenantSlug, 'modules'),
      layouts: layoutMap,
    },
    pages: pageMap,
    articles: articleMap,
    categories: categoryMap,
  };
}
