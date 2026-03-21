import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET: List all site pages for current tenant
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to this tenant
  const { data: userTenants, error: tenantError } = await supabase
    .from("user_tenants")
    .select("tenant_id")
    .eq("user_id", user.id);

  if (tenantError || !userTenants?.some(ut => ut.tenant_id === tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_pages")
    .select("id, title, slug, page_type, is_published, sort_order, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pages: data });
}

// POST: Create a new site page
export async function POST(request: Request) {
  const body = await request.json();
  const { tenant_id, title, slug, page_type, meta, blocks } = body;

  if (!tenant_id || !title || !slug) {
    return NextResponse.json({ error: "tenant_id, title, slug required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to the requested tenant
  const { data: userTenants, error: tenantError } = await supabase
    .from("user_tenants")
    .select("tenant_id")
    .eq("user_id", user.id);

  if (tenantError || !userTenants?.some(ut => ut.tenant_id === tenant_id)) {
    return NextResponse.json({ error: "Forbidden: no access to this tenant" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_pages")
    .insert({
      tenant_id,
      title,
      slug,
      page_type: page_type || "custom",
      meta: meta || {},
      blocks: blocks || [],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data }, { status: 201 });
}
