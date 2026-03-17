import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, color, sort_order")
    .eq("tenant_id", tenant.id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
