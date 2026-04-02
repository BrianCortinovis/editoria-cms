import { createServiceRoleClient } from '@/lib/supabase/server';
import type { PublishedManifest } from '@/lib/publish/types';
import { putObjectToR2, readJsonFromR2, type R2Credentials } from '@/lib/storage/r2-client';

const PUBLISHED_BUCKET = 'published';
const storageTargetCache = new Map<string, { target: PublishedStorageTarget; expiresAt: number }>();

type PublishedStorageTarget =
  | { kind: 'shared-supabase' }
  | { kind: 'dedicated-r2'; credentials: R2Credentials };

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

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getTenantSlugFromPublishedPath(path: string) {
  const normalized = String(path || '').replace(/^\/+/, '');
  const [root, tenantSlug] = normalized.split('/');

  if (root !== 'sites' || !tenantSlug) {
    return null;
  }

  return decodePathSegment(tenantSlug);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function resolveDedicatedR2Credentials(config: Record<string, unknown>): R2Credentials | null {
  const nested = asObject(config.r2);
  const accountId = asString(nested.accountId || config.r2_account_id);
  const accessKeyId = asString(nested.accessKeyId || config.r2_access_key_id);
  const secretAccessKey = asString(nested.secretAccessKey || config.r2_secret_access_key);
  const bucketName = asString(nested.bucketName || config.r2_bucket_name);
  const publicUrl = asString(nested.publicUrl || config.r2_public_url);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}

async function resolvePublishedStorageTarget(path: string): Promise<PublishedStorageTarget> {
  const tenantSlug = getTenantSlugFromPublishedPath(path);
  if (!tenantSlug) {
    return { kind: 'shared-supabase' };
  }

  const cached = storageTargetCache.get(tenantSlug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.target;
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .maybeSingle();

  if (!tenant?.id) {
    const target: PublishedStorageTarget = { kind: 'shared-supabase' };
    storageTargetCache.set(tenantSlug, {
      target,
      expiresAt: Date.now() + 60_000,
    });
    return target;
  }

  const { data: infrastructure } = await supabase
    .from('site_infrastructure')
    .select('stack_kind, config')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const dedicatedCredentials =
    infrastructure?.stack_kind === 'dedicated'
      ? resolveDedicatedR2Credentials(asObject(infrastructure.config))
      : null;

  const target: PublishedStorageTarget = dedicatedCredentials
    ? { kind: 'dedicated-r2', credentials: dedicatedCredentials }
    : { kind: 'shared-supabase' };

  storageTargetCache.set(tenantSlug, {
    target,
    expiresAt: Date.now() + 60_000,
  });

  return target;
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
  const body = JSON.stringify(payload, null, 2);
  const target = await resolvePublishedStorageTarget(path);

  if (target.kind === 'dedicated-r2') {
    await putObjectToR2(target.credentials, path, Buffer.from(body), 'application/json', {
      cacheControl,
    });
    return;
  }

  await ensurePublishedBucket();
  const supabase = await createServiceRoleClient();

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
  const target = await resolvePublishedStorageTarget(path);

  if (target.kind === 'dedicated-r2') {
    try {
      const document = await readJsonFromR2<T>(target.credentials, path);
      if (document) {
        return document;
      }
    } catch {
      // Fall through to shared published storage to keep older releases readable.
    }
  }

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
