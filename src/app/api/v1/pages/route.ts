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

// GET: Public endpoint — fetch published pages for a tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const slug = searchParams.get("slug");
  const pageType = searchParams.get("type");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: CORS_HEADERS });
  }

  // Single page by slug
  if (slug) {
    const { data, error } = await supabase
      .from("site_pages")
      .select("id, title, slug, page_type, meta, blocks, custom_css, updated_at")
      .eq("tenant_id", tenant.id)
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Page not found" }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json({ page: data }, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  }

  // List published pages
  let query = supabase
    .from("site_pages")
    .select("id, title, slug, page_type, meta, sort_order, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("is_published", true)
    .order("sort_order");

  if (pageType) {
    query = query.eq("page_type", pageType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json({ pages: data }, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
