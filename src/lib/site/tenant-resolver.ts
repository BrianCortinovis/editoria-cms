import { createServiceRoleClient } from '@/lib/supabase/server';
import { readPublishedJson, readPublishedManifest } from '@/lib/publish/storage';
import type { Block } from '@/lib/types/block';
import type {
  PublishedArticleDocument,
  PublishedCategoryDocument,
  PublishedPageDocument,
  PublishedSettingsDocument,
} from '@/lib/publish/types';
import type { SiteMenuItem } from '@/lib/site/navigation';

export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
}

export interface SiteConfig {
  theme: Record<string, unknown>;
  navigation: SiteMenuItem[] | Record<string, unknown>;
  footer: Record<string, unknown>;
  favicon_url: string | null;
  og_defaults: Record<string, unknown>;
  global_css: string | null;
}

export interface PublishedPagePayload {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  meta: Record<string, unknown>;
  blocks: Block[];
  custom_css: string | null;
  updated_at: string;
  resolved_data_map?: Record<string, unknown[]>;
}

/**
 * Resolve tenant by slug and fetch site config.
 * Used by all public site routes.
 */
export async function resolveTenant(tenantSlug: string): Promise<{
  tenant: ResolvedTenant;
  config: SiteConfig | null;
} | null> {
  const publishedSettings = await readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(tenantSlug)}/settings.json`);

  if (publishedSettings?.tenant) {
    return {
      tenant: publishedSettings.tenant,
      config: publishedSettings.config,
    };
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, domain, logo_url')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) return null;

  const { data: config } = await supabase
    .from('site_config')
    .select('theme, navigation, footer, favicon_url, og_defaults, global_css')
    .eq('tenant_id', tenant.id)
    .single();

  return { tenant, config };
}

/**
 * Fetch a published page by slug for a tenant.
 */
export async function getPublishedPage(tenantId: string, slug: string) {
  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', tenantId)
    .maybeSingle();

  if (tenant?.slug) {
    const manifest = await readPublishedManifest(tenant.slug);
    const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
    const pagePath = !normalizedSlug || normalizedSlug === 'homepage'
      ? manifest?.documents.homepage
      : manifest?.pages[normalizedSlug];

    if (pagePath) {
      const pageDocument = await readPublishedJson<PublishedPageDocument>(pagePath);
      if (pageDocument?.page) {
        return {
          id: pageDocument.page.id,
          title: pageDocument.page.title,
          slug: pageDocument.page.slug,
          page_type: pageDocument.page.pageType,
          meta: pageDocument.page.meta,
          blocks: pageDocument.page.blocks,
          custom_css: pageDocument.page.customCss,
          updated_at: pageDocument.page.updatedAt,
          resolved_data_map: pageDocument.resolvedDataMap,
        } satisfies PublishedPagePayload;
      }
    }
  }

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');

  if (!normalizedSlug) {
    const { data: homepage } = await supabase
      .from('site_pages')
      .select('id, title, slug, page_type, meta, blocks, custom_css, updated_at')
      .eq('tenant_id', tenantId)
      .eq('is_published', true)
      .eq('page_type', 'homepage')
      .maybeSingle();

    if (homepage) return homepage;
    return null;
  }

  const { data } = await supabase
    .from('site_pages')
    .select('id, title, slug, page_type, meta, blocks, custom_css, updated_at')
    .eq('tenant_id', tenantId)
    .eq('is_published', true)
    .eq('slug', normalizedSlug)
    .maybeSingle();

  return data;
}

export async function getPublishedArticleBySlug(tenantSlug: string, articleSlug: string) {
  const manifest = await readPublishedManifest(tenantSlug);
  const articlePath = manifest?.articles[articleSlug];

  if (articlePath) {
    const document = await readPublishedJson<PublishedArticleDocument>(articlePath);
    if (document?.article) {
      return document.article;
    }
  }

  return null;
}

export async function getPublishedCategoryBySlug(tenantSlug: string, categorySlug: string) {
  const manifest = await readPublishedManifest(tenantSlug);
  const categoryPath = manifest?.categories[categorySlug];

  if (categoryPath) {
    const document = await readPublishedJson<PublishedCategoryDocument>(categoryPath);
    if (document?.category) {
      return document;
    }
  }

  return null;
}
