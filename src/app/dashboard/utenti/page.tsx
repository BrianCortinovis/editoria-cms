"use client";

import { useEffect, useState, useCallback } from "react";
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

const roleConfig: Record<UserRole, { label: string; color: string; icon: typeof Crown; description: string }> = {
  super_admin: { label: "Super Admin", color: "bg-red-100 text-red-700", icon: Crown, description: "Accesso totale, gestione utenti e configurazione" },
  chief_editor: { label: "Caporedattore", color: "bg-purple-100 text-purple-700", icon: Shield, description: "Approva/rifiuta articoli, gestisce le sezioni" },
  editor: { label: "Redattore", color: "bg-blue-100 text-blue-700", icon: Pencil, description: "Crea e modifica articoli, invia per approvazione" },
  contributor: { label: "Collaboratore", color: "bg-gray-100 text-gray-700", icon: UserCircle, description: "Solo bozze, nessuna pubblicazione diretta" },
  advertiser: { label: "Commerciale", color: "bg-orange-100 text-orange-700", icon: Users, description: "Gestisce banner pubblicitari e statistiche" },
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

  const isAdmin = currentRole === "super_admin";

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
          role: d.role,
          created_at: d.created_at,
          profile: d.profiles,
        }))
      );
    }
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { load(); }, [load]);

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
        <p className="text-sm text-gray-500">{members.length} membr{members.length === 1 ? "o" : "i"} nella redazione</p>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition"
          >
            <Plus className="w-4 h-4" /> Aggiungi Membro
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Aggiungi membro alla redazione</h3>
            <button onClick={() => setShowInvite(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700">L&apos;utente deve essersi già registrato con il magic link. Inserisci la sua email.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Email dell&apos;utente</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="redattore@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Ruolo</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
              >
                {(Object.keys(roleConfig) as UserRole[]).map(r => (
                  <option key={r} value={r}>{roleConfig[r].label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{roleConfig[inviteRole].description}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Annulla</button>
            <button onClick={handleInvite} disabled={inviting}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] text-white text-sm font-semibold rounded-lg hover:bg-[#6d0000] transition disabled:opacity-50">
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
            <div key={r} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-700">{cfg.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{cfg.description.split(",")[0]}</p>
            </div>
          );
        })}
      </div>

      {/* Members list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Caricamento...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nessun membro</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map(member => {
              const cfg = roleConfig[member.role];
              const isMe = member.user_id === user?.id;
              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 uppercase shrink-0 overflow-hidden">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || "?"
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {member.profile?.full_name || "—"}
                      {isMe && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Tu</span>}
                    </p>
                    <p className="text-xs text-gray-400">{member.profile?.email}</p>
                  </div>

                  {/* Role */}
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        className="px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
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
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-xs text-gray-400 hidden md:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(member.created_at).toLocaleDateString("it-IT")}
                  </span>

                  {/* Actions */}
                  {isAdmin && !isMe && editingId !== member.id && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingId(member.id); setEditRole(member.role); }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      <button onClick={() => handleRemove(member)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50">
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
