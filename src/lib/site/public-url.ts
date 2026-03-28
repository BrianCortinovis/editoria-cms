interface TenantUrlLike {
  slug: string;
  domain?: string | null;
}

function getDefaultBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl;

  if (process.env.NODE_ENV === 'production') {
    console.warn("NEXT_PUBLIC_APP_URL not set in production, using localhost fallback");
  }
  return 'http://localhost:3000';
}

function normalizeBaseUrl(value?: string | null) {
  const fallback = getDefaultBaseUrl();
  const raw = (value || fallback).trim();
  if (!raw) {
    return fallback;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/g, '');
}

export function getAppBaseUrl() {
  return normalizeBaseUrl(getDefaultBaseUrl());
}

export function getTenantPublicBaseUrl(tenant: TenantUrlLike) {
  if (tenant.domain) {
    return normalizeBaseUrl(tenant.domain);
  }

  return `${getAppBaseUrl()}/site/${tenant.slug}`;
}

export function buildTenantPublicUrl(tenant: TenantUrlLike, path = '/') {
  const baseUrl = getTenantPublicBaseUrl(tenant);
  const normalizedPath = `/${path || ''}`.replace(/\/+/g, '/');

  if (normalizedPath === '/') {
    return baseUrl;
  }

  return `${baseUrl}${normalizedPath.replace(/\/+$/g, '')}`;
}
