import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET: Public endpoint — fetch site config (theme, nav, footer) for a tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, domain, logo_url")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: config } = await supabase
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
      ...CORS_HEADERS,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
