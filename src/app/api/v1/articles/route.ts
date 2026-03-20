import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const tenant = request.nextUrl.searchParams.get('tenant') || 'valbremmbana';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const { data: tenantData } = await supabase
      .from('tenants').select('id').eq('slug', tenant).single();

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { data: articles, error, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantData.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ articles, total: count }, {
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
