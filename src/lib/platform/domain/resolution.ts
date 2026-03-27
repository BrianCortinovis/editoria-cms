import { createServiceRoleClient } from "@/lib/supabase/server";
import type { PlatformResolvedHost } from "@/lib/platform/types";

const RESERVED_PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "app.localhost",
  "admin.localhost",
]);

export function normalizeHostname(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/:\d+$/, "");
}

export async function resolveSiteByHost(
  rawHost: string,
): Promise<PlatformResolvedHost | null> {
  const hostname = normalizeHostname(rawHost);
  if (!hostname || RESERVED_PLATFORM_HOSTS.has(hostname)) {
    return null;
  }

  const supabase = await createServiceRoleClient();

  const { data: domainMatch } = await supabase
    .from("site_domains")
    .select("site_id, tenant_id, hostname, is_primary, status, sites(name, slug)")
    .eq("hostname", hostname)
    .is("removed_at", null)
    .eq("status", "active")
    .maybeSingle();

  if (domainMatch) {
    const site = Array.isArray(domainMatch.sites) ? domainMatch.sites[0] : domainMatch.sites;

    return {
      hostname: domainMatch.hostname,
      siteId: domainMatch.site_id,
      tenantId: domainMatch.tenant_id,
      siteSlug: site?.slug ?? null,
      siteName: site?.name ?? null,
      isPrimaryDomain: Boolean(domainMatch.is_primary),
      source: "site_domains",
    };
  }

  const { data: tenantMatch } = await supabase
    .from("tenants")
    .select("id, slug, name, domain")
    .eq("domain", hostname)
    .maybeSingle();

  if (!tenantMatch) {
    return null;
  }

  return {
    hostname,
    siteId: null,
    tenantId: tenantMatch.id,
    siteSlug: tenantMatch.slug,
    siteName: tenantMatch.name,
    isPrimaryDomain: true,
    source: "legacy_tenant_domain",
  };
}
