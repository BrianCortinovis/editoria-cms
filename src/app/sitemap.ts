import type { MetadataRoute } from 'next';
import { buildTenantPublicUrl } from '@/lib/site/public-url';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { readPublishedJson } from '@/lib/publish/storage';
import type {
  PublishedArticleDocument,
  PublishedCategoryDocument,
  PublishedManifest,
  PublishedPageDocument,
  PublishedSettingsDocument,
} from '@/lib/publish/types';
import { isNoindexMeta } from '@/lib/seo/runtime';

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
      const homepagePath = manifest.documents.homepage;
      if (homepagePath) {
        const homepageDocument = await readPublishedJson<PublishedPageDocument>(homepagePath);
        const homepageMeta = (homepageDocument?.page?.meta || {}) as Record<string, unknown>;
        if (!isNoindexMeta(homepageMeta)) {
          pushEntry({
            url: buildTenantPublicUrl(tenant, '/'),
            lastModified: homepageDocument?.page?.updatedAt || homepageDocument?.generatedAt || manifest.generatedAt,
            changeFrequency: 'daily',
            priority: 1,
          });
        }
      } else {
        pushEntry({
          url: buildTenantPublicUrl(tenant, '/'),
          lastModified: manifest.generatedAt || new Date(),
          changeFrequency: 'daily',
          priority: 1,
        });
      }

      const pageDocuments = await Promise.all(
        Object.entries(manifest.pages || {}).map(async ([pageSlug, path]) => {
          const document = await readPublishedJson<PublishedPageDocument>(path);
          const meta = (document?.page?.meta || {}) as Record<string, unknown>;
          if (!document?.page || isNoindexMeta(meta)) {
            return null;
          }

          return {
            url: buildTenantPublicUrl(tenant, `/${String(pageSlug || '').replace(/^\/+/, '')}`),
            lastModified: document.page.updatedAt || document.generatedAt || manifest.generatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          };
        })
      );

      for (const entry of pageDocuments) {
        if (entry) {
          pushEntry(entry);
        }
      }

      const articleDocuments = await Promise.all(
        Object.entries(manifest.articles || {}).map(async ([articleSlug, path]) => {
          const document = await readPublishedJson<PublishedArticleDocument>(path);
          if (!document?.article || document.article.robots_index === false) {
            return null;
          }

          return {
            url: buildTenantPublicUrl(tenant, `/articolo/${articleSlug}`),
            lastModified: document.article.published_at || document.generatedAt || manifest.generatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          };
        })
      );

      for (const entry of articleDocuments) {
        if (entry) {
          pushEntry(entry);
        }
      }

      const categoryDocuments = await Promise.all(
        Object.entries(manifest.categories || {}).map(async ([categorySlug, path]) => {
          const document = await readPublishedJson<PublishedCategoryDocument>(path);
          if (!document?.category) {
            return null;
          }

          return {
            url: buildTenantPublicUrl(tenant, `/categoria/${categorySlug}`),
            lastModified: document.category.updatedAt || document.generatedAt || manifest.generatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          };
        })
      );

      for (const entry of categoryDocuments) {
        if (entry) {
          pushEntry(entry);
        }
      }
    }

    return entries;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
