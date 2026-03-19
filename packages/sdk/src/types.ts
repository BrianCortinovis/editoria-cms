// ============================================
// @editoria/sdk - Public Types
// ============================================

export interface EditoriaConfig {
  baseUrl: string;
  tenant: string;
  apiKey?: string;
  cache?: { ttl?: number };
}

export interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  body: string;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  view_count: number;
  is_featured: boolean;
  is_premium: boolean;
  is_breaking: boolean;
  author: { full_name: string; avatar_url: string | null } | null;
  category: { name: string; slug: string; color: string | null } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  price: string | null;
}

export interface Banner {
  id: string;
  name: string;
  position: string;
  type: string;
  image_url: string | null;
  html_content: string | null;
  link_url: string | null;
}

export interface BreakingNews {
  id: string;
  text: string;
  link_url: string | null;
  priority: number;
}

export interface SitePage {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  meta: Record<string, unknown>;
  blocks: unknown[];
  custom_css: string | null;
  updated_at: string;
}

export interface SiteInfo {
  tenant: {
    name: string;
    slug: string;
    domain: string | null;
    logo_url: string | null;
  };
  config: {
    theme: Record<string, unknown>;
    navigation: Array<{ label: string; url: string }>;
    footer: Record<string, unknown>;
    favicon_url: string | null;
    og_defaults: Record<string, unknown>;
  } | null;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
}
