import { NextResponse } from "next/server";
import { readPublishedJson } from "@/lib/publish/storage";
import type { PublishedSettingsDocument } from "@/lib/publish/types";
import { resolvePublicTenantContext } from "@/lib/site/runtime";

import { getPublicApiCorsHeaders } from "@/lib/security/cors";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getPublicApiCorsHeaders(request) });
}

// GET: Public endpoint — fetch site config (theme, nav, footer) for a tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: getPublicApiCorsHeaders(request) });
  }

  const publishedSettings = await readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(tenantSlug)}/settings.json`);
  if (publishedSettings?.tenant) {
    return NextResponse.json({
      tenant: {
        name: publishedSettings.tenant.name,
        slug: publishedSettings.tenant.slug,
        domain: publishedSettings.tenant.domain,
        logo_url: publishedSettings.tenant.logo_url,
      },
      config: publishedSettings.config || null,
    }, {
      headers: {
        ...getPublicApiCorsHeaders(request),
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  const context = await resolvePublicTenantContext(tenantSlug);
  if (!context) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: getPublicApiCorsHeaders(request) });
  }

  const { tenant, runtimeClient } = context;

  const { data: config } = await runtimeClient
    .from("site_config")
    .select("theme, navigation, footer, favicon_url, og_defaults, global_css")
    .eq("tenant_id", tenant.id)
    .single();

  return NextResponse.json({
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      logo_url: tenant.logo_url,
    },
    config: config || null,
  }, {
    headers: {
      ...getPublicApiCorsHeaders(request),
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
