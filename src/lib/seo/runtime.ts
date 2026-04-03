import { buildTenantPublicUrl } from "@/lib/site/public-url";
import type { ResolvedTenant, TenantSettings } from "@/lib/site/tenant-resolver";

export interface TenantRobotsSettings {
  enabled: boolean;
  allow: string[];
  disallow: string[];
  crawlDelay: number | null;
  extraSitemaps: string[];
}

const DEFAULT_ALLOW = ["/"];
const DEFAULT_DISALLOW = ["/dashboard", "/admin", "/api", "/auth"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePathList(input: unknown, fallback: string[]) {
  if (Array.isArray(input)) {
    const next = input
      .map((entry) => asString(entry))
      .filter(Boolean)
      .map((entry) => (entry.startsWith("/") ? entry : `/${entry}`));
    return next.length > 0 ? [...new Set(next)] : fallback;
  }

  if (typeof input === "string") {
    const next = input
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => (entry.startsWith("/") ? entry : `/${entry}`));
    return next.length > 0 ? [...new Set(next)] : fallback;
  }

  return fallback;
}

function normalizeUrlList(input: unknown) {
  if (Array.isArray(input)) {
    return [...new Set(input.map((entry) => asString(entry)).filter(Boolean))];
  }

  if (typeof input === "string") {
    return [
      ...new Set(
        input
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
}

export function getTenantRobotsSettings(tenantSettings?: TenantSettings): TenantRobotsSettings {
  const settings = asRecord(tenantSettings);
  const seo = asRecord(settings.seo);
  const robots = asRecord(seo.robots);

  return {
    enabled: asBoolean(robots.enabled, true),
    allow: normalizePathList(robots.allow, DEFAULT_ALLOW),
    disallow: normalizePathList(robots.disallow, DEFAULT_DISALLOW),
    crawlDelay: asNumber(robots.crawlDelay),
    extraSitemaps: normalizeUrlList(robots.extraSitemaps),
  };
}

export function resolveCanonicalUrl(
  tenant: ResolvedTenant,
  candidate: unknown,
  fallbackPath: string
) {
  const raw = asString(candidate);
  if (!raw) {
    return buildTenantPublicUrl(tenant, fallbackPath);
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return buildTenantPublicUrl(tenant, raw.startsWith("/") ? raw : `/${raw}`);
}

export function isNoindexMeta(meta: Record<string, unknown> | null | undefined) {
  return Boolean(meta?.noindex);
}

export function buildBreadcrumbSchema(input: {
  tenant: ResolvedTenant;
  items: Array<{ name: string; path: string }>;
}) {
  const elements = input.items
    .filter((item) => item.name.trim() && item.path.trim())
    .map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildTenantPublicUrl(input.tenant, item.path),
    }));

  if (elements.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: elements,
  };
}

export function buildPageSchema(input: {
  schemaType?: unknown;
  title: string;
  description: string;
  url: string;
  siteName: string;
  siteUrl?: string;
  imageUrl?: string | null;
}) {
  const schemaType = asString(input.schemaType, "WebPage") || "WebPage";
  const base = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: input.title,
    headline: input.title,
    description: input.description || undefined,
    url: input.url,
    isPartOf: {
      "@type": "WebSite",
      name: input.siteName,
      url: input.siteUrl || input.url,
    },
    image: input.imageUrl || undefined,
  } as Record<string, unknown>;

  if (schemaType === "NewsMediaOrganization") {
    return {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: input.siteName,
      url: input.url,
      description: input.description || undefined,
      logo: input.imageUrl
        ? {
            "@type": "ImageObject",
            url: input.imageUrl,
          }
        : undefined,
    };
  }

  return base;
}
