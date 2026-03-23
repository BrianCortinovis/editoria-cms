import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildTenantPublicUrl } from '@/lib/site/public-url';

/**
 * GET /api/seo/breadcrumb?tenant_slug=xxx&page_path=/chi-siamo/team
 *
 * Returns JSON-LD structured data for breadcrumb navigation
 * Optimized for Google Search Console and rich snippets
 *
 * Returns:
 * {
 *   "@context": "https://schema.org",
 *   "@type": "BreadcrumbList",
 *   "itemListElement": [
 *     {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com"},
 *     {"@type": "ListItem", "position": 2, "name": "Chi Siamo", "item": "https://example.com/chi-siamo"},
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant_slug');
    const pagePath = searchParams.get('page_path');

    if (!tenantSlug || !pagePath) {
      return NextResponse.json({
        error: 'tenant_slug and page_path required',
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Get tenant domain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('domain')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const baseUrl = buildTenantPublicUrl({ slug: tenantSlug, domain: tenant.domain }, '/');

    // Parse path and build breadcrumb
    const pathParts = pagePath.split('/').filter(Boolean);
    const breadcrumbList = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
    ];

    let currentPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      currentPath += `/${pathParts[i]}`;
      breadcrumbList.push({
        '@type': 'ListItem',
        position: i + 2,
        name: pathParts[i]
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        item: buildTenantPublicUrl({ slug: tenantSlug, domain: tenant.domain }, currentPath),
      });
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbList,
    };

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, immutable',
    });

    return NextResponse.json(schemaData, { headers });
  } catch (error) {
    console.error('Breadcrumb schema error:', error);
    return NextResponse.json({ error: 'Failed to generate schema' }, { status: 500 });
  }
}
