import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { PlatformMembershipRole } from "@/lib/platform/types";
import type { Tables, UserRole } from "@/types/database";

export interface PlatformSiteSummary {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  defaultSubdomain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  membershipRole: PlatformMembershipRole;
  lastAccessedAt: string | null;
  primaryDomain: string | null;
  activeDomainCount: number;
  source: "platform" | "legacy";
}

export interface PlatformSiteDetail extends PlatformSiteSummary {
  domains: Tables<"site_domains">[];
  memberships: Tables<"tenant_memberships">[];
  subscription: Tables<"subscriptions"> | null;
  settings: Tables<"site_settings_platform"> | null;
}

function isMissingPlatformRelation(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return message.includes("Could not find the table 'public.sites'") ||
    message.includes("Could not find the table 'public.tenant_memberships'") ||
    message.includes("Could not find the table 'public.site_domains'") ||
    message.includes("schema cache");
}

function mapLegacyRoleToPlatformRole(role: UserRole | "super_admin"): PlatformMembershipRole {
  switch (role) {
    case "super_admin":
    case "admin":
      return "owner";
    case "chief_editor":
      return "admin";
    case "editor":
      return "editor";
    case "advertiser":
    case "contributor":
    default:
      return "viewer";
  }
}

function createLegacyMembership(params: {
  tenantId: string;
  userId: string;
  role: PlatformMembershipRole;
  createdAt?: string | null;
}): Tables<"tenant_memberships"> {
  const timestamp = params.createdAt || new Date().toISOString();
  return {
    id: `legacy-membership-${params.tenantId}-${params.userId}`,
    tenant_id: params.tenantId,
    site_id: params.tenantId,
    user_id: params.userId,
    role: params.role,
    invited_email: null,
    invited_by: null,
    joined_at: timestamp,
    last_accessed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    revoked_at: null,
  };
}

async function getLegacyPlatformSitesForUser(userId: string): Promise<PlatformSiteSummary[]> {
  const supabase = await createServerSupabaseClient();
  const { data: memberships, error } = await supabase
    .from("user_tenants")
    .select("tenant_id, role, created_at, tenants(id, slug, name, domain, created_at, updated_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !memberships) {
    return [];
  }

  const legacySites = memberships
    .map((membership): PlatformSiteSummary | null => {
      const tenant = Array.isArray(membership.tenants) ? membership.tenants[0] : membership.tenants;
      if (!tenant) return null;

      return {
        id: tenant.id,
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        defaultSubdomain: tenant.slug,
        status: "active",
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at || tenant.created_at,
        membershipRole: mapLegacyRoleToPlatformRole(membership.role as UserRole),
        lastAccessedAt: null,
        primaryDomain: tenant.domain,
        activeDomainCount: tenant.domain ? 1 : 0,
        source: "legacy" as const,
      };
    })
    .filter((site): site is PlatformSiteSummary => site !== null);

  return legacySites.sort((left, right) => left.name.localeCompare(right.name));
}

async function getLegacyPlatformSiteDetailForUser(
  userId: string,
  siteId: string,
): Promise<PlatformSiteDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("user_tenants")
    .select("tenant_id, role, created_at, tenants(id, slug, name, domain, created_at, updated_at)")
    .eq("user_id", userId)
    .eq("tenant_id", siteId)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const tenant = Array.isArray(membership.tenants) ? membership.tenants[0] : membership.tenants;
  if (!tenant) {
    return null;
  }

  const { data: tenantMembers } = await supabase
    .from("user_tenants")
    .select("id, user_id, role, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true });

  return {
    id: tenant.id,
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    defaultSubdomain: tenant.slug,
    status: "active",
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at || tenant.created_at,
    membershipRole: mapLegacyRoleToPlatformRole(membership.role as UserRole),
    lastAccessedAt: null,
    primaryDomain: tenant.domain,
    activeDomainCount: tenant.domain ? 1 : 0,
    source: "legacy",
    domains: [],
    memberships: (tenantMembers || []).map((item) =>
      createLegacyMembership({
        tenantId: tenant.id,
        userId: item.user_id,
        role: mapLegacyRoleToPlatformRole(item.role as UserRole),
        createdAt: item.created_at,
      })
    ),
    subscription: null,
    settings: null,
  };
}

