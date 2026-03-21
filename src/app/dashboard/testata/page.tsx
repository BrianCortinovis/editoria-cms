"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Save, Building2, Loader2, Users, Plus, X, Edit2 } from "lucide-react";

export default function TestataPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const isAdmin = currentRole === "super_admin" || currentRole === "chief_editor";

  // Dati testata
  const [ragioneSociale, setRagioneSociale] = useState("");
  const [partitaIva, setPartitaIva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [citta, setCitta] = useState("");
  const [cap, setCap] = useState("");
  const [provincia, setProvincia] = useState("");
  const [nazione, setNazione] = useState("IT");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [pec, setPec] = useState("");
  const [sdi, setSdi] = useState("");

  // Dati editoriali
  const [direttoreResponsabile, setDirettoreResponsabile] = useState("");
  const [registroTribunale, setRegistroTribunale] = useState("");
  const [numRegistro, setNumRegistro] = useState("");
  const [dataRegistro, setDataRegistro] = useState("");
  const [editore, setEditore] = useState("");
  const [iscrRoc, setIscrRoc] = useState("");
  const [tipologia, setTipologia] = useState("quotidiano_online");

  // Team members
  type TeamMember = {
    id: string;
    nome: string;
    email: string;
    ruolo: 'giornalista' | 'editor' | 'videomaker' | 'operatore';
  };
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Omit<TeamMember, 'id'>>({ nome: '', email: '', ruolo: 'giornalista' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTenant) return;
    const s = (currentTenant.settings ?? {}) as Record<string, any>;
    setRagioneSociale(s.ragione_sociale ?? "");
    setPartitaIva(s.partita_iva ?? "");
    setCodiceFiscale(s.codice_fiscale ?? "");
    setIndirizzo(s.indirizzo ?? "");
    setCitta(s.citta ?? "");
    setCap(s.cap ?? "");
    setProvincia(s.provincia ?? "");
    setNazione(s.nazione ?? "IT");
    setTelefono(s.telefono ?? "");
    setEmail(s.email_testata ?? "");
    setPec(s.pec ?? "");
    setSdi(s.sdi ?? "");
    setDirettoreResponsabile(s.direttore_responsabile ?? "");
    setRegistroTribunale(s.registro_tribunale ?? "");
    setNumRegistro(s.num_registro ?? "");
    setDataRegistro(s.data_registro ?? "");
    setEditore(s.editore ?? "");
    setIscrRoc(s.iscr_roc ?? "");
    setTipologia(s.tipologia ?? "quotidiano_online");
    setTeamMembers(s.team_members ?? []);
  }, [currentTenant]);

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();
    const existingSettings = (currentTenant.settings ?? {}) as Record<string, unknown>;

    const { error } = await supabase.from("tenants").update({
      settings: {
        ...existingSettings,
        ragione_sociale: ragioneSociale, partita_iva: partitaIva, codice_fiscale: codiceFiscale,
        indirizzo, citta, cap, provincia, nazione, telefono, email_testata: email, pec, sdi,
        direttore_responsabile: direttoreResponsabile, registro_tribunale: registroTribunale,
        num_registro: numRegistro, data_registro: dataRegistro, editore,
        iscr_roc: iscrRoc, tipologia,
        team_members: teamMembers,
      },
    }).eq("id", currentTenant.id);

    if (error) toast.error(error.message);
    else toast.success("Scheda testata salvata");
    setSaving(false);
  };

  const handleAddMember = () => {
    if (!newMember.nome || !newMember.email) {
      toast.error("Nome e email obbligatori");
      return;
    }
    if (editingId) {
      setTeamMembers(teamMembers.map(m => m.id === editingId ? { ...newMember, id: editingId } : m));
      toast.success("Membro aggiornato");
      setEditingId(null);
    } else {
      setTeamMembers([...teamMembers, { id: Date.now().toString(), ...newMember }]);
      toast.success("Membro aggiunto");
    }
    setNewMember({ nome: '', email: '', ruolo: 'giornalista' });
    setShowAddMember(false);
  };

  const handleEditMember = (member: typeof teamMembers[0]) => {
    setNewMember(member);
    setEditingId(member.id);
    setShowAddMember(true);
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    toast.success("Membro rimosso");
  };

  const Field = ({ label, value, onChange, placeholder, span2, type }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; span2?: boolean; type?: string;
  }) => (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="input w-full mt-1" readOnly={!isAdmin} />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Dati Fiscali */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Dati Fiscali & Societari
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Ragione Sociale" value={ragioneSociale} onChange={setRagioneSociale} placeholder="Es: Val Brembana Web S.r.l." span2 />
          <Field label="Partita IVA" value={partitaIva} onChange={setPartitaIva} placeholder="01234567890" />
          <Field label="Codice Fiscale" value={codiceFiscale} onChange={setCodiceFiscale} placeholder="01234567890" />
          <Field label="Indirizzo" value={indirizzo} onChange={setIndirizzo} placeholder="Via Roma, 1" span2 />
          <Field label="Città" value={citta} onChange={setCitta} placeholder="San Pellegrino Terme" />
          <Field label="CAP" value={cap} onChange={setCap} placeholder="24016" />
          <Field label="Provincia" value={provincia} onChange={setProvincia} placeholder="BG" />
          <Field label="Nazione" value={nazione} onChange={setNazione} placeholder="IT" />
          <Field label="Telefono" value={telefono} onChange={setTelefono} placeholder="+39 0345..." />
          <Field label="Email" value={email} onChange={setEmail} placeholder="info@testata.it" type="email" />
          <Field label="PEC" value={pec} onChange={setPec} placeholder="testata@pec.it" type="email" />
          <Field label="Codice SDI" value={sdi} onChange={setSdi} placeholder="XXXXXXX" />
        </div>
      </div>

      {/* Dati Editoriali */}
      <div className="card">
        <div className="card-header">Dati Editoriali & Registrazione</div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Direttore Responsabile" value={direttoreResponsabile} onChange={setDirettoreResponsabile} placeholder="Nome Cognome" span2 />
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Tipologia testata</label>
            <select value={tipologia} onChange={e => setTipologia(e.target.value)} className="input w-full mt-1" disabled={!isAdmin}>
              <option value="quotidiano_online">Quotidiano online</option>
              <option value="periodico_online">Periodico online</option>
              <option value="testata_giornalistica">Testata giornalistica registrata</option>
              <option value="blog_informativo">Blog informativo</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <Field label="Editore" value={editore} onChange={setEditore} placeholder="Società editrice" span2 />
          <Field label="Tribunale di registrazione" value={registroTribunale} onChange={setRegistroTribunale} placeholder="Es: Tribunale di Bergamo" />
          <Field label="Numero registro stampa" value={numRegistro} onChange={setNumRegistro} placeholder="N. XX/2024" />
          <Field label="Data registrazione" value={dataRegistro} onChange={setDataRegistro} type="date" />
          <Field label="Iscrizione ROC" value={iscrRoc} onChange={setIscrRoc} placeholder="N. XXXXX" />
        </div>
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Giornalisti, Editor, Videomaker & Operatori</div>
          {isAdmin && (
            <button
              onClick={() => {
                setShowAddMember(!showAddMember);
                setEditingId(null);
                setNewMember({ nome: '', email: '', ruolo: 'giornalista' });
              }}
              className="btn btn-sm btn-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Aggiungi membro
            </button>
          )}
        </div>
        <div className="p-5 space-y-4">
          {showAddMember && (
            <div className="p-4 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nome e cognome"
                  value={newMember.nome}
                  onChange={e => setNewMember({ ...newMember, nome: e.target.value })}
                  className="input w-full"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="input w-full"
                />
                <select
                  value={newMember.ruolo}
                  onChange={e => setNewMember({ ...newMember, ruolo: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="giornalista">Giornalista</option>
                  <option value="editor">Editor</option>
                  <option value="videomaker">Videomaker</option>
                  <option value="operatore">Operatore</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setEditingId(null);
                    setNewMember({ nome: '', email: '', ruolo: 'giornalista' });
                  }}
                  className="btn btn-sm"
                  style={{ background: "var(--c-bg-3)", color: "var(--c-text-1)" }}
                >
                  Annulla
                </button>
                <button onClick={handleAddMember} className="btn btn-sm btn-primary">
                  {editingId ? 'Aggiorna' : 'Aggiungi'}
                </button>
              </div>
            </div>
          )}

          {teamMembers.length === 0 ? (
            <p className="text-sm text-center" style={{ color: "var(--c-text-2)" }}>
              Nessun membro del team aggiunto ancora
            </p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{member.nome}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-2)" }}>{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      {member.ruolo}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="p-1 rounded transition"
                          style={{ color: "var(--c-text-2)", background: "var(--c-bg-3)" }}
                          title="Modifica"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1 rounded transition"
                          style={{ color: "var(--c-danger)" }}
                          title="Elimina"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="card">
        <div className="card-header">Note & Abilitazioni</div>
        <div className="p-5">
          <p className="text-xs mb-3" style={{ color: "var(--c-text-2)" }}>
            Eventuali abilitazioni, certificazioni o note aggiuntive sulla testata.
            Tutti i campi sono opzionali e possono essere compilati in un secondo momento.
          </p>
          <textarea rows={4} className="input w-full resize-none" placeholder="Note libere..." />
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva Scheda Testata
          </button>
        </div>
      )}
    </div>
  );
}
