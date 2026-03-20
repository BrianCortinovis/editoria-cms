/**
 * Cache Header Strategies
 * Optimized for Vercel Edge caching + CDN
 */

export const CACHE_STRATEGIES = {
  // Public content - aggressive caching
  ARTICLES_LIST: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },

  // Article detail - longer cache
  ARTICLE_DETAIL: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  },

  // Pages - longer cache
  PAGES: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  },

  // Categories - cached longer (rarely updated)
  CATEGORIES: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },

  // Breaking news - short cache (frequently updated)
  BREAKING_NEWS: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
  },

  // Banners - moderate cache
  BANNERS: {
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
    'CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
  },

  // Admin content - no cache
  ADMIN: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },

  // API with auth - private
  PRIVATE: {
    'Cache-Control': 'private, max-age=0, must-revalidate',
  },
};

export type CacheStrategy = keyof typeof CACHE_STRATEGIES;

export function getCacheHeaders(strategy: CacheStrategy): Record<string, string> {
  return CACHE_STRATEGIES[strategy] || CACHE_STRATEGIES.ADMIN;
}

export function addSecurityHeaders(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export function getCacheHeadersWithSecurity(
  strategy: CacheStrategy
): Record<string, string> {
  return addSecurityHeaders(getCacheHeaders(strategy)) as Record<string, string>;
}
