import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const featured = searchParams.get("featured");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const offset = Number(searchParams.get("offset") || 0);

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Get tenant ID
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let query = supabase
    .from("articles")
    .select("id, title, subtitle, slug, summary, cover_image_url, status, is_featured, is_premium, is_breaking, reading_time_minutes, view_count, published_at, created_at, profiles!articles_author_id_fkey(full_name, avatar_url), categories(name, slug, color)")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("slug", category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data,
    total: count,
    limit,
    offset,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
