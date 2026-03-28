import type { MetadataRoute } from 'next';
import { buildTenantPublicUrl } from '@/lib/site/public-url';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { readPublishedJson } from '@/lib/publish/storage';
import type { PublishedManifest, PublishedSettingsDocument } from '@/lib/publish/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries: MetadataRoute.Sitemap = [];
    const seen = new Set<string>();
    const supabase = await createServiceRoleClient();

    const pushEntry = (entry: MetadataRoute.Sitemap[number]) => {
      if (!entry?.url || seen.has(entry.url)) {
        return;
      }
      seen.add(entry.url);
      entries.push(entry);
    };

    let allDirectories: { name: string }[] = [];
    let offset = 0;
    const PAGE_SIZE = 500;
    while (true) {
      const { data: batch } = await supabase.storage
        .from('published')
        .list('sites', { limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } });
      if (!batch || batch.length === 0) break;
      allDirectories = allDirectories.concat(batch);
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    for (const directory of allDirectories) {
      const slug = String(directory.name || '').trim();
      if (!slug) continue;

      const [manifest, settings] = await Promise.all([
        readPublishedJson<PublishedManifest>(`sites/${encodeURIComponent(slug)}/manifest.json`),
        readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(slug)}/settings.json`),
      ]);

      if (!manifest || !settings?.tenant) {
        continue;
      }

      const tenant = settings.tenant;
      pushEntry({
        url: buildTenantPublicUrl(tenant, '/'),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      });

      for (const articleSlug of Object.keys(manifest.articles || {})) {
        pushEntry({
          url: buildTenantPublicUrl(tenant, `/articolo/${articleSlug}`),
          lastModified: manifest.generatedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }

      for (const pageSlug of Object.keys(manifest.pages || {})) {
        pushEntry({
          url: buildTenantPublicUrl(tenant, `/${String(pageSlug || '').replace(/^\/+/, '')}`),
          lastModified: manifest.generatedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }

      for (const categorySlug of Object.keys(manifest.categories || {})) {
        pushEntry({
          url: buildTenantPublicUrl(tenant, `/categoria/${categorySlug}`),
          lastModified: manifest.generatedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }

    return entries;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
