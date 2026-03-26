/**
 * Tenant Context Caching
 * Avoids expensive subqueries in RLS policies
 * 1-minute in-memory cache per tenant lookup
 */

const tenantCache = new Map<string, { id: string; expiresAt: number }>();

function normalizeTenantSlug(rawSlug: string | null | undefined): string | null {
  if (!rawSlug) return null;
  const slug = rawSlug.trim().toLowerCase();
  if (!slug) return null;
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return slug;
}

export async function getTenantIdFromSlug(slug: string): Promise<string | null> {
  const normalizedSlug = normalizeTenantSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  // Check cache first (1 minute TTL)
  const cached = tenantCache.get(normalizedSlug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.id;
  }

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = await createServiceRoleClient();

    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', normalizedSlug)
      .single();

    if (error || !data) {
      return null;
    }

    // Cache for 1 minute
    tenantCache.set(normalizedSlug, {
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
  const tenantSlug = normalizeTenantSlug(
    request.headers.get('x-tenant-slug') || url.searchParams.get('tenant')
  );

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
