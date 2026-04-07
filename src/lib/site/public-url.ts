interface TenantUrlLike {
  slug: string;
  domain?: string | null;
}

function isLocalLikeHost(value: string) {
  const normalized = value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/g, "").toLowerCase();
  const hostname = normalized.split(":")[0] || normalized;

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    if (hostname.startsWith("127.") || hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
      return true;
    }

    const octets = hostname.split(".").map((part) => Number(part));
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return true;
    }
  }

  return false;
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

export function normalizePublicBaseUrl(value?: string | null) {
  const fallback = getDefaultBaseUrl();
  const raw = (value || fallback).trim();
  if (!raw) {
    return fallback;
  }

  const withProtocol = /^https?:\/\//i.test(raw)
    ? raw
    : `${isLocalLikeHost(raw) ? "http" : "https"}://${raw}`;
  return withProtocol.replace(/\/+$/g, '');
}

export function getAppBaseUrl() {
  return normalizePublicBaseUrl(getDefaultBaseUrl());
}

export function getTenantPublicBaseUrl(tenant: TenantUrlLike) {
  if (tenant.domain) {
    return normalizePublicBaseUrl(tenant.domain);
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
