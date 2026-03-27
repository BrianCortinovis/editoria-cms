import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog, writePageAuditLog } from "@/lib/security/audit";
import { triggerPublish, type PublishTask } from "@/lib/publish/runner";

const PAGE_EDITOR_ROLES = new Set(["admin", "super_admin", "chief_editor", "editor"]);

// GET: Fetch a single page with full blocks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Verify user has access to this page's tenant
  const { data: userTenants } = await supabase
    .from("user_tenants")
    .select("tenant_id")
    .eq("user_id", user.id);

  if (!userTenants?.some(ut => ut.tenant_id === data.tenant_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ page: data });
}

// PUT: Update page (blocks, meta, title, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { pageId } = await params;
  const body = await request.json();
  const { title, slug, page_type, meta, blocks, custom_css, is_published, sort_order } = body;

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get page and verify user access to page's tenant
  const { data: page, error: pageError } = await supabase
    .from("site_pages")
    .select("tenant_id, blocks, meta")
    .eq("id", pageId)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { data: userTenants } = await supabase
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  const membership = userTenants?.find((ut) => ut.tenant_id === page.tenant_id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!PAGE_EDITOR_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Save revision before updating
  if (blocks) {
    await supabase.from("site_page_revisions").insert({
      page_id: pageId,
      blocks: page.blocks,
      meta: page.meta,
      changed_by: user.id,
    });
  }

  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (slug !== undefined) update.slug = slug;
  if (page_type !== undefined) update.page_type = page_type;
  if (meta !== undefined) update.meta = meta;
  if (blocks !== undefined) update.blocks = blocks;
  if (custom_css !== undefined) update.custom_css = custom_css;
  if (is_published !== undefined) update.is_published = is_published;
  if (sort_order !== undefined) update.sort_order = sort_order;

  const { data, error } = await supabase
    .from("site_pages")
    .update(update)
    .eq("id", pageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.all([
    writeActivityLog({
      tenantId: page.tenant_id,
      userId: user.id,
      action: "page.update",
      entityType: "site_page",
      entityId: pageId,
      details: { updatedKeys: Object.keys(update) },
    }),
    writePageAuditLog({
      pageId,
      tenantId: page.tenant_id,
      changedBy: user.id,
      action: "update",
      changes: { updatedKeys: Object.keys(update) },
    }),
  ]);

  const nextTasks: PublishTask[] = data.is_published
    ? [{ type: "page", pageId }]
    : [{ type: "full_rebuild" }];
  await triggerPublish(page.tenant_id, nextTasks, user.id);

  return NextResponse.json({ page: data });
}

// DELETE: Remove a page
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get page and verify user access to page's tenant
  const { data: page } = await supabase
    .from("site_pages")
    .select("tenant_id")
    .eq("id", pageId)
    .single();

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { data: userTenants } = await supabase
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  const membership = userTenants?.find((ut) => ut.tenant_id === page.tenant_id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!PAGE_EDITOR_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("site_pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.all([
    writeActivityLog({
      tenantId: page.tenant_id,
      userId: user.id,
      action: "page.delete",
      entityType: "site_page",
      entityId: pageId,
    }),
    writePageAuditLog({
      pageId,
      tenantId: page.tenant_id,
      changedBy: user.id,
      action: "delete",
      changes: {},
    }),
  ]);

  await triggerPublish(page.tenant_id, [{ type: "full_rebuild" }], user.id);

  return NextResponse.json({ success: true });
}
