import { getUserProfile, getUserTenants, requireAuth } from "@/lib/auth";
import type { Tables, UserRole } from "@/types/database";

export interface ClientTenantMembership extends Tables<"tenants"> {
  role: UserRole;
}

export interface InitialAuthPayload {
  user: {
    id: string;
    email: string;
  };
  profile: Tables<"profiles"> | null;
  tenants: ClientTenantMembership[];
}

export async function getInitialAuthPayload(): Promise<InitialAuthPayload> {
  const user = await requireAuth();

  const [profile, tenants] = await Promise.all([
    getUserProfile(user.id),
    getUserTenants(user.id),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
    },
    profile,
    tenants,
  };
}
