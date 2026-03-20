import { createServiceRoleClient } from '@/lib/supabase/server';
import { getTenantFromRequest } from '@/lib/cache/tenant-context';
import { getCacheHeadersWithSecurity } from '@/lib/cache/cache-headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const supabase = await createServiceRoleClient();

    const { data: breakingNews, error } = await supabase
      .from('breaking_news')
      .select('*')
      .eq('tenant_id', tenant.tenantId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json(
      { breaking_news: breakingNews || [] },
      { headers: getCacheHeadersWithSecurity('BREAKING_NEWS') }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers: getCacheHeadersWithSecurity('ADMIN') }
    );
  }
}
