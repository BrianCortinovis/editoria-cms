import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getThemeContract } from '@/lib/theme-contract';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant parameter required' }, { status: 400, headers: CORS_HEADERS });
  }

  const supabase = await createServiceRoleClient();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', tenantSlug)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CORS_HEADERS });
  }

  return NextResponse.json(getThemeContract({ tenantSlug: tenant.slug, tenantId: tenant.id }), {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