export async function getCurrentPlatformUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export async function requirePlatformUser() {
  const current = await getCurrentPlatformUser();
  if (!current) {
    redirect("/login");
  }

  return current;
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

export async function getPlatformSitesForUser(userId: string): Promise<PlatformSiteSummary[]> {
  const supabase = await createServiceRoleClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("tenant_memberships")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (isMissingPlatformRelation(membershipsError)) {
    return getLegacyPlatformSitesForUser(userId);
  }

  if (membershipsError) {
    return [];
  }

  if (!memberships || memberships.length === 0) {
    return getLegacyPlatformSitesForUser(userId);
  }

  const siteIds = memberships.map((membership) => membership.site_id);
  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .in("id", siteIds)
    .is("deleted_at", null);

  const { data: domains } = await supabase
    .from("site_domains")
    .select("*")
    .in("site_id", siteIds)
    .is("removed_at", null);

  const sitesById = new Map((sites || []).map((site) => [site.id, site]));
  const domainsBySiteId = new Map<string, Tables<"site_domains">[]>();

  for (const domain of domains || []) {
    const current = domainsBySiteId.get(domain.site_id) || [];
    current.push(domain);
    domainsBySiteId.set(domain.site_id, current);
  }

  return memberships
    .map((membership) => {
      const site = sitesById.get(membership.site_id);
      if (!site) return null;

      const siteDomains = domainsBySiteId.get(site.id) || [];
      const primaryDomain =
        siteDomains.find((domain) => domain.is_primary && domain.status === "active")?.hostname ||
        siteDomains.find((domain) => domain.kind === "platform_subdomain")?.hostname ||
        null;

      return {
        id: site.id,
        tenantId: site.tenant_id,
        name: site.name,
        slug: site.slug,
        defaultSubdomain: site.default_subdomain,
        status: site.status,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        membershipRole: membership.role,
        lastAccessedAt: membership.last_accessed_at,
        primaryDomain,
        activeDomainCount: siteDomains.filter((domain) => !domain.removed_at).length,
        source: "platform",
      };
    })
    .filter((site): site is PlatformSiteSummary => Boolean(site))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getPlatformSiteDetailForUser(
  userId: string,
  siteId: string,
): Promise<PlatformSiteDetail | null> {
  const serviceSupabase = await createServiceRoleClient();
  const { data: membership, error: membershipError } = await serviceSupabase
    .from("tenant_memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("site_id", siteId)
    .is("revoked_at", null)
    .maybeSingle();

  if (isMissingPlatformRelation(membershipError)) {
    return getLegacyPlatformSiteDetailForUser(userId, siteId);
  }

  if (!membership) {
    return getLegacyPlatformSiteDetailForUser(userId, siteId);
  }

  const [{ data: site }, { data: domains }, { data: memberships }, { data: subscription }, { data: settings }] =
    await Promise.all([
      serviceSupabase.from("sites").select("*").eq("id", siteId).is("deleted_at", null).maybeSingle(),
      serviceSupabase
        .from("site_domains")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: true }),
      serviceSupabase
        .from("tenant_memberships")
        .select("*")
        .eq("site_id", siteId)
        .is("revoked_at", null)
        .order("created_at", { ascending: true }),
      serviceSupabase.from("subscriptions").select("*").eq("site_id", siteId).maybeSingle(),
      serviceSupabase.from("site_settings_platform").select("*").eq("site_id", siteId).maybeSingle(),
    ]);

  if (!site) {
    return null;
  }

  const primaryDomain =
    domains?.find((domain) => domain.is_primary && domain.status === "active")?.hostname ||
    domains?.find((domain) => domain.kind === "platform_subdomain")?.hostname ||
    null;

  return {
    id: site.id,
    tenantId: site.tenant_id,
    name: site.name,
    slug: site.slug,
    defaultSubdomain: site.default_subdomain,
    status: site.status,
    createdAt: site.created_at,
    updatedAt: site.updated_at,
    membershipRole: membership.role,
    lastAccessedAt: membership.last_accessed_at,
    primaryDomain,
    activeDomainCount: (domains || []).filter((domain) => !domain.removed_at).length,
    source: "platform",
    domains: domains || [],
    memberships: memberships || [],
    subscription: subscription || null,
    settings: settings || null,
  };
}
