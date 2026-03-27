import type { Block } from '@/lib/types/block';
import type { SiteMenuItem } from '@/lib/site/navigation';
import type { SiteFooterConfig } from '@/lib/site/footer';
import type { ResolvedTenant, SiteConfig } from '@/lib/site/tenant-resolver';

export interface PublishedManifest {
  siteId: string;
  tenantId: string;
  tenantSlug: string;
  releaseId: string;
  generatedAt: string;
  documents: {
    settings: string;
    menu: string;
    homepage: string | null;
    posts: string;
    search: string;
    tags?: string;
    events?: string;
    breakingNews?: string;
    banners?: string;
    bannerZones?: string;
    mediaManifest?: string;
    modules?: string;
    layouts?: Record<string, string>;
  };
  pages: Record<string, string>;
  articles: Record<string, string>;
  categories: Record<string, string>;
}

export interface PublishedMediaItem {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  folder: string | null;
  createdAt: string;
}

export interface PublishedMediaManifestDocument {
  type: 'media-manifest';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  items: Record<string, PublishedMediaItem>;
  byFilename: Record<string, string>;
}

export interface PublishedModuleEntry {
  key: string;
  pageId: string;
  pageSlug: string;
  pageType: string;
  blockId: string;
  blockType: string;
  label: string;
  props: Record<string, unknown>;
  dataSource: Record<string, unknown> | null;
  resolvedData: unknown[];
  assetRefs: string[];
  childIds: string[];
  updatedAt: string;
}

export interface PublishedModulesDocument {
  type: 'modules';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  modules: PublishedModuleEntry[];
}

export interface PublishedPostsDocument {
  type: 'posts';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  articles: PublishedArticleSummary[];
  total: number;
}

export interface PublishedSearchEntry {
  id: string;
  type: 'article' | 'page';
  title: string;
  slug: string;
  excerpt: string;
  urlPath: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTimeMinutes?: number | null;
}

export interface PublishedSearchDocument {
  type: 'search';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  entries: PublishedSearchEntry[];
}

export interface PublishedTagsDocument {
  type: 'tags';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface PublishedEventsDocument {
  type: 'events';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  events: Array<Record<string, unknown>>;
}

export interface PublishedBreakingNewsDocument {
  type: 'breaking-news';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  items: Array<Record<string, unknown>>;
}

export interface PublishedBannersDocument {
  type: 'banners';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  banners: Array<Record<string, unknown>>;
}

export interface PublishedBannerZone {
  zoneKey: string;
  position: string;
  targetDevice: string;
  selectionMode: 'weighted_rotation';
  items: Array<Record<string, unknown>>;
}

export interface PublishedBannerZonesDocument {
  type: 'banner-zones';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  zones: PublishedBannerZone[];
}

export interface PublishedLayoutTemplate {
  id: string;
  name: string;
  pageType: string;
  screenshotUrl: string | null;
}

export interface PublishedLayoutSlotCategory {
  name: string;
  slug: string;
  color: string | null;
}

export interface PublishedLayoutSlot {
  slot_key: string;
  label: string;
  content_type: string;
  category: PublishedLayoutSlotCategory | null;
  style_hint: string | null;
  items: Array<Record<string, unknown>>;
}

export interface PublishedLayoutDocument {
  type: 'layout';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  pageType: string;
  template: PublishedLayoutTemplate;
  slots: PublishedLayoutSlot[];
}

export interface PublishedSettingsDocument {
  type: 'settings';
  generatedAt: string;
  siteId: string;
  tenantId: string;
  tenant: ResolvedTenant;
  config: SiteConfig | null;
  tenantSettings: Record<string, unknown>;
}

export interface PublishedMenuDocument {
  type: 'menu';
  generatedAt: string;
  tenantId: string;
  tenantSlug: string;
  navigation: {
    primary: SiteMenuItem[];
    secondary: SiteMenuItem[];
    mobile: SiteMenuItem[];
    footer: SiteMenuItem[];
  };
  footer: SiteFooterConfig;
}

export interface PublishedPageDocument {
  type: 'page';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  page: {
    id: string;
    title: string;
    slug: string;
    pageType: string;
    meta: Record<string, unknown>;
    blocks: Block[];
    customCss: string | null;
    updatedAt: string;
  };
  resolvedDataMap: Record<string, unknown[]>;
}

export interface PublishedArticleAuthor {
  full_name: string;
  avatar_url: string | null;
  bio?: string | null;
}

export interface PublishedCategorySummary {
  id?: string;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
}

export interface PublishedArticleSummary {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_premium?: boolean;
  profiles: PublishedArticleAuthor | null;
  categories: PublishedCategorySummary | null;
  all_categories: PublishedCategorySummary[];
}

export interface PublishedArticleDocument {
  type: 'article';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  article: PublishedArticleSummary & {
    body: string;
    is_featured: boolean;
    is_breaking: boolean;
    is_premium: boolean;
  };
}

export interface PublishedCategoryDocument {
  type: 'category';
  generatedAt: string;
  tenantId: string;
  siteId: string;
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    updatedAt: string;
  };
  articles: PublishedArticleSummary[];
}
