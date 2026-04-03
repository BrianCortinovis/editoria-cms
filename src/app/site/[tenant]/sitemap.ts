import type { MetadataRoute } from "next";
import { readPublishedManifest, readPublishedJson } from "@/lib/publish/storage";
import type {
  PublishedArticleDocument,
  PublishedCategoryDocument,
  PublishedPageDocument,
} from "@/lib/publish/types";
import { resolveTenant } from "@/lib/site/tenant-resolver";
import { buildTenantPublicUrl } from "@/lib/site/public-url";
import { isNoindexMeta } from "@/lib/seo/runtime";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function sitemap({ params }: Props): Promise<MetadataRoute.Sitemap> {
  const { tenant: tenantSlug } = await params;
  const resolved = await resolveTenant(tenantSlug);
  if (!resolved) {
    return [];
  }

  const manifest = await readPublishedManifest(resolved.tenant.slug);
  if (!manifest) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  const pushEntry = (entry: MetadataRoute.Sitemap[number] | null) => {
    if (!entry?.url || seen.has(entry.url)) {
      return;
    }
    seen.add(entry.url);
    entries.push(entry);
  };

  const homepagePath = manifest.documents.homepage;
  if (homepagePath) {
    const homepageDocument = await readPublishedJson<PublishedPageDocument>(homepagePath);
    const homepageMeta = (homepageDocument?.page?.meta || {}) as Record<string, unknown>;
    if (!isNoindexMeta(homepageMeta)) {
      pushEntry({
        url: buildTenantPublicUrl(resolved.tenant, "/"),
        lastModified: homepageDocument?.page?.updatedAt || homepageDocument?.generatedAt || manifest.generatedAt,
        changeFrequency: "daily",
        priority: 1,
      });
    }
  } else {
    pushEntry({
      url: buildTenantPublicUrl(resolved.tenant, "/"),
      lastModified: manifest.generatedAt,
      changeFrequency: "daily",
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
        url: buildTenantPublicUrl(resolved.tenant, `/${pageSlug.replace(/^\/+/, "")}`),
        lastModified: document.page.updatedAt || document.generatedAt || manifest.generatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    })
  );

  for (const entry of pageDocuments) {
    pushEntry(entry);
  }

  const articleDocuments = await Promise.all(
    Object.entries(manifest.articles || {}).map(async ([articleSlug, path]) => {
      const document = await readPublishedJson<PublishedArticleDocument>(path);
      if (!document?.article || document.article.robots_index === false) {
        return null;
      }

      return {
        url: buildTenantPublicUrl(resolved.tenant, `/articolo/${articleSlug}`),
        lastModified: document.article.published_at || document.generatedAt || manifest.generatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  for (const entry of articleDocuments) {
    pushEntry(entry);
  }

  const categoryDocuments = await Promise.all(
    Object.entries(manifest.categories || {}).map(async ([categorySlug, path]) => {
      const document = await readPublishedJson<PublishedCategoryDocument>(path);
      if (!document?.category) {
        return null;
      }

      return {
        url: buildTenantPublicUrl(resolved.tenant, `/categoria/${categorySlug}`),
        lastModified: document.category.updatedAt || document.generatedAt || manifest.generatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    })
  );

  for (const entry of categoryDocuments) {
    pushEntry(entry);
  }

  return entries;
}
