import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { buildSiteBridgePack } from "@/lib/editorial/site-bridge-pack";

const EDITOR_ROLES = new Set(["super_admin", "chief_editor", "editor"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function buildCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestOrigin = request.nextUrl.origin;
  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": origin && origin === requestOrigin ? origin : requestOrigin,
    "Vary": "Origin",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);
  const tenantSlug = request.nextUrl.searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenant parameter required" }, { status: 400, headers: corsHeaders });
  }

  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug, domain")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: corsHeaders });
  }

  const { data: membership } = await supabase
    .from("user_tenants")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !EDITOR_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  const [{ data: siteConfig }, { data: pages }, { data: categories }, { data: slots }] = await Promise.all([
    supabase
      .from("site_config")
      .select("theme, navigation, footer, favicon_url, og_defaults, global_css")
      .eq("tenant_id", tenant.id)
      .single(),
    supabase
      .from("site_pages")
      .select("id, title, slug, is_published, updated_at, meta")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, slug, name, color")
      .eq("tenant_id", tenant.id)
      .order("sort_order"),
    supabase
      .from("layout_slots")
      .select("id, slot_key, label, content_type, assignment_mode, max_items, placement_duration_hours, categories(slug), layout_templates!inner(page_type, tenant_id)")
      .eq("layout_templates.tenant_id", tenant.id),
  ]);

  const pack = buildSiteBridgePack({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
    },
    siteConfig: siteConfig || null,
    pages: (pages || []) as Array<{
      id: string;
      title: string;
      slug: string;
      is_published?: boolean | null;
      updated_at?: string | null;
      meta?: unknown;
    }>,
    categories: (categories || []) as Array<{
      id: string;
      slug: string;
      name: string;
      color: string | null;
    }>,
    slots: (slots || []) as Array<{
      id: string;
      slot_key: string;
      label: string;
      content_type: string;
      assignment_mode?: string | null;
      max_items?: number | null;
      placement_duration_hours?: number | null;
      categories?: { slug?: string | null } | null;
      layout_templates?: { page_type?: string | null } | null;
    }>,
  });

  return NextResponse.json(pack, {
    headers: {
      ...corsHeaders,
      "Cache-Control": "private, no-store",
    },
  });
}
