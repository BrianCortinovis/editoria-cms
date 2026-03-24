import { NextResponse } from "next/server";
import { searchSiteContent } from "@/lib/site/search";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const query = searchParams.get("q");
  const mode = searchParams.get("mode") || "simple";
  const limit = Math.min(Number(searchParams.get("limit") || 10), 30);
  const clientIp = getClientIp(request);

  if (!tenantSlug || !query) {
    return NextResponse.json({ error: "tenant and q parameters required" }, { status: 400, headers: CORS_HEADERS });
  }

  const limiter = await checkRateLimit(
    `search:${tenantSlug}:${mode}:${clientIp}`,
    mode === "semantic" ? 15 : 60,
    60 * 1000
  );
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many search requests" },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": String(Math.ceil(limiter.retryAfterMs / 1000)),
        },
      }
    );
  }

  const response = await searchSiteContent({
    tenantSlug,
    query,
    mode: mode === "semantic" ? "semantic" : "simple",
    limit,
  });

  if (!response) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    {
      tenant: response.tenant,
      results: response.results,
      mode: response.mode,
      provider: response.provider,
    },
    {
      headers: { ...CORS_HEADERS, "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    }
  );
}
