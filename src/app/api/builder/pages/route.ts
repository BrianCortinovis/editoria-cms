import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog, writePageAuditLog } from "@/lib/security/audit";
import { buildDefaultPageMeta, slugifyPageTitle } from "@/lib/pages/page-seo";
import { triggerPublish } from "@/lib/publish/runner";
import { z } from "zod";

const builderPageCreateSchema = z.object({
  tenant_id: z.string().uuid("tenant_id must be a valid UUID"),
  title: z.string().min(1, "title is required"),
  slug: z.string().regex(/^[a-z0-9-]*$/, "invalid slug").optional().default(""),
  page_type: z.string().optional().default("custom"),
  meta: z.record(z.unknown()).optional(),
  blocks: z.array(z.record(z.unknown())).transform((val) => val as unknown as import("@/lib/types/block").Block[]).optional().default([]),
}).passthrough();

const PAGE_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);

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
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const body = await request.json();
  const parsed = builderPageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { tenant_id, title, slug, page_type, meta, blocks } = parsed.data;
  const normalizedSlug = typeof slug === "string" && slug.trim() ? slug.trim() : slugifyPageTitle(String(title || ""));

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to the requested tenant
  const { data: userTenants, error: tenantError } = await supabase
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  const membership = userTenants?.find((ut) => ut.tenant_id === tenant_id);
  if (tenantError || !membership) {
    return NextResponse.json({ error: "Forbidden: no access to this tenant" }, { status: 403 });
  }
  if (!PAGE_EDITOR_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("site_pages")
    .insert({
      tenant_id,
      title,
      slug: normalizedSlug,
      page_type: page_type || "custom",
      meta: buildDefaultPageMeta({
        title,
        slug: normalizedSlug,
        blocks: Array.isArray(blocks) ? blocks : [],
        currentMeta: meta || {},
      }),
      blocks: blocks || [],
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.all([
    writeActivityLog({
      tenantId: tenant_id,
      userId: user.id,
      action: "page.create",
      entityType: "site_page",
      entityId: data.id,
      details: { title: data.title, slug: data.slug, page_type: data.page_type },
    }),
    writePageAuditLog({
      pageId: data.id,
      tenantId: tenant_id,
      changedBy: user.id,
      action: "create",
      changes: { title: data.title, slug: data.slug, page_type: data.page_type },
    }),
  ]);

  if (data.is_published) {
    await triggerPublish(tenant_id, [{ type: "page", pageId: data.id }], user.id);
  }

  return NextResponse.json({ page: data }, { status: 201 });
}
