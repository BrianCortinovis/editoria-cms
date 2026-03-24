import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { assertTrustedMutationRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';

const PAGE_EDITOR_ROLES = new Set(['super_admin', 'chief_editor', 'editor']);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const tenant = request.nextUrl.searchParams.get('tenant');

    if (!tenant) {
      return NextResponse.json({ error: 'tenant parameter required' }, { status: 400 });
    }

    const { data: tenantData } = await supabase
      .from('tenants').select('id').eq('slug', tenant).single();

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: pages, error } = await supabase
      .from('site_pages')
      .select('id, title, slug, is_published, created_at, updated_at, blocks, meta')
      .eq('tenant_id', tenantData.id)
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ pages }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    });
  } catch (error) {
    console.error('GET /api/v1/pages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const trustedOriginError = assertTrustedMutationRequest(request);
    if (trustedOriginError) {
      return trustedOriginError;
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, slug, blocks, meta, tenant_id, is_published } = body;

    // Verify user has access to this tenant
    const { data: access } = await supabase
      .from('user_tenants')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!PAGE_EDITOR_ROLES.has(access.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (id) {
      const { data: page, error } = await supabase
        .from('site_pages')
        .update({
          title,
          slug,
          blocks: blocks || [],
          meta: meta || {},
          is_published: Boolean(is_published),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(page);
    } else {
      const { data: page, error } = await supabase
        .from('site_pages')
        .insert([{
          tenant_id,
          title,
          slug,
          blocks: blocks || [],
          meta: meta || {},
          is_published: Boolean(is_published),
        }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(page, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/v1/pages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
