import { createServiceRoleClient } from '@/lib/supabase/server';
import type { PublishedManifest } from '@/lib/publish/types';

const PUBLISHED_BUCKET = 'published';

function encodePathSegment(value: string) {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function buildPublishedPath(
  tenantSlug: string,
  kind: 'manifest' | 'settings' | 'menu' | 'homepage' | 'posts' | 'search' | 'tags' | 'events' | 'breaking-news' | 'banners' | 'banner-zones' | 'media-manifest' | 'modules' | 'layout' | 'page' | 'article' | 'category',
  slug?: string,
) {
  const root = `sites/${encodeURIComponent(tenantSlug)}`;

  switch (kind) {
    case 'manifest':
      return `${root}/manifest.json`;
    case 'settings':
      return `${root}/settings.json`;
    case 'menu':
      return `${root}/menu.json`;
    case 'homepage':
      return `${root}/homepage.json`;
    case 'posts':
      return `${root}/posts.json`;
    case 'search':
      return `${root}/search.json`;
    case 'tags':
      return `${root}/tags.json`;
    case 'events':
      return `${root}/events.json`;
    case 'breaking-news':
      return `${root}/breaking-news.json`;
    case 'banners':
      return `${root}/banners.json`;
    case 'banner-zones':
      return `${root}/banner-zones.json`;
    case 'media-manifest':
      return `${root}/media-manifest.json`;
    case 'modules':
      return `${root}/modules.json`;
    case 'layout':
      return `${root}/layouts/${encodePathSegment(String(slug || 'homepage'))}.json`;
    case 'page':
      return `${root}/pages/${encodePathSegment(String(slug || 'index'))}.json`;
    case 'article':
      return `${root}/articles/${encodeURIComponent(String(slug || 'article'))}.json`;
    case 'category':
      return `${root}/categories/${encodeURIComponent(String(slug || 'category'))}.json`;
    default:
      return `${root}/manifest.json`;
  }
}

async function ensurePublishedBucket() {
  const supabase = await createServiceRoleClient();
  const { data: bucket } = await supabase.storage.getBucket(PUBLISHED_BUCKET);

  if (!bucket) {
    await supabase.storage.createBucket(PUBLISHED_BUCKET, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 20,
      allowedMimeTypes: ['application/json'],
    });
  }
}

export async function writePublishedJson(path: string, payload: unknown, cacheControl = 'public, max-age=30, stale-while-revalidate=120') {
  await ensurePublishedBucket();
  const supabase = await createServiceRoleClient();
  const body = JSON.stringify(payload, null, 2);

  const { error } = await supabase.storage.from(PUBLISHED_BUCKET).upload(path, body, {
    contentType: 'application/json',
    cacheControl,
    upsert: true,
  });

  if (error) {
    throw error;
  }
}

export async function readPublishedJson<T>(path: string): Promise<T | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase.storage.from(PUBLISHED_BUCKET).download(path);

  if (error || !data) {
    return null;
  }

  try {
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function readPublishedManifest(tenantSlug: string) {
  return readPublishedJson<PublishedManifest>(buildPublishedPath(tenantSlug, 'manifest'));
}

export function getPublishedBucketName() {
  return PUBLISHED_BUCKET;
}
