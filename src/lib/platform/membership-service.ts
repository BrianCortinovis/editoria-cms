import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { PlatformAuthorizationError } from "@/lib/platform/authorization";
import { mapPlatformRoleToCmsRole } from "@/lib/platform/site-service";
import type { PlatformMembershipRole } from "@/lib/platform/types";

export interface SiteMemberRecord {
  membershipId: string;
  siteId: string;
  tenantId: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  role: PlatformMembershipRole;
  joinedAt: string | null;
  lastAccessedAt: string | null;
  revokedAt: string | null;
  isCurrentUser: boolean;
}

const roleWeight: Record<PlatformMembershipRole, number> = {
  owner: 0,
  admin: 1,
  editor: 2,
  viewer: 3,
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function canManageTarget(
  managerRole: PlatformMembershipRole,
  targetRole: PlatformMembershipRole,
  nextRole?: PlatformMembershipRole,
): boolean {
  if (managerRole === "owner") {
    return true;
  }

  if (managerRole !== "admin") {
    return false;
  }

  if (targetRole === "owner") {
    return false;
  }

  if (nextRole === "owner") {
    return false;
  }

  return true;
}

async function countActiveOwners(
  serviceClient: Awaited<ReturnType<typeof createServiceRoleClient>>,
  siteId: string,
) {
  const { count } = await serviceClient
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("role", "owner")
    .is("revoked_at", null);

  return count ?? 0;
}

export async function requirePlatformSiteManager(siteId: string) {
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

  return { user, membership, serviceClient };
}

export async function requirePlatformSiteReader(siteId: string) {
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

  return { user, membership, serviceClient };
}

export async function listSiteMembersForCurrentUser(siteId: string): Promise<SiteMemberRecord[]> {
  const { user, serviceClient } = await requirePlatformSiteReader(siteId);

  const { data: memberships, error } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("site_id", siteId)
    .is("revoked_at", null)
    .order("created_at", { ascending: true });

  if (error || !memberships) {
    throw new Error(error?.message || "Unable to load memberships");
  }

  const userIds = memberships.map((membership) => membership.user_id);
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profilesByUserId = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return memberships
    .map((membership) => {
      const profile = profilesByUserId.get(membership.user_id);
      return {
        membershipId: membership.id,
        siteId: membership.site_id,
        tenantId: membership.tenant_id,
        userId: membership.user_id,
        email: profile?.email ?? membership.invited_email,
        fullName: profile?.full_name ?? null,
        role: membership.role,
        joinedAt: membership.joined_at,
        lastAccessedAt: membership.last_accessed_at,
        revokedAt: membership.revoked_at,
        isCurrentUser: membership.user_id === user.id,
      };
    })
    .sort((left: SiteMemberRecord, right: SiteMemberRecord) => {
      const byRole = roleWeight[left.role] - roleWeight[right.role];
      if (byRole !== 0) {
        return byRole;
      }
      return (left.fullName || left.email || left.userId).localeCompare(right.fullName || right.email || right.userId);
    });
}

export async function addSiteMemberForCurrentUser(input: {
  siteId: string;
  email: string;
  role: PlatformMembershipRole;
}) {
  const { user, membership: currentMembership, serviceClient } = await requirePlatformSiteManager(input.siteId);
  const email = normalizeEmail(input.email);

  if (!canManageTarget(currentMembership.role, input.role, input.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (!profile) {
    throw new Error("L'utente deve avere gia` un account registrato in piattaforma");
  }

  const { data: existingMembership } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("site_id", input.siteId)
    .eq("user_id", profile.id)
    .maybeSingle();

  let finalMembershipId = existingMembership?.id ?? null;
  if (existingMembership && !existingMembership.revoked_at) {
    throw new Error("Questo utente fa gia` parte del team");
  }

  if (existingMembership && existingMembership.revoked_at) {
    const { error: restoreError } = await serviceClient
      .from("tenant_memberships")
      .update({
        role: input.role,
        invited_email: null,
        invited_by: user.id,
        joined_at: new Date().toISOString(),
        revoked_at: null,
        last_accessed_at: existingMembership.last_accessed_at,
      })
      .eq("id", existingMembership.id);

    if (restoreError) {
      throw new Error(restoreError.message);
    }
  } else {
    const { data: insertedMembership, error: insertError } = await serviceClient
      .from("tenant_memberships")
      .insert({
        tenant_id: currentMembership.tenant_id,
        site_id: input.siteId,
        user_id: profile.id,
        role: input.role,
        invited_email: null,
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !insertedMembership) {
      throw new Error(insertError?.message || "Unable to create membership");
    }

    finalMembershipId = insertedMembership.id;
  }

  const { error: cmsMembershipError } = await serviceClient
    .from("user_tenants")
    .upsert({
      user_id: profile.id,
      tenant_id: currentMembership.tenant_id,
      role: mapPlatformRoleToCmsRole(input.role),
    }, { onConflict: "user_id,tenant_id" });

  if (cmsMembershipError) {
    throw new Error(cmsMembershipError.message);
  }

  return {
    membershipId: finalMembershipId,
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: input.role,
  };
}

export async function updateSiteMemberRoleForCurrentUser(input: {
  siteId: string;
  membershipId: string;
  role: PlatformMembershipRole;
}) {
  const { membership: currentMembership, serviceClient } = await requirePlatformSiteManager(input.siteId);
  const { data: targetMembership } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("id", input.membershipId)
    .eq("site_id", input.siteId)
    .is("revoked_at", null)
    .maybeSingle();

  if (!targetMembership) {
    throw new Error("Membership non trovata");
  }

  if (!canManageTarget(currentMembership.role, targetMembership.role, input.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  if (targetMembership.role === "owner" && input.role !== "owner") {
    const ownerCount = await countActiveOwners(serviceClient, input.siteId);
    if (ownerCount <= 1) {
      throw new Error("Serve almeno un owner attivo sul sito");
    }
  }

  const { error: updateError } = await serviceClient
    .from("tenant_memberships")
    .update({ role: input.role })
    .eq("id", targetMembership.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: cmsMembershipError } = await serviceClient
    .from("user_tenants")
    .update({ role: mapPlatformRoleToCmsRole(input.role) })
    .eq("user_id", targetMembership.user_id)
    .eq("tenant_id", targetMembership.tenant_id);

  if (cmsMembershipError) {
    throw new Error(cmsMembershipError.message);
  }
}

export async function revokeSiteMemberForCurrentUser(input: {
  siteId: string;
  membershipId: string;
}) {
  const { membership: currentMembership, serviceClient } = await requirePlatformSiteManager(input.siteId);
  const { data: targetMembership } = await serviceClient
    .from("tenant_memberships")
    .select("*")
    .eq("id", input.membershipId)
    .eq("site_id", input.siteId)
    .is("revoked_at", null)
    .maybeSingle();

  if (!targetMembership) {
    throw new Error("Membership non trovata");
  }

  if (!canManageTarget(currentMembership.role, targetMembership.role)) {
    throw new PlatformAuthorizationError("Role not permitted for this action");
  }

  if (targetMembership.role === "owner") {
    const ownerCount = await countActiveOwners(serviceClient, input.siteId);
    if (ownerCount <= 1) {
      throw new Error("Non puoi rimuovere l'ultimo owner del sito");
    }
  }

  const { error: revokeError } = await serviceClient
    .from("tenant_memberships")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", targetMembership.id);

  if (revokeError) {
    throw new Error(revokeError.message);
  }

  const { error: cmsMembershipError } = await serviceClient
    .from("user_tenants")
    .delete()
    .eq("user_id", targetMembership.user_id)
    .eq("tenant_id", targetMembership.tenant_id);

  if (cmsMembershipError) {
    throw new Error(cmsMembershipError.message);
  }
}
