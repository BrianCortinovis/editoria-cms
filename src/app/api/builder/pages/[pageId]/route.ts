import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET: Fetch a single page with full blocks
export async function GET(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("site_pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ page: data });
}

// PUT: Update page (blocks, meta, title, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const body = await request.json();
  const { title, slug, page_type, meta, blocks, custom_css, is_published, sort_order } = body;

  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Save revision before updating
  if (blocks) {
    const { data: current } = await supabase
      .from("site_pages")
      .select("blocks, meta")
      .eq("id", pageId)
      .single();

    if (current) {
      await supabase.from("site_page_revisions").insert({
        page_id: pageId,
        blocks: current.blocks,
        meta: current.meta,
        changed_by: user.id,
      });
    }
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

  return NextResponse.json({ page: data });
}

// DELETE: Remove a page
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("site_pages")
    .delete()
    .eq("id", pageId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
