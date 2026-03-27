"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MailPlus, Trash2, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import { PLATFORM_MEMBERSHIP_ROLES } from "@/lib/platform/types";

type MemberRole = (typeof PLATFORM_MEMBERSHIP_ROLES)[number];

interface SiteMemberRecord {
  membershipId: string;
  siteId: string;
  tenantId: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  role: MemberRole;
  joinedAt: string | null;
  lastAccessedAt: string | null;
  revokedAt: string | null;
  isCurrentUser: boolean;
}

const roleLabels: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function SiteMembersManager({
  siteId,
  canManage,
}: {
  siteId: string;
  canManage: boolean;
}) {
  const [members, setMembers] = useState<SiteMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");

  const currentUserRole = useMemo(
    () => members.find((member) => member.isCurrentUser)?.role ?? null,
    [members],
  );

  const roleOptions = useMemo(() => {
    if (!canManage) {
      return ["viewer"] as const;
    }

    if (currentUserRole === "owner") {
      return PLATFORM_MEMBERSHIP_ROLES;
    }

    return PLATFORM_MEMBERSHIP_ROLES.filter((option) => option !== "owner");
  }, [canManage, currentUserRole]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/platform/sites/${siteId}/members`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load team");
      }
      setMembers(Array.isArray(payload.members) ? payload.members : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore caricamento team");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const addMember = async () => {
    if (!canManage || !email.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/platform/sites/${siteId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to add member");
      }

      toast.success("Operatore aggiunto al team");
      setEmail("");
      setRole("editor");
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore aggiunta membro");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (membershipId: string, nextRole: MemberRole) => {
    if (!canManage) {
      return;
    }

    try {
      const response = await fetch(`/api/platform/sites/${siteId}/members/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update role");
      }

      toast.success("Ruolo aggiornato");
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore aggiornamento ruolo");
    }
  };

  const removeMember = async (membershipId: string) => {
    if (!canManage) {
      return;
    }

    try {
      const response = await fetch(`/api/platform/sites/${siteId}/members/${membershipId}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to remove member");
      }

      toast.success("Operatore rimosso");
      await loadMembers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore rimozione membro");
    }
  };

  return (
    <div className="space-y-5">
      {canManage ? (
        <div className="rounded-[2rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                Email operatore
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="operatore@redazione.it"
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              />
            </div>
            <div className="w-full lg:max-w-[220px]">
              <label className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                Ruolo
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as MemberRole)}
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {roleLabels[option]}
                  </option>
                ))}
              </select>
            </div>
          <div className="flex items-end">
              <button
                type="button"
                onClick={addMember}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--c-accent)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                Aggiungi operatore
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[2rem] border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-6 text-sm" style={{ color: "var(--c-text-2)" }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Caricamento team...
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead style={{ background: "var(--c-bg-2)" }}>
              <tr>
                <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--c-text-2)" }}>Operatore</th>
                <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--c-text-2)" }}>Ruolo</th>
                <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--c-text-2)" }}>Ultimo accesso</th>
                <th className="px-5 py-3 text-left font-medium" style={{ color: "var(--c-text-2)" }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membershipId} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <div className="font-medium" style={{ color: "var(--c-text-0)" }}>
                        {member.fullName || member.email || member.userId}
                        {member.isCurrentUser ? " (tu)" : ""}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>
                        {member.email || member.userId}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {canManage && !member.isCurrentUser ? (
                      <select
                        value={member.role}
                        onChange={(event) => void updateRole(member.membershipId, event.target.value as MemberRole)}
                        className="rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                      >
                        {roleOptions.map((option) => (
                          <option key={option} value={option}>
                            {roleLabels[option]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: "var(--c-text-1)" }}>{roleLabels[member.role]}</span>
                    )}
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--c-text-2)" }}>
                    {member.lastAccessedAt ? new Date(member.lastAccessedAt).toLocaleString("it-IT") : "Mai"}
                  </td>
                  <td className="px-5 py-4">
                    {canManage && !member.isCurrentUser ? (
                      <button
                        type="button"
                        onClick={() => void removeMember(member.membershipId)}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-danger)", background: "var(--c-bg-2)" }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Rimuovi
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs" style={{ color: "var(--c-text-2)" }}>
                        <UserCog className="h-4 w-4" />
                        Protetto
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
