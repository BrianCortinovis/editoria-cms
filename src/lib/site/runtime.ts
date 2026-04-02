import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient, createServiceRoleClientForTenant } from "@/lib/supabase/server";

export interface PublicTenantRecord {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  settings?: Record<string, unknown> | null;
}

const tenantRecordCache = new Map<string, { tenant: PublicTenantRecord; expiresAt: number }>();

function normalizeTenantSlug(rawSlug: string | null | undefined): string | null {
  if (!rawSlug) return null;
  const slug = rawSlug.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  return slug;
}

export async function resolvePublicTenantRecord(tenantSlug: string): Promise<PublicTenantRecord | null> {
  const normalizedSlug = normalizeTenantSlug(tenantSlug);
  if (!normalizedSlug) return null;

  const cached = tenantRecordCache.get(normalizedSlug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, domain, logo_url, settings")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!data) return null;

  const tenant = data as PublicTenantRecord;
  tenantRecordCache.set(normalizedSlug, {
    tenant,
    expiresAt: Date.now() + 60_000,
  });
  return tenant;
}

export async function resolvePublicTenantContext(tenantSlug: string): Promise<{
  tenant: PublicTenantRecord;
  runtimeClient: SupabaseClient;
} | null> {
  const tenant = await resolvePublicTenantRecord(tenantSlug);
  if (!tenant) return null;

  return {
    tenant,
    runtimeClient: await createServiceRoleClientForTenant(tenant.id),
  };
}

export async function resolvePublicTenantContextById(tenantId: string): Promise<{
  tenant: PublicTenantRecord;
  runtimeClient: SupabaseClient;
} | null> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, domain, logo_url, settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (!data) return null;

  const tenant = data as PublicTenantRecord;
  tenantRecordCache.set(tenant.slug, {
    tenant,
    expiresAt: Date.now() + 60_000,
  });

  return {
    tenant,
    runtimeClient: await createServiceRoleClientForTenant(tenant.id),
  };
}
