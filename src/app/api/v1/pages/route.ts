import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenant = request.nextUrl.searchParams.get('tenant') || 'valbremmbana';

    const { data: tenantData } = await supabase
      .from('tenants').select('id').eq('slug', tenant).single();

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ pages }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, slug, layout_data, tenant_id, status } = body;

    if (id) {
      const { data: page, error } = await supabase
        .from('pages')
        .update({ title, slug, layout_data, status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select().single();

      if (error) throw error;
      return NextResponse.json(page);
    } else {
      const { data: page, error } = await supabase
        .from('pages')
        .insert([{ tenant_id, author_id: user.id, title, slug, layout_data, status: status || 'draft', page_type: 'custom' }])
        .select().single();

      if (error) throw error;
      return NextResponse.json(page, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
