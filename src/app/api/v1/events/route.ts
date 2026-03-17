import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");
  const upcoming = searchParams.get("upcoming") !== "false";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

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

  let query = supabase
    .from("events")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (upcoming) {
    query = query.gte("starts_at", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
