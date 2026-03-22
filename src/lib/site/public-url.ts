interface TenantUrlLike {
  slug: string;
  domain?: string | null;
}

function normalizeBaseUrl(value?: string | null) {
  const fallback = 'http://localhost:3000';
  const raw = (value || fallback).trim();
  if (!raw) {
    return fallback;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/g, '');
}

export function getAppBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
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
