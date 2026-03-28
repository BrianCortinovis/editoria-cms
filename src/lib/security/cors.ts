const PLATFORM_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";

  // For CMS endpoints, allow platform origins and preview deployments
  const isAllowed =
    PLATFORM_ORIGINS.some((o) => origin.startsWith(o)) ||
    origin.endsWith(".vercel.app");

  return {
    "Access-Control-Allow-Origin": isAllowed
      ? origin
      : PLATFORM_ORIGINS[0] || "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

// For truly public read-only endpoints (published site content),
// we need to allow any origin since tenant sites can be on any domain
export function getPublicApiCorsHeaders(
  request: Request,
): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

// Variant for public endpoints that also accept POST (forms, comments)
export function getPublicApiCorsHeadersWithPost(
  request: Request,
): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
