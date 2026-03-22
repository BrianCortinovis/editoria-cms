import { createServiceRoleClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createServiceRoleClient();
    const entries: MetadataRoute.Sitemap = [];
    const seen = new Set<string>();

    const pushEntry = (entry: MetadataRoute.Sitemap[number]) => {
      if (!entry?.url || seen.has(entry.url)) {
        return;
      }
      seen.add(entry.url);
      entries.push(entry);
    };

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, slug, domain');

    const tenantMap = new Map((tenants || []).map((tenant) => [tenant.id, tenant]));

    // Get all published articles
    const { data: articles } = await supabase
      .from('articles')
      .select('tenant_id, slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    // Get all published pages
    const { data: sitePages } = await supabase
      .from('site_pages')
      .select('tenant_id, slug, updated_at, page_type')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('tenant_id, slug, updated_at');

    for (const tenant of tenants || []) {
      pushEntry({
        url: buildTenantPublicUrl(tenant, '/'),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      });
    }

    for (const article of articles || []) {
      const tenant = tenantMap.get(article.tenant_id);
      if (!tenant) continue;
      pushEntry({
        url: buildTenantPublicUrl(tenant, `/articolo/${article.slug}`),
        lastModified: article.updated_at || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }

    for (const page of sitePages || []) {
      const tenant = tenantMap.get(page.tenant_id);
      if (!tenant) continue;
      const pagePath = page.page_type === 'homepage' || page.slug === '/' || page.slug === 'homepage'
        ? '/'
        : `/${String(page.slug || '').replace(/^\/+/, '')}`;

      pushEntry({
        url: buildTenantPublicUrl(tenant, pagePath),
        lastModified: page.updated_at || new Date(),
        changeFrequency: page.page_type === 'homepage' ? 'daily' : 'weekly',
        priority: page.page_type === 'homepage' ? 0.95 : 0.7,
      });
    }

    for (const category of categories || []) {
      const tenant = tenantMap.get(category.tenant_id);
      if (!tenant) continue;
      pushEntry({
        url: buildTenantPublicUrl(tenant, `/categoria/${category.slug}`),
        lastModified: category.updated_at || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      });
    }

    return entries;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
