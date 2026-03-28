"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Plus,
  Users,
  Shield,
  Trash2,
  X,
  Check,
  Mail,
  UserCircle,
  Crown,
  Pencil,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { normalizeCmsRole } from "@/lib/cms/roles";
import AIButton from "@/components/ai/AIButton";

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

export default function UtentiPage() {
  const { currentTenant, currentRole, user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("editor");

  // Invite form
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          role: normalizeCmsRole(d.role) ?? "contributor",
          created_at: d.created_at,
          profile: d.profiles,
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

    // Check if user exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", inviteEmail.trim())
      .single();

    if (!existingProfile) {
      toast.error("Utente non trovato. L'utente deve prima registrarsi con magic link.");
      setInviting(false);
      return;
    }

    // Check if already member
    const { data: existingMember } = await supabase
      .from("user_tenants")
      .select("id")
      .eq("tenant_id", currentTenant.id)
      .eq("user_id", existingProfile.id)
      .single();

    if (existingMember) {
      toast.error("Questo utente è già membro della redazione");
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
      load();
    }
    setInviting(false);
  };

  const handleUpdateRole = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_tenants")
      .update({ role: editRole })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ruolo aggiornato");
      setEditingId(null);
      load();
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (member.user_id === user?.id) {
      toast.error("Non puoi rimuovere te stesso");
      return;
    }
    if (!confirm(`Rimuovere ${member.profile?.full_name || member.profile?.email} dalla redazione?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from("user_tenants").delete().eq("id", member.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Membro rimosso");
      setMembers(prev => prev.filter(m => m.id !== member.id));
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{members.length} membr{members.length === 1 ? "o" : "i"} nella redazione</p>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "team-structure",
                label: "Ruoli redazione",
                prompt: "Analizza team, ruoli e distribuzione della redazione. Suggerisci struttura, permessi, ruoli mancanti e workflow piu` adatto al sito: {context}",
              },
              {
                id: "team-access-audit",
                label: "Audit accessi",
                prompt: "Controlla accessi, ruoli e rischi organizzativi del team CMS. Evidenzia dove limitare permessi, creare ruoli o separare funzioni: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                currentRole,
                members,
              },
              null,
              2,
            )}
          />
          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
            >
              <Plus className="w-4 h-4" /> Aggiungi Membro
            </button>
          )}
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Aggiungi membro alla redazione</h3>
            <button onClick={() => setShowInvite(false)}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(var(--c-warning-rgb, 234,179,8), 0.1)", border: "1px solid var(--c-warning)" }}>
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--c-warning)" }} />
            <p className="text-xs" style={{ color: "var(--c-warning)" }}>L&apos;utente deve essersi già registrato con il magic link. Inserisci la sua email.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Email dell&apos;utente</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="redattore@email.com"
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Ruolo</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
              >
                {(Object.keys(roleConfig) as UserRole[]).map(r => (
                  <option key={r} value={r}>{roleConfig[r].label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--c-text-3)" }}>{roleConfig[inviteRole].description}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm font-medium rounded-lg transition" style={{ color: "var(--c-text-2)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Annulla</button>
            <button onClick={handleInvite} disabled={inviting}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}>
              <Check className="w-4 h-4" /> Aggiungi
            </button>
          </div>
        </div>
      )}

      {/* Roles legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        {(Object.keys(roleConfig) as UserRole[]).map(r => {
          const cfg = roleConfig[r];
          const Icon = cfg.icon;
          return (
            <div key={r} className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--c-text-3)" }} />
              <p className="text-[11px] font-semibold" style={{ color: "var(--c-text-1)" }}>{cfg.label}</p>
              <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: "var(--c-text-3)" }}>{cfg.description.split(",")[0]}</p>
            </div>
          );
        })}
      </div>

      {/* Members list */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun membro</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {members.map(member => {
              const cfg = roleConfig[member.role];
              const isMe = member.user_id === user?.id;
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4 transition"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0 overflow-hidden" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                    {member.profile?.avatar_url ? (
                      <Image src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" width={40} height={40} unoptimized />
                    ) : (
                      member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || "?"
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--c-text-0)" }}>
                      {member.profile?.full_name || "—"}
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>Tu</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--c-text-3)" }}>{member.profile?.email}</p>
                  </div>

                  {/* Role */}
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        className="px-2 py-1 rounded text-xs focus:outline-none focus:ring-1"
                        style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                      >
                        {(Object.keys(roleConfig) as UserRole[]).map(r => (
                          <option key={r} value={r}>{roleConfig[r].label}</option>
                        ))}
                      </select>
                      <button onClick={() => handleUpdateRole(member.id)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-green-100 text-green-600 hover:bg-green-200">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="w-7 h-7 flex items-center justify-center rounded" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.fg }}>
                      {cfg.label}
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-xs hidden md:flex items-center gap-1" style={{ color: "var(--c-text-3)" }}>
                    <Clock className="w-3 h-3" />
                    {new Date(member.created_at).toLocaleDateString("it-IT")}
                  </span>

                  {/* Actions */}
                  {isAdmin && !isMe && editingId !== member.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(member.id); setEditRole(member.role); }}
                        className="w-7 h-7 flex items-center justify-center rounded"
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                      </button>
                      <button onClick={() => handleRemove(member)}
                        className="w-7 h-7 flex items-center justify-center rounded transition"
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
