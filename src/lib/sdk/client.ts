import type {
  EditoriaConfig,
  EditoriaClient,
  Article,
  Category,
  Tag,
  Banner,
  BreakingNews,
  SiteEvent,
  SitePage,
  SiteConfig,
  SearchResult,
  PaginatedResponse,
  ArticleFilters,
  BannerFilters,
  CommandCatalogResponse,
  CommandExecutionResponse,
  CommandEnvelope,
} from './types';

// In-memory cache semplice — zero deps
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl: number) {
  if (ttl <= 0) return;
  cache.set(key, { data, expires: Date.now() + ttl * 1000 });
}

/**
 * Crea un client Editoria CMS headless.
 *
 * ```ts
 * const cms = createEditoria({ tenant: 'mia-testata', baseUrl: 'https://cms.example.com' })
 * const { data: articles } = await cms.articles.list({ limit: 5 })
 * ```
 */
export function createEditoria(config: EditoriaConfig): EditoriaClient {
  const {
    tenant,
    baseUrl,
    apiKey,
    timeout = 10000,
    cacheTtl = 60,
    fetcher = fetch,
  } = config;

  const base = baseUrl.replace(/\/$/, '');

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    return headers;
  }

  async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${base}/api/v1${path}`);
    url.searchParams.set('tenant', tenant);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }

    const cacheKey = url.toString();
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetcher(url.toString(), {
        signal: controller.signal,
        headers: buildHeaders(),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new EditoriaError(`HTTP ${res.status}: ${body}`, res.status);
      }

      const data = await res.json() as T;
      setCache(cacheKey, data, cacheTtl);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function mutate<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetcher(`${base}/api/v1${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...buildHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.text().catch(() => '');
        throw new EditoriaError(`HTTP ${res.status}: ${payload}`, res.status);
      }

      return await res.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    articles: {
      async list(filters: ArticleFilters = {}): Promise<PaginatedResponse<Article>> {
        const params: Record<string, string> = {};
        if (filters.category) params.category = filters.category;
        if (filters.tag) params.tag = filters.tag;
        if (filters.featured) params.featured = 'true';
        if (filters.limit) params.limit = String(filters.limit);
        if (filters.offset) params.offset = String(filters.offset);

        const res = await request<{ articles: Article[]; total: number | null; limit: number; offset: number }>('/articles', params);
        return { data: res.articles, total: res.total, limit: res.limit, offset: res.offset };
      },

      async get(slug: string): Promise<Article | null> {
        try {
          return await request<Article>(`/articles/${encodeURIComponent(slug)}`);
        } catch (e) {
          if (e instanceof EditoriaError && e.status === 404) return null;
          throw e;
        }
      },

      async related(slug: string, limit = 5): Promise<Article[]> {
        const res = await request<{ articles: Article[] }>(`/articles/${encodeURIComponent(slug)}/related`, { limit: String(limit) });
        return res.articles;
      },
    },

    categories: {
      async list(): Promise<Category[]> {
        return request<Category[]>('/categories');
      },
    },

    tags: {
      async list(): Promise<Tag[]> {
        return request<Tag[]>('/tags');
      },
    },

    banners: {
      async list(filters: BannerFilters = {}): Promise<Banner[]> {
        const params: Record<string, string> = {};
        if (filters.position) params.position = filters.position;
        if (filters.device) params.device = filters.device;
        return request<Banner[]>('/banners', params);
      },
    },

    breakingNews: {
      async list(): Promise<BreakingNews[]> {
        return request<BreakingNews[]>('/breaking-news');
      },
    },

    events: {
      async list(limit?: number): Promise<SiteEvent[]> {
        const params: Record<string, string> = {};
        if (limit) params.limit = String(limit);
        return request<SiteEvent[]>('/events', params);
      },
    },

    pages: {
      async list(): Promise<SitePage[]> {
        const res = await request<{ pages: SitePage[] }>('/pages');
        return res.pages;
      },

      async get(slug: string): Promise<SitePage | null> {
        try {
          const res = await request<{ pages: SitePage[] }>('/pages', { slug });
          return res.pages?.[0] ?? null;
        } catch (e) {
          if (e instanceof EditoriaError && e.status === 404) return null;
          throw e;
        }
      },
    },

    site: {
      async config(): Promise<SiteConfig> {
        return request<SiteConfig>('/site');
      },
    },

    search: {
      async query(q: string, options: { ai?: boolean; limit?: number } = {}): Promise<SearchResult> {
        const params: Record<string, string> = { q };
        if (options.ai) params.ai = 'true';
        if (options.limit) params.limit = String(options.limit);
        return request<SearchResult>('/search', params);
      },
    },

    commands: {
      async catalog(): Promise<CommandCatalogResponse> {
        return request<CommandCatalogResponse>('/commands', {});
      },

      async execute(payload: {
        tenantId?: string;
        tenant?: string;
        dryRun?: boolean;
        commands: CommandEnvelope[];
      }): Promise<CommandExecutionResponse> {
        return mutate<CommandExecutionResponse>('/commands', {
          tenant_id: payload.tenantId,
          tenant: payload.tenant ?? tenant,
          dryRun: payload.dryRun ?? false,
          commands: payload.commands,
        });
      },
    },
  };
}

// --- Error ---

export class EditoriaError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'EditoriaError';
  }
}
