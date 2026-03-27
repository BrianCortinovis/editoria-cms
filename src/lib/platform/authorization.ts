import type { PlatformMembershipRole, TenantMembership } from "@/lib/platform/types";

const SITE_MANAGEMENT_ROLES = new Set<PlatformMembershipRole>(["owner", "admin"]);
const CMS_ACCESS_ROLES = new Set<PlatformMembershipRole>(["owner", "admin", "editor", "viewer"]);

export class PlatformAuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "PlatformAuthorizationError";
  }
}

export function isActiveMembership(
  membership: TenantMembership | null | undefined,
): membership is TenantMembership {
  return Boolean(membership && !membership.revokedAt);
}

export function canReadSite(role: PlatformMembershipRole): boolean {
  return CMS_ACCESS_ROLES.has(role);
}

export function canOpenCms(role: PlatformMembershipRole): boolean {
  return CMS_ACCESS_ROLES.has(role);
}

export function canManageSite(role: PlatformMembershipRole): boolean {
  return SITE_MANAGEMENT_ROLES.has(role);
}

export function canManageDomains(role: PlatformMembershipRole): boolean {
  return SITE_MANAGEMENT_ROLES.has(role);
}

export function canManageMembers(role: PlatformMembershipRole): boolean {
  return SITE_MANAGEMENT_ROLES.has(role);
}

export function canManageBilling(role: PlatformMembershipRole): boolean {
  return role === "owner";
}

export function assertSiteMembership(
  membership: TenantMembership | null | undefined,
  allowedRoles?: readonly PlatformMembershipRole[],
): TenantMembership {
  if (!isActiveMembership(membership)) {
    throw new PlatformAuthorizationError("Site membership not found");
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  return membership;
}
