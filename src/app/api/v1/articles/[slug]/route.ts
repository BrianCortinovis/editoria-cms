import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: article, error } = await supabase
    .from("articles")
    .select("*, profiles!articles_author_id_fkey(full_name, avatar_url, bio), categories(name, slug, color), article_tags(tags(name, slug))")
    .eq("tenant_id", tenant.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Increment view count (fire and forget)
  supabase.rpc("increment_view_count", { article_id: article.id }).then(() => {});

  return NextResponse.json({ article }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
