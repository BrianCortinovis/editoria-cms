import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const platformBaseDomain = (
  process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN || "localhost"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "")
  .replace(/\.$/, "")
  .toLowerCase();

if (!url || !serviceRoleKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

const rolePriority = new Map([
  ["admin", 0],
  ["chief_editor", 1],
  ["editor", 2],
  ["advertiser", 3],
  ["contributor", 4],
]);

function mapLegacyRoleToPlatformRole(role) {
  switch (role) {
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

function buildDefaultHostname(slug) {
  return `${slug}.${platformBaseDomain}`;
}

async function backfillTenant(tenant, membershipsByTenantId) {
  const memberships = membershipsByTenantId.get(tenant.id) || [];
  if (memberships.length === 0) {
    return { tenantId: tenant.id, status: "skipped", reason: "no-memberships" };
  }

  const ownerMembership = [...memberships].sort((left, right) => {
    const leftPriority = rolePriority.get(left.role) ?? 99;
    const rightPriority = rolePriority.get(right.role) ?? 99;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  })[0];

  const defaultHostname = tenant.domain || buildDefaultHostname(tenant.slug);

  const { data: insertedSite, error: siteError } = await supabase
    .from("sites")
    .insert({
      tenant_id: tenant.id,
      owner_user_id: ownerMembership.user_id,
      name: tenant.name,
      slug: tenant.slug,
      default_subdomain: tenant.slug,
      status: "active",
      template_key: null,
      language_code: "it",
      category: null,
      metadata: {
        created_via: "legacy_backfill",
        backfilled_at: new Date().toISOString(),
      },
    })
    .select("*")
    .single();

  if (siteError) {
    return { tenantId: tenant.id, status: "error", reason: siteError.message };
  }

  const membershipRows = memberships.map((membership) => ({
    tenant_id: tenant.id,
    site_id: insertedSite.id,
    user_id: membership.user_id,
    role: mapLegacyRoleToPlatformRole(membership.role),
    joined_at: membership.created_at,
    last_accessed_at: membership.created_at,
  }));

  const { error: membershipsError } = await supabase
    .from("tenant_memberships")
    .insert(membershipRows);

  if (membershipsError) {
    return { tenantId: tenant.id, status: "error", reason: membershipsError.message };
  }

  const { error: settingsError } = await supabase
    .from("site_settings_platform")
    .insert({
      site_id: insertedSite.id,
      tenant_id: tenant.id,
      default_locale: "it",
      timezone: "Europe/Rome",
      onboarding_checklist: {
        site_created: true,
        domain_ready: Boolean(defaultHostname),
        cms_connected: true,
      },
      feature_flags: {},
      notification_settings: {},
      billing_state: { plan: "free" },
    });

  if (settingsError) {
    return { tenantId: tenant.id, status: "error", reason: settingsError.message };
  }

  const domainKind = tenant.domain ? "custom" : "platform_subdomain";
  const { error: domainError } = await supabase
    .from("site_domains")
    .insert({
      site_id: insertedSite.id,
      tenant_id: tenant.id,
      hostname: defaultHostname,
      kind: domainKind,
      is_primary: true,
      status: "active",
      verification_method: "manual",
      verification_instructions: [],
      dns_records: [],
      ssl_status: "active",
      redirect_www: false,
      attached_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      metadata: {
        source: "legacy_backfill",
      },
    });

  if (domainError) {
    return { tenantId: tenant.id, status: "error", reason: domainError.message };
  }

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      site_id: insertedSite.id,
      tenant_id: tenant.id,
      provider: "manual",
      plan_code: "free",
      status: "active",
      limits: {},
      metadata: {
        source: "legacy_backfill",
      },
    });

  if (subscriptionError) {
    return { tenantId: tenant.id, status: "error", reason: subscriptionError.message };
  }

  const { error: tenantUpdateError } = await supabase
    .from("tenants")
    .update({ domain: defaultHostname })
    .eq("id", tenant.id);

  if (tenantUpdateError) {
    return { tenantId: tenant.id, status: "error", reason: tenantUpdateError.message };
  }

  return {
    tenantId: tenant.id,
    siteId: insertedSite.id,
    hostname: defaultHostname,
    status: "backfilled",
  };
}

async function main() {
  const [{ data: tenants, error: tenantsError }, { data: sites, error: sitesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("tenants").select("id, name, slug, domain, created_at, updated_at"),
    supabase.from("sites").select("id, tenant_id"),
    supabase.from("user_tenants").select("user_id, tenant_id, role, created_at"),
  ]);

  if (tenantsError || sitesError || membershipsError) {
    console.error(JSON.stringify({
      tenantsError: tenantsError?.message,
      sitesError: sitesError?.message,
      membershipsError: membershipsError?.message,
    }, null, 2));
    process.exit(1);
  }

  const existingTenantIds = new Set((sites || []).map((site) => site.tenant_id));
  const membershipsByTenantId = new Map();

  for (const membership of memberships || []) {
    const current = membershipsByTenantId.get(membership.tenant_id) || [];
    current.push(membership);
    membershipsByTenantId.set(membership.tenant_id, current);
  }

  const results = [];
  for (const tenant of tenants || []) {
    if (existingTenantIds.has(tenant.id)) {
      results.push({ tenantId: tenant.id, status: "already-linked" });
      continue;
    }

    results.push(await backfillTenant(tenant, membershipsByTenantId));
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
