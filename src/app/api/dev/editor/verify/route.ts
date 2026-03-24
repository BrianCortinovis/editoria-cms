import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { summarizeBlockTree, verifyRenderedHtml } from '@/lib/editor/verification';
import type { Block } from '@/lib/types/block';

async function getAuthorizedPage(pageId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: page, error } = await supabase
    .from('site_pages')
    .select('id, tenant_id, title, slug, blocks, meta, page_type')
    .eq('id', pageId)
    .single();

  if (error || !page) {
    return { supabase, page: null, error: NextResponse.json({ error: 'Page not found' }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from('user_tenants')
    .select('tenant_id, role')
    .eq('user_id', userId)
    .eq('tenant_id', page.tenant_id)
    .maybeSingle();

  if (!membership) {
    return { supabase, page: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase, page, error: null };
}

export async function POST(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pageId = typeof body.pageId === 'string' ? body.pageId : '';
  if (!pageId) {
    return NextResponse.json({ error: 'pageId required' }, { status: 400 });
  }

  const authorized = await getAuthorizedPage(pageId, user.id);
  if (authorized.error || !authorized.page) {
    return authorized.error!;
  }

  const blocks = Array.isArray(authorized.page.blocks) ? (authorized.page.blocks as Block[]) : [];
  const summary = summarizeBlockTree(blocks);

  const { data: tenant } = await authorized.supabase
    .from('tenants')
    .select('slug')
    .eq('id', authorized.page.tenant_id)
    .single();

  const origin = new URL(request.url).origin;
  const isHomepage = authorized.page.slug === 'homepage' || authorized.page.slug === '/' || authorized.page.page_type === 'homepage';
  const publicPath = tenant
    ? (isHomepage ? `/site/${tenant.slug}` : `/site/${tenant.slug}/${authorized.page.slug}`)
    : null;

  let renderedHtml = '';
  let renderStatus: number | null = null;
  if (publicPath) {
    const renderResponse = await fetch(`${origin}${publicPath}`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    });
    renderStatus = renderResponse.status;
    if (renderResponse.ok) {
      renderedHtml = await renderResponse.text();
    }
  }

  const htmlChecks = renderedHtml ? verifyRenderedHtml(blocks, renderedHtml) : null;

  return NextResponse.json({
    page: {
      id: authorized.page.id,
      title: authorized.page.title,
      slug: authorized.page.slug,
      tenant_id: authorized.page.tenant_id,
    },
    summary,
    render: {
      publicPath,
      status: renderStatus,
      htmlChecks,
    },
  });
}
