import slugify from "slugify";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { PlatformAuthorizationError } from "@/lib/platform/authorization";
import { getDomainProviderMode, RESERVED_SUBDOMAINS } from "@/lib/platform/constants";
import { normalizeHostname } from "@/lib/platform/domain/resolution";
import { VercelDomainProvider } from "@/lib/platform/domain/vercel-provider";
import { VpsDomainProvider } from "@/lib/platform/domain/vps-provider";
import type { DomainProvider } from "@/lib/platform/domain/provider";
import type { Tables } from "@/types/database";

function getDomainProvider(): DomainProvider {
  return getDomainProviderMode() === "vercel" ? new VercelDomainProvider() : new VpsDomainProvider();
}

function normalizeDomainLabel(value: string): string {
  return slugify(value, { lower: true, strict: true, trim: true });
}

async function requireSiteMembershipForCurrentUser(siteId: string) {
  const sessionClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    throw new PlatformAuthorizationError("Authentication required");
  }

  const serviceClient = await createServiceRoleClient();
  const { data: membership } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!membership) {
    throw new PlatformAuthorizationError("Site membership not found");
  }

  if (!["owner", "admin"].includes(membership.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  return {
    user,
    membership,
    serviceClient,
  };
}

async function syncPrimaryDomain(
  serviceClient: Awaited<ReturnType<typeof createServiceRoleClient>>,
  siteId: string,
  tenantId: string,
  hostname: string,
) {
  await serviceClient.from("site_domains").update({ is_primary: false }).eq("site_id", siteId);
  await serviceClient
    .from("site_domains")
    .update({ is_primary: true })
    .eq("site_id", siteId)
    .eq("hostname", hostname)
    .is("removed_at", null);

  await serviceClient.from("tenants").update({ domain: hostname }).eq("id", tenantId);
}

export async function attachDomainToSite(siteId: string, rawHostname: string, isPrimary: boolean) {
  const { user, membership, serviceClient } = await requireSiteMembershipForCurrentUser(siteId);
  const hostname = normalizeHostname(rawHostname);
  if (!hostname.includes(".")) {
    throw new Error("Inserisci un dominio completo, ad esempio example.com");
  }

  const subLabel = normalizeDomainLabel(hostname.split(".")[0] || "");
  if (RESERVED_SUBDOMAINS.has(subLabel)) {
    throw new Error("Questo dominio usa un host riservato dalla piattaforma");
  }

  const { data: existingDomain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("hostname", hostname)
    .maybeSingle();

  if (existingDomain && existingDomain.site_id !== siteId && !existingDomain.removed_at) {
    throw new Error("Questo dominio e` gia` associato a un altro sito");
  }

  const provider = getDomainProvider();
  const providerResult = await provider.attachDomain({
    siteId,
    tenantId: membership.tenant_id,
    hostname,
    isPrimary,
  });

  const payload: Omit<Tables<"site_domains">, "id" | "created_at" | "updated_at"> = {
    site_id: siteId,
    tenant_id: membership.tenant_id,
    hostname,
    kind: "custom",
    is_primary: Boolean(isPrimary),
    status: providerResult.status,
    verification_method: providerResult.verificationToken ? "txt" : "manual",
    verification_token: providerResult.verificationToken ?? null,
    verification_instructions: providerResult.dnsRecords,
    dns_records: providerResult.dnsRecords,
    ssl_status: "pending",
    redirect_www: true,
    attached_at: providerResult.status === "active" ? new Date().toISOString() : null,
    last_verified_at: providerResult.status === "active" ? new Date().toISOString() : null,
    removed_at: null,
    metadata: providerResult.metadata || {},
  };

  if (existingDomain) {
    await serviceClient.from("site_domains").update(payload).eq("id", existingDomain.id);
  } else {
    await serviceClient.from("site_domains").insert(payload);
  }

  const { data: domain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("site_id", siteId)
    .eq("hostname", hostname)
    .is("removed_at", null)
    .single();

  await serviceClient.from("domain_verification_events").insert({
    site_domain_id: domain.id,
    site_id: siteId,
    tenant_id: membership.tenant_id,
    event_type: "domain.attach_requested",
    provider: provider.name,
    status: providerResult.status,
    payload: providerResult.metadata || {},
  });

  await serviceClient.from("audit_logs").insert({
    actor_user_id: user.id,
    tenant_id: membership.tenant_id,
    site_id: siteId,
    action: "domain.attach",
    resource_type: "site_domain",
    resource_id: domain.id,
    metadata: {
      hostname,
      provider: provider.name,
    },
  });

  await serviceClient.from("notifications").insert({
    user_id: user.id,
    tenant_id: membership.tenant_id,
    site_id: siteId,
    type: "domain_pending",
    severity: "info",
    title: "Dominio in verifica",
    body: `Configura il DNS per ${hostname} e poi avvia la verifica.`,
    data: {
      hostname,
    },
  });

  if (isPrimary && providerResult.status === "active") {
    await syncPrimaryDomain(serviceClient, siteId, membership.tenant_id, hostname);
  }

  return domain;
}

export async function verifyDomainForSite(siteId: string, domainId: string) {
  const { user, membership, serviceClient } = await requireSiteMembershipForCurrentUser(siteId);
  const { data: domain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("id", domainId)
    .eq("site_id", siteId)
    .single();

  const provider = getDomainProvider();
  const providerResult = await provider.verifyDomain(domain.hostname);

  await serviceClient
    .from("site_domains")
    .update({
      status: providerResult.status,
      verification_instructions: providerResult.dnsRecords,
      dns_records: providerResult.dnsRecords,
      metadata: {
        ...domain.metadata,
        ...(providerResult.metadata || {}),
      },
      last_verified_at: new Date().toISOString(),
      attached_at: providerResult.status === "active" ? new Date().toISOString() : domain.attached_at,
      ssl_status: providerResult.status === "active" ? "active" : "pending",
    })
    .eq("id", domainId);

  await serviceClient.from("domain_verification_events").insert({
    site_domain_id: domainId,
    site_id: siteId,
    tenant_id: membership.tenant_id,
    event_type: "domain.verify",
    provider: provider.name,
    status: providerResult.status,
    payload: providerResult.metadata || {},
  });

  await serviceClient.from("audit_logs").insert({
    actor_user_id: user.id,
    tenant_id: membership.tenant_id,
    site_id: siteId,
    action: "domain.verify",
    resource_type: "site_domain",
    resource_id: domainId,
    metadata: {
      hostname: domain.hostname,
      provider: provider.name,
      status: providerResult.status,
    },
  });

  if (providerResult.status === "active" && domain.is_primary) {
    await syncPrimaryDomain(serviceClient, siteId, membership.tenant_id, domain.hostname);
  }

  return providerResult.status;
}

export async function setPrimaryDomainForSite(siteId: string, domainId: string) {
  const { user, membership, serviceClient } = await requireSiteMembershipForCurrentUser(siteId);
  const { data: domain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("id", domainId)
    .eq("site_id", siteId)
    .is("removed_at", null)
    .single();

  await syncPrimaryDomain(serviceClient, siteId, membership.tenant_id, domain.hostname);

  await serviceClient.from("audit_logs").insert({
    actor_user_id: user.id,
    tenant_id: membership.tenant_id,
    site_id: siteId,
    action: "domain.set_primary",
    resource_type: "site_domain",
    resource_id: domainId,
    metadata: {
      hostname: domain.hostname,
    },
  });
}

export async function removeDomainFromSite(siteId: string, domainId: string) {
  const { user, membership, serviceClient } = await requireSiteMembershipForCurrentUser(siteId);
  const { data: domain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("id", domainId)
    .eq("site_id", siteId)
    .single();

  if (domain.kind === "platform_subdomain") {
    throw new Error("Il sottodominio di default non puo` essere rimosso");
  }

  const provider = getDomainProvider();
  await provider.removeDomain(domain.hostname);

  await serviceClient
    .from("site_domains")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      is_primary: false,
    })
    .eq("id", domainId);

  const { data: fallbackDomain } = await serviceClient
    .from("site_domains")
    .select("*")
    .eq("site_id", siteId)
    .eq("kind", "platform_subdomain")
    .is("removed_at", null)
    .maybeSingle();

  if (domain.is_primary && fallbackDomain) {
    await syncPrimaryDomain(serviceClient, siteId, membership.tenant_id, fallbackDomain.hostname);
  }

  await serviceClient.from("audit_logs").insert({
    actor_user_id: user.id,
    tenant_id: membership.tenant_id,
    site_id: siteId,
    action: "domain.remove",
    resource_type: "site_domain",
    resource_id: domainId,
    metadata: {
      hostname: domain.hostname,
    },
  });
}
