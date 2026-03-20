/**
 * Tenant Context Caching
 * Avoids expensive subqueries in RLS policies
 * 1-minute in-memory cache per tenant lookup
 */

const tenantCache = new Map<string, { id: string; expiresAt: number }>();

export async function getTenantIdFromSlug(slug: string): Promise<string | null> {
  // Check cache first (1 minute TTL)
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.id;
  }

  try {
    const { createServiceRoleClient } = await import('./supabase/server');
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    // Cache for 1 minute
    tenantCache.set(slug, {
      id: data.id,
      expiresAt: Date.now() + 60000,
    });

    return data.id;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export async function getTenantFromRequest(request: Request): Promise<
  { tenantId: string; tenantSlug: string } | null
> {
  const url = new URL(request.url);
  const tenantSlug = url.searchParams.get('tenant') || url.pathname.split('/')[1];

  if (!tenantSlug) {
    return null;
  }

  const tenantId = await getTenantIdFromSlug(tenantSlug);
  return tenantId ? { tenantId, tenantSlug } : null;
}

export function clearTenantCache(slug: string): void {
  tenantCache.delete(slug);
}

export function clearAllTenantCache(): void {
  tenantCache.clear();
}
