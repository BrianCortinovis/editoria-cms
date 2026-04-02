import { NextRequest, NextResponse } from 'next/server';
import { readPublishedJson } from '@/lib/publish/storage';
import type { PublishedSettingsDocument } from '@/lib/publish/types';
import { getThemeContract } from '@/lib/theme-contract';
import { resolvePublicTenantRecord } from '@/lib/site/runtime';

import { getPublicApiCorsHeaders } from '@/lib/security/cors';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getPublicApiCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'tenant parameter required' }, { status: 400, headers: getPublicApiCorsHeaders(request) });
  }

  const publishedSettings = await readPublishedJson<PublishedSettingsDocument>(`sites/${encodeURIComponent(tenantSlug)}/settings.json`);
  if (publishedSettings?.tenant) {
    return NextResponse.json(
      getThemeContract({ tenantSlug: publishedSettings.tenant.slug, tenantId: publishedSettings.tenant.id }),
      {
        headers: {
          ...getPublicApiCorsHeaders(request),
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  }

  const tenant = await resolvePublicTenantRecord(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: getPublicApiCorsHeaders(request) });
  }

  return NextResponse.json(getThemeContract({ tenantSlug: tenant.slug, tenantId: tenant.id }), {
    headers: {
      ...getPublicApiCorsHeaders(request),
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
