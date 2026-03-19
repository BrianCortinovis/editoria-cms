import { createServiceRoleClient } from '@/lib/supabase/server';

export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
}

export interface SiteConfig {
  theme: Record<string, unknown>;
  navigation: Array<{ label: string; url: string; children?: Array<{ label: string; url: string }> }>;
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

  const { data } = await supabase
    .from('site_pages')
    .select('id, title, slug, page_type, meta, blocks, custom_css, updated_at')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  return data;
}
