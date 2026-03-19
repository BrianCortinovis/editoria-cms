import type { EditoriaConfig, Article, Category, Tag, Event, Banner, BreakingNews, SitePage, SiteInfo, ListParams } from './types';
import { apiFetch } from './utils/fetch';

export class EditoriaClient {
  private config: EditoriaConfig;

  constructor(config: EditoriaConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ''),
    };
  }

  // === Articles ===
  readonly articles = {
    list: async (params?: ListParams): Promise<{ articles: Article[]; total: number | null }> => {
      const p: Record<string, string> = {};
      if (params?.limit) p.limit = String(params.limit);
      if (params?.offset) p.offset = String(params.offset);
      if (params?.category) p.category = params.category;
      if (params?.tag) p.tag = params.tag;
      if (params?.featured) p.featured = 'true';
      return apiFetch(this.config, '/articles', p);
    },

    getBySlug: async (slug: string): Promise<{ article: Article }> => {
      return apiFetch(this.config, `/articles/${slug}`);
    },
  };

  // === Categories ===
  readonly categories = {
    list: async (): Promise<{ categories: Category[] }> => {
      return apiFetch(this.config, '/categories');
    },
  };

  // === Tags ===
  readonly tags = {
    list: async (): Promise<{ tags: Tag[] }> => {
      return apiFetch(this.config, '/tags');
    },
  };

  // === Events ===
  readonly events = {
    list: async (params?: { limit?: number }): Promise<{ events: Event[] }> => {
      const p: Record<string, string> = {};
      if (params?.limit) p.limit = String(params.limit);
      return apiFetch(this.config, '/events', p);
    },
  };

  // === Banners ===
  readonly banners = {
    list: async (params?: { position?: string; device?: string }): Promise<{ banners: Banner[] }> => {
      const p: Record<string, string> = {};
      if (params?.position) p.position = params.position;
      if (params?.device) p.device = params.device;
      return apiFetch(this.config, '/banners', p);
    },
  };

  // === Breaking News ===
  readonly breakingNews = {
    list: async (): Promise<{ breaking_news: BreakingNews[] }> => {
      return apiFetch(this.config, '/breaking-news');
    },
  };

  // === Layout ===
  readonly layout = {
    get: async (page?: string): Promise<unknown> => {
      const p: Record<string, string> = {};
      if (page) p.page = page;
      return apiFetch(this.config, '/layout', p);
    },
  };

  // === Pages (Site Builder) ===
  readonly pages = {
    list: async (): Promise<{ pages: SitePage[] }> => {
      return apiFetch(this.config, '/pages');
    },
    getBySlug: async (slug: string): Promise<{ page: SitePage }> => {
      return apiFetch(this.config, '/pages', { slug });
    },
  };

  // === Site Info ===
  readonly site = {
    info: async (): Promise<SiteInfo> => {
      return apiFetch(this.config, '/site');
    },
  };

  // === AI Features (requires apiKey with 'ai' permission) ===
  readonly ai = {
    search: async (query: string, params?: { limit?: number }): Promise<{ results: Article[] }> => {
      const p: Record<string, string> = { q: query };
      if (params?.limit) p.limit = String(params.limit);
      return apiFetch(this.config, '/search', p);
    },

    relatedArticles: async (articleSlug: string, params?: { limit?: number }): Promise<{ articles: Article[] }> => {
      const p: Record<string, string> = {};
      if (params?.limit) p.limit = String(params.limit);
      return apiFetch(this.config, `/articles/${articleSlug}/related`, p);
    },

    summarize: async (articleSlug: string, params?: { maxLength?: number }): Promise<{ summary: string }> => {
      const p: Record<string, string> = {};
      if (params?.maxLength) p.maxLength = String(params.maxLength);
      return apiFetch(this.config, `/articles/${articleSlug}/summary`, p);
    },
  };
}
