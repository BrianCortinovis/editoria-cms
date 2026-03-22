import { createServiceRoleClient } from '@/lib/supabase/server';
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

/**
 * Resolve tenant by slug and fetch site config.
 * Used by all public site routes.
 */
export async function resolveTenant(tenantSlug: string): Promise<{
  tenant: ResolvedTenant;
  config: SiteConfig | null;
} | null> {
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
