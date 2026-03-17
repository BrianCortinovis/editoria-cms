"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Save, Building2, Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (!currentTenant) return;
    const s = (currentTenant.settings ?? {}) as Record<string, string>;
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
      },
    }).eq("id", currentTenant.id);

    if (error) toast.error(error.message);
    else toast.success("Scheda testata salvata");
    setSaving(false);
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
