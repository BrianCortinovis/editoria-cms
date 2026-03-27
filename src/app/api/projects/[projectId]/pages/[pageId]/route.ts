import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PAGE_EDITOR_ROLES = new Set(['admin', 'chief_editor', 'editor']);

async function getAuthorizedPage(pageId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: page, error: pageError } = await supabase
    .from('site_pages')
    .select('tenant_id, blocks, meta')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    return { supabase, page: null, error: NextResponse.json({ error: 'Page not found' }, { status: 404 }) };
  }

  const { data: userTenants } = await supabase
    .from('user_tenants')
    .select('tenant_id, role')
    .eq('user_id', userId);

  const membership = userTenants?.find((tenant) => tenant.tenant_id === page.tenant_id);
  if (!membership) {
    return { supabase, page: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase, page, membership, error: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('site_pages').select('*').eq('id', pageId).single();
  if (error || !data) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const { data: userTenants } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id);

  if (!userTenants?.some((tenant) => tenant.tenant_id === data.tenant_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ page: data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
  const { pageId } = await params;
  const body = await request.json();
  const { title, slug, page_type, meta, blocks, custom_css, is_published, sort_order } = body;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authorized = await getAuthorizedPage(pageId, user.id);
  if (authorized.error || !authorized.page) {
    return authorized.error!;
  }
  if (!authorized.membership || !PAGE_EDITOR_ROLES.has(authorized.membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (blocks !== undefined) {
    await authorized.supabase.from('site_page_revisions').insert({
      page_id: pageId,
      blocks: authorized.page.blocks,
      meta: authorized.page.meta,
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

  const { data, error } = await authorized.supabase
    .from('site_pages')
    .update(update)
    .eq('id', pageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}
