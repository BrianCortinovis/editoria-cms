// ============================================
// Editoria SDK — Types
// ============================================

export interface EditoriaConfig {
  /** Slug del tenant (es. "corriere-locale") */
  tenant: string;
  /** URL base del CMS (es. "https://cms.example.com") */
  baseUrl: string;
  /** API key opzionale per endpoint protetti */
  apiKey?: string;
  /** Timeout in ms (default: 10000) */
  timeout?: number;
  /** Cache TTL in secondi (default: 60). 0 = no cache */
  cacheTtl?: number;
  /** Fetch custom (per SSR, service workers, ecc.) */
  fetcher?: typeof fetch;
}

// --- Entità ---

export interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  body: string;
  cover_image_url: string | null;
  status: string;
  is_featured: boolean;
  is_premium: boolean;
  is_breaking: boolean;
  reading_time_minutes: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  author: { full_name: string; avatar_url: string | null } | null;
  category: { name: string; slug: string; color: string | null } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Banner {
  id: string;
  name: string;
  type: 'image' | 'html' | 'adsense';
  image_url: string | null;
  html_code: string | null;
  target_url: string | null;
  position: string;
  device_target: string;
}

export interface BreakingNews {
  id: string;
  title: string;
  url: string | null;
  priority: number;
  is_active: boolean;
}

export interface SiteEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  cover_image_url: string | null;
  price: string | null;
  is_recurring: boolean;
}

export interface SitePage {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  blocks: unknown[];
  meta: Record<string, string> | null;
  is_published: boolean;
}

export interface SiteTheme {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: string;
}

export interface SiteConfig {
  tenant: {
    name: string;
    slug: string;
    domain: string | null;
    logo_url: string | null;
  };
  config: {
    theme: SiteTheme;
    navigation: { items: Array<{ label: string; url: string }> };
    footer: { copyright: string; links: Array<{ label: string; url: string }> };
    favicon_url: string | null;
    og_defaults: Record<string, string> | null;
    global_css: string | null;
  } | null;
}

export interface SearchResult {
  articles: Article[];
  total: number;
}

// --- Parametri ---

export interface ArticleFilters {
  category?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface BannerFilters {
  position?: string;
  device?: 'desktop' | 'mobile' | 'all';
}

// --- Risposte ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number | null;
  limit: number;
  offset: number;
}

// --- Client ---

export interface EditoriaClient {
  articles: {
    list(filters?: ArticleFilters): Promise<PaginatedResponse<Article>>;
    get(slug: string): Promise<Article | null>;
    related(slug: string, limit?: number): Promise<Article[]>;
  };
  categories: {
    list(): Promise<Category[]>;
  };
  tags: {
    list(): Promise<Tag[]>;
  };
  banners: {
    list(filters?: BannerFilters): Promise<Banner[]>;
  };
  breakingNews: {
    list(): Promise<BreakingNews[]>;
  };
  events: {
    list(limit?: number): Promise<SiteEvent[]>;
  };
  pages: {
    list(): Promise<SitePage[]>;
    get(slug: string): Promise<SitePage | null>;
  };
  site: {
    config(): Promise<SiteConfig>;
  };
  search: {
    query(q: string, options?: { ai?: boolean; limit?: number }): Promise<SearchResult>;
  };
}
