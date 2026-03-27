export const PLATFORM_MEMBERSHIP_ROLES = ["owner", "admin", "editor", "viewer"] as const;

export type PlatformMembershipRole = (typeof PLATFORM_MEMBERSHIP_ROLES)[number];

export const SITE_STATUSES = ["provisioning", "active", "suspended", "archived", "deleted"] as const;

export type SiteStatus = (typeof SITE_STATUSES)[number];

export const DOMAIN_STATUSES = ["pending", "verifying", "active", "failed", "removed"] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const DOMAIN_KINDS = ["platform_subdomain", "custom", "redirect"] as const;

export type DomainKind = (typeof DOMAIN_KINDS)[number];

export interface PlatformProfile {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  notificationPreferences: Record<string, unknown>;
  securityPreferences: Record<string, unknown>;
}

export interface PlatformSite {
  id: string;
  tenantId: string;
  ownerUserId: string;
  name: string;
  slug: string;
  defaultSubdomain: string;
  cmsBasePath: string;
  status: SiteStatus;
  templateKey: string | null;
  languageCode: string;
  category: string | null;
  onboardingState: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  siteId: string;
  userId: string;
  role: PlatformMembershipRole;
  joinedAt: string | null;
  lastAccessedAt: string | null;
  revokedAt: string | null;
}

export interface SiteDomain {
  id: string;
  siteId: string;
  tenantId: string;
  hostname: string;
  kind: DomainKind;
  isPrimary: boolean;
  status: DomainStatus;
  verificationMethod: "txt" | "cname" | "http" | "manual";
  verificationToken: string | null;
  dnsRecords: Array<Record<string, unknown>>;
  verificationInstructions: Array<Record<string, unknown>>;
  sslStatus: string;
  redirectWww: boolean;
  attachedAt: string | null;
  lastVerifiedAt: string | null;
  removedAt: string | null;
}

export interface PlatformResolvedHost {
  hostname: string;
  siteId: string | null;
  tenantId: string;
  siteSlug: string | null;
  siteName: string | null;
  isPrimaryDomain: boolean;
  source: "site_domains" | "legacy_tenant_domain";
}

export interface CmsBridgeClaims {
  userId: string;
  siteId: string;
  tenantId: string;
  role: PlatformMembershipRole;
  destination?: string;
  nonce?: string;
}
