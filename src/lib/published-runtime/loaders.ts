import { buildPublishedPath, readPublishedJson, readPublishedManifest } from '@/lib/publish/storage';
import type {
  PublishedBannerZone,
  PublishedBannerZonesDocument,
  PublishedManifest,
  PublishedMediaManifestDocument,
  PublishedModuleEntry,
  PublishedModulesDocument,
} from '@/lib/publish/types';

export async function loadPublishedManifest(tenantSlug: string) {
  return readPublishedManifest(tenantSlug);
}

export async function loadPublishedModules(tenantSlug: string) {
  return readPublishedJson<PublishedModulesDocument>(buildPublishedPath(tenantSlug, 'modules'));
}

export async function loadPublishedMediaManifest(tenantSlug: string) {
  return readPublishedJson<PublishedMediaManifestDocument>(buildPublishedPath(tenantSlug, 'media-manifest'));
}

export async function loadPublishedBannerZones(tenantSlug: string) {
  return readPublishedJson<PublishedBannerZonesDocument>(buildPublishedPath(tenantSlug, 'banner-zones'));
}

export async function getPublishedModule(tenantSlug: string, moduleKey: string): Promise<PublishedModuleEntry | null> {
  const document = await loadPublishedModules(tenantSlug);
  return document?.modules.find((entry) => entry.key === moduleKey) || null;
}

export async function getPublishedModulesForPage(tenantSlug: string, pageSlug: string) {
  const normalizedPageSlug = String(pageSlug || 'homepage').replace(/^\/+|\/+$/g, '') || 'homepage';
  const document = await loadPublishedModules(tenantSlug);
  return (document?.modules || []).filter((entry) => entry.pageSlug === normalizedPageSlug);
}

export async function getPublishedMediaById(tenantSlug: string, mediaId: string) {
  const document = await loadPublishedMediaManifest(tenantSlug);
  return document?.items[mediaId] || null;
}

export async function getPublishedMediaByFilename(tenantSlug: string, filename: string) {
  const document = await loadPublishedMediaManifest(tenantSlug);
  const mediaId = document?.byFilename[filename];
  return mediaId ? document?.items[mediaId] || null : null;
}

export async function getPublishedBannerZone(tenantSlug: string, zoneKey: string): Promise<PublishedBannerZone | null> {
  const document = await loadPublishedBannerZones(tenantSlug);
  return document?.zones.find((entry) => entry.zoneKey === zoneKey) || null;
}

export async function getPublishedRuntimePointers(tenantSlug: string) {
  const manifest = await readPublishedManifest(tenantSlug);

  if (!manifest) {
    return null;
  }

  return {
    manifest: manifest as PublishedManifest,
    modulesPath: manifest.documents.modules || null,
    mediaManifestPath: manifest.documents.mediaManifest || null,
    bannerZonesPath: manifest.documents.bannerZones || null,
  };
}
