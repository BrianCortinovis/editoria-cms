import { requireSuperAdmin } from "@/lib/superadmin/service";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { UserManagementTable } from "@/components/admin/UserManagementTable";

interface PlatformUser {
  id: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  aiEnabled: boolean;
  createdAt: string;
  siteCount: number;
}

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  const serviceClient = await createServiceRoleClient();

  // Fetch all users
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, email, full_name, first_name, ai_enabled, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch site memberships to count sites per user
  const { data: memberships } = await serviceClient
    .from("tenant_memberships")
    .select("user_id, site_id")
    .is("revoked_at", null);

  const siteCountByUser = new Map<string, number>();
  for (const m of memberships || []) {
    siteCountByUser.set(m.user_id, (siteCountByUser.get(m.user_id) || 0) + 1);
  }

  const users: PlatformUser[] = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    firstName: p.first_name,
    aiEnabled: p.ai_enabled !== false, // default true if column missing/null
    createdAt: p.created_at,
    siteCount: siteCountByUser.get(p.id) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--c-text-2)" }}
        >
          User Management
        </p>
        <h2
          className="mt-1 text-2xl font-semibold tracking-tight"
          style={{ color: "var(--c-text-0)" }}
        >
          Utenti
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--c-text-2)" }}>
          {users.length} utenti registrati sulla piattaforma.
        </p>
      </div>

      <UserManagementTable users={users} />
    </div>
  );
}
