import type { UserRole } from "@/types/database";

const CMS_ROLES = new Set<UserRole>(["admin", "chief_editor", "editor", "contributor", "advertiser"]);

export function normalizeCmsRole(role: string | null | undefined): UserRole | null {
  if (role === "super_admin") {
    return "admin";
  }

  if (role && CMS_ROLES.has(role as UserRole)) {
    return role as UserRole;
  }

  return null;
}

export function hasCmsRole(role: string | null | undefined, allowedRoles: Set<string>) {
  const normalizedRole = normalizeCmsRole(role);
  return Boolean(normalizedRole && allowedRoles.has(normalizedRole));
}
