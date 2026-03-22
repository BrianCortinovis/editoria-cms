import { createServiceRoleClient } from '@/lib/supabase/server';
import { callProvider } from '@/lib/ai/providers';
import { resolveProvider } from '@/lib/ai/resolver';
import { getModuleConfig, isModuleActive } from '@/lib/modules';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

type SearchMode = 'simple' | 'semantic';
type SearchResultType = 'article' | 'page';

interface SearchTenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  settings?: Record<string, unknown> | null;
}

interface SearchArticleRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
}

interface SearchPageRow {
  id: string;
  title: string;
  slug: string;
  page_type: string | null;
  meta: Record<string, unknown> | null;
  updated_at: string | null;
}

export interface SiteSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  slug: string;
  excerpt: string;
  url: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTimeMinutes?: number | null;
}

export interface SearchSiteContentResponse {
  tenant: Pick<SearchTenant, 'id' | 'slug' | 'name' | 'domain'>;
  results: SiteSearchResult[];
  mode: SearchMode | 'fallback';
  provider?: string;
}

function stripHtml(value?: string | null) {
  return (value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value?: string | null, maxLength = 180) {
  const clean = stripHtml(value);
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength).trimEnd()}...`;
}

function buildPageUrlPath(page: SearchPageRow) {
  if (page.page_type === 'homepage' || page.slug === '/' || page.slug === 'homepage') {
    return '/';
  }

  return `/${String(page.slug || '').replace(/^\/+/, '')}`;
}

function mapArticleResult(tenant: SearchTenant, article: SearchArticleRow): SiteSearchResult {
  return {
    id: article.id,
    type: 'article',
    title: article.title,
    slug: article.slug,
    excerpt: excerpt(article.summary || article.body),
    url: buildTenantPublicUrl(tenant, `/articolo/${article.slug}`),
    imageUrl: article.cover_image_url,
    publishedAt: article.published_at,
    readingTimeMinutes: article.reading_time_minutes,
  };
}

function mapPageResult(tenant: SearchTenant, page: SearchPageRow): SiteSearchResult {
  const meta = (page.meta || {}) as Record<string, unknown>;
  return {
    id: page.id,
    type: 'page',
    title: page.title,
    slug: page.slug,
    excerpt: excerpt(String(meta.description || meta.title || page.title)),
    url: buildTenantPublicUrl(tenant, buildPageUrlPath(page)),
    updatedAt: page.updated_at,
  };
}

async function fetchTenant(tenantSlug: string) {
  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, name, domain, settings')
    .eq('slug', tenantSlug)
    .single();

  return {
    supabase,
    tenant: (tenant || null) as SearchTenant | null,
  };
}

async function runSimpleSearch(tenant: SearchTenant, query: string, limit: number) {
  const supabase = await createServiceRoleClient();
  const pattern = `%${query}%`;

  const [{ data: articles }, { data: pages }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, summary, body, cover_image_url, published_at, reading_time_minutes')
      .eq('tenant_id', tenant.id)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},summary.ilike.${pattern},body.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(limit),
    supabase
      .from('site_pages')
      .select('id, title, slug, page_type, meta, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('is_published', true)
      .or(`title.ilike.${pattern},slug.ilike.${pattern}`)
      .order('updated_at', { ascending: false })
      .limit(Math.max(5, Math.ceil(limit / 2))),
  ]);

  const articleResults = (articles || []).map((article) => mapArticleResult(tenant, article as SearchArticleRow));
  const pageResults = (pages || []).map((page) => mapPageResult(tenant, page as SearchPageRow));

  return [...articleResults, ...pageResults].slice(0, limit);
}

async function runSemanticSearch(tenant: SearchTenant, query: string, limit: number): Promise<SearchSiteContentResponse> {
  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  if (!isModuleActive(settings, 'ai_assistant')) {
    return {
      tenant,
      results: await runSimpleSearch(tenant, query, limit),
      mode: 'fallback',
    };
  }

  const supabase = await createServiceRoleClient();
  const [{ data: articles }, { data: pages }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, summary, body, cover_image_url, published_at, reading_time_minutes')
      .eq('tenant_id', tenant.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100),
    supabase
      .from('site_pages')
      .select('id, title, slug, page_type, meta, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(30),
  ]);

  const combined = [
    ...(articles || []).map((article) => ({ type: 'article' as const, item: article as SearchArticleRow })),
    ...(pages || []).map((page) => ({ type: 'page' as const, item: page as SearchPageRow })),
  ];

  if (combined.length === 0) {
    return {
      tenant,
      results: [],
      mode: 'semantic',
    };
  }

  const config = getModuleConfig(settings, 'ai_assistant');
  const { provider, apiKey, model } = resolveProvider(config, 'search');
  const catalogue = combined.map((entry, index) => {
    if (entry.type === 'article') {
      return `${index}: [article] ${entry.item.title} — ${excerpt(entry.item.summary || entry.item.body, 140)}`;
    }
    return `${index}: [page] ${entry.item.title} — ${excerpt(String(entry.item.meta?.description || entry.item.title), 140)}`;
  }).join('\n');

  try {
    const response = await callProvider(provider, apiKey, {
      system: 'Sei il motore di ricerca di un CMS editoriale. Dato un catalogo misto di articoli e pagine e una query utente, restituisci SOLO un array JSON di indici ordinati per rilevanza, ad esempio [4, 1, 0].',
      prompt: `Query: "${query}"\n\nCatalogo:\n${catalogue}`,
      model,
    });

    const cleaned = response.text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const indices = JSON.parse(cleaned) as number[];
    const rankedResults = indices
      .filter((index) => index >= 0 && index < combined.length)
      .slice(0, limit)
      .map((index) => combined[index])
      .map((entry) => entry.type === 'article' ? mapArticleResult(tenant, entry.item) : mapPageResult(tenant, entry.item));

    return {
      tenant,
      results: rankedResults,
      mode: 'semantic',
      provider,
    };
  } catch {
    return {
      tenant,
      results: await runSimpleSearch(tenant, query, limit),
      mode: 'fallback',
    };
  }
}

export async function searchSiteContent(opts: {
  tenantSlug: string;
  query: string;
  mode?: SearchMode;
  limit?: number;
}): Promise<SearchSiteContentResponse | null> {
  const query = opts.query.trim();
  if (!opts.tenantSlug || !query) {
    return null;
  }

  const mode = opts.mode || 'simple';
  const limit = Math.min(Math.max(opts.limit || 10, 1), 30);
  const { tenant } = await fetchTenant(opts.tenantSlug);

  if (!tenant) {
    return null;
  }

  if (mode === 'semantic') {
    return runSemanticSearch(tenant, query, limit);
  }

  return {
    tenant,
    results: await runSimpleSearch(tenant, query, limit),
    mode: 'simple',
  };
}
