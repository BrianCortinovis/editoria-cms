import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: page, error: pageError } = await supabase
    .from('site_pages')
    .select('id, title, slug, blocks, tenant_id')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('tenant_id', page.tenant_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, domain, logo_url')
    .eq('id', page.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const isHomepage = page.slug === 'homepage' || page.slug === '/' || page.slug === '';
  const publicPath = isHomepage
    ? `/site/${tenant.slug}`
    : `/site/${tenant.slug}/${page.slug}`;

  const response = await fetch(`${origin}${publicPath}`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to render export' }, { status: 500 });
  }

  const html = await response.text();

  return NextResponse.json({
    html,
    filename: `${page.slug || page.title || 'page'}.html`,
  });
}
