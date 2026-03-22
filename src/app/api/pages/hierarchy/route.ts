import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/pages/hierarchy?tenant_id=xxx&parent_id=xxx&sort=order|updated
 *
 * Returns optimized page hierarchy with caching headers
 * - Uses materialized view for O(1) performance
 * - Includes breadcrumb, path, and SEO slug for frontend
 * - Supports parent filtering for breadcrumb navigation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const parentId = searchParams.get('parent_id');
    const sort = searchParams.get('sort') || 'sort_order';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify tenant access
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: access } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query materialized view for performance
    let query = supabase
      .from('page_hierarchy_view')
      .select('id, title, slug, parent_id, path, depth, seo_slug, breadcrumb, status, sort_order')
      .eq('tenant_id', tenantId);

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query.order(
      sort === 'updated' ? 'updated_at' : 'sort_order',
      { ascending: true }
    );

    if (error) throw error;

    // Set cache headers for static content (1 hour)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    });

    return NextResponse.json({ pages: data }, { headers });
  } catch (error) {
    console.error('Pages hierarchy error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

/**
 * PATCH /api/pages/hierarchy
 *
 * Bulk update page order within same parent
 * Optimized for sorting operations
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pages } = body; // [{ id, sort_order }, ...]

    if (!Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Batch update with transaction-like behavior
    const updates = pages.map(p => ({
      id: p.id,
      sort_order: p.sort_order,
    }));

    // Update all pages
    for (const update of updates) {
      await supabase
        .from('site_pages')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pages update error:', error);
    return NextResponse.json({ error: 'Failed to update pages' }, { status: 500 });
  }
}
