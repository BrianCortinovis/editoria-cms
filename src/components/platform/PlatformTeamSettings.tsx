"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { normalizeCmsRole } from "@/lib/cms/roles";
import type { UserRole } from "@/types/database";
import AIButton from "@/components/ai/AIButton";
import { AlertTriangle, Check, Clock, Crown, Mail, Pencil, Plus, Shield, Trash2, UserCircle, Users, X } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profile: {
    email: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

const roleConfig: Record<UserRole, { label: string; bg: string; fg: string; icon: typeof Crown; description: string }> = {
  admin: { label: "Admin", bg: "rgba(239,68,68,0.12)", fg: "#ef4444", icon: Crown, description: "Accesso totale, gestione utenti e configurazione" },
  chief_editor: { label: "Caporedattore", bg: "rgba(168,85,247,0.12)", fg: "#a855f7", icon: Shield, description: "Approva/rifiuta articoli, gestisce le sezioni" },
  editor: { label: "Redattore", bg: "rgba(56,189,248,0.12)", fg: "#38bdf8", icon: Pencil, description: "Crea e modifica articoli, invia per approvazione" },
  contributor: { label: "Collaboratore", bg: "var(--c-bg-3)", fg: "var(--c-text-2)", icon: UserCircle, description: "Solo bozze, nessuna pubblicazione diretta" },
  advertiser: { label: "Commerciale", bg: "rgba(251,146,60,0.12)", fg: "#fb923c", icon: Users, description: "Gestisce banner pubblicitari e statistiche" },
};

export function PlatformTeamSettings() {
  const { currentTenant, currentRole, user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("editor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("editor");
  const [inviting, setInviting] = useState(false);
  const isAdmin = currentRole === "admin";

  const load = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("user_tenants")
      .select("id, user_id, role, created_at, profiles(email, full_name, avatar_url, bio)")
      .eq("tenant_id", currentTenant.id)
      .order("created_at");

    if (data) {
      setMembers(
        data.map((item) => ({
          id: item.id,
          user_id: item.user_id,
          role: normalizeCmsRole(item.role) ?? "contributor",
          created_at: item.created_at,
          profile: item.profiles as unknown as TeamMember["profile"],
        }))
      );
    }
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const handleInvite = async () => {
    if (!currentTenant || !inviteEmail.trim()) {
      toast.error("Email obbligatoria");
      return;
    }
    setInviting(true);
    const supabase = createClient();

    const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", inviteEmail.trim()).single();
    if (!existingProfile) {
      toast.error("Utente non trovato. Deve prima registrarsi con magic link.");
      setInviting(false);
      return;
    }

    const { data: existingMember } = await supabase
      .from("user_tenants")
      .select("id")
      .eq("tenant_id", currentTenant.id)
      .eq("user_id", existingProfile.id)
      .single();

    if (existingMember) {
      toast.error("Questo utente è già membro del team");
      setInviting(false);
      return;
    }

    const { error } = await supabase.from("user_tenants").insert({
      tenant_id: currentTenant.id,
      user_id: existingProfile.id,
      role: inviteRole,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${inviteEmail} aggiunto come ${roleConfig[inviteRole].label}`);
      setInviteEmail("");
      setShowInvite(false);
      void load();
    }
    setInviting(false);
  };

  const handleUpdateRole = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("user_tenants").update({ role: editRole }).eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ruolo aggiornato");
      setEditingId(null);
      void load();
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (member.user_id === user?.id) {
      toast.error("Non puoi rimuovere te stesso");
      return;
    }
    if (!confirm(`Rimuovere ${member.profile?.full_name || member.profile?.email} dal team?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from("user_tenants").delete().eq("id", member.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Membro rimosso");
      setMembers((prev) => prev.filter((item) => item.id !== member.id));
    }
  };

  if (!currentTenant) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Seleziona un tenant attivo per gestire il team.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Solo gli Admin possono gestire il team nel profilo platform.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Team del tenant
          </h3>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            La gestione ruoli e membri è configurazione organizzativa del tenant, quindi vive nel profilo platform e non nella sidebar del CMS operativo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "team-structure",
                label: "Ruoli team",
                prompt: "Analizza team, ruoli e distribuzione della redazione. Suggerisci struttura, permessi, ruoli mancanti e workflow piu` adatto al sito: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                members,
              },
              null,
              2
            )}
          />
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--c-accent)" }}
          >
            <Plus className="h-4 w-4" />
            Aggiungi membro
          </button>
        </div>
      </div>

      {showInvite ? (
        <div className="rounded-2xl border p-5" style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Aggiungi membro al tenant
            </h4>
            <button onClick={() => setShowInvite(false)}>
              <X className="h-4 w-4" style={{ color: "var(--c-text-3)" }} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3 rounded-lg px-3 py-2" style={{ background: "rgba(var(--c-warning-rgb, 234,179,8), 0.1)", border: "1px solid var(--c-warning)" }}>
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--c-warning)" }} />
            <p className="text-xs" style={{ color: "var(--c-warning)" }}>
              L&apos;utente deve essersi già registrato con il magic link. Inserisci la sua email.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Email utente
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--c-text-3)" }} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="redattore@email.com"
                  className="w-full rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Ruolo
              </label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as UserRole)}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
              >
                {(Object.keys(roleConfig) as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {roleConfig[role].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--c-text-3)" }}>
            {roleConfig[inviteRole].description}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowInvite(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{ color: "var(--c-text-2)" }}
            >
              Annulla
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
            >
              <Check className="h-4 w-4" />
              {inviting ? "Invio..." : "Aggiungi"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(Object.keys(roleConfig) as UserRole[]).map((role) => {
          const cfg = roleConfig[role];
          const Icon = cfg.icon;
          return (
            <div key={role} className="rounded-xl px-3 py-2 text-center" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
              <Icon className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--c-text-3)" }} />
              <p className="text-[11px] font-semibold" style={{ color: "var(--c-text-1)" }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun membro</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {members.map((member) => {
              const cfg = roleConfig[member.role];
              const isMe = member.user_id === user?.id;
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold uppercase" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                    {member.profile?.avatar_url ? (
                      <Image src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" width={40} height={40} unoptimized />
                    ) : (
                      member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || "?"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
                      {member.profile?.full_name || "—"}
                      {isMe ? (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                          Tu
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs" style={{ color: "var(--c-text-3)" }}>{member.profile?.email}</p>
                  </div>

                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editRole}
                        onChange={(event) => setEditRole(event.target.value as UserRole)}
                        className="rounded px-2 py-1 text-xs focus:outline-none focus:ring-1"
                        style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                      >
                        {(Object.keys(roleConfig) as UserRole[]).map((role) => (
                          <option key={role} value={role}>{roleConfig[role].label}</option>
                        ))}
                      </select>
                      <button onClick={() => handleUpdateRole(member.id)} className="flex h-7 w-7 items-center justify-center rounded bg-green-100 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex h-7 w-7 items-center justify-center rounded" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: cfg.bg, color: cfg.fg }}>
                      {cfg.label}
                    </span>
                  )}

                  <span className="hidden items-center gap-1 text-xs md:flex" style={{ color: "var(--c-text-3)" }}>
                    <Clock className="h-3 w-3" />
                    {new Date(member.created_at).toLocaleDateString("it-IT")}
                  </span>

                  {isAdmin && !isMe && editingId !== member.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(member.id); setEditRole(member.role); }} className="flex h-7 w-7 items-center justify-center rounded">
                        <Pencil className="h-3.5 w-3.5" style={{ color: "var(--c-text-3)" }} />
                      </button>
                      <button onClick={() => handleRemove(member)} className="flex h-7 w-7 items-center justify-center rounded transition">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
