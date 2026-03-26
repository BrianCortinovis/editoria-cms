"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Users,
  Eye,
  Database,
  Download,
  Trash2,
} from "lucide-react";

function ComplianceItem({
  status,
  title,
  desc,
}: {
  status: "ok" | "warn" | "fail";
  title: string;
  desc: string;
}) {
  const icons = { ok: CheckCircle, warn: AlertTriangle, fail: XCircle };
  const colors = { ok: "var(--c-success)", warn: "var(--c-warning)", fail: "var(--c-danger)" };
  const Icon = icons[status];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors[status] }} />
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>{title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-2)" }}>{desc}</p>
      </div>
    </div>
  );
}

export default function GdprPage() {
  const { currentRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState("status");
  const isAdmin = currentRole === "super_admin";

  const tabs = [
    { id: "status", label: "Stato Compliance" },
    { id: "data", label: "Gestione Dati" },
    { id: "policies", label: "Policy CMS" },
    { id: "cookies", label: "Cookie" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "var(--c-border)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap"
            style={{
              borderColor: activeTab === tab.id ? "var(--c-accent)" : "transparent",
              color: activeTab === tab.id ? "var(--c-accent)" : "var(--c-text-2)",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status */}
      {activeTab === "status" && (
        <div className="space-y-3">
          <ComplianceItem status="ok" title="Autenticazione sicura (Magic Link + Password)"
            desc="Nessuna password in chiaro. Auth gestita da Supabase con JWT token e refresh automatico." />
          <ComplianceItem status="ok" title="Row Level Security attiva"
            desc="Ogni query al database è filtrata per tenant_id. I dati di una testata non sono accessibili da un'altra." />
          <ComplianceItem status="ok" title="Multi-tenancy con isolamento dati"
            desc="Ogni testata ha i propri dati completamente isolati. Le policy RLS garantiscono l'isolamento a livello database." />
          <ComplianceItem status="ok" title="HTTPS/TLS obbligatorio"
            desc="Tutto il traffico è criptato via HTTPS. Certificati SSL auto-rinnovati da Vercel." />
          <ComplianceItem status="ok" title="Audit trail (Log attività)"
            desc="Ogni azione nel CMS viene registrata con utente, timestamp e dettagli." />
          <ComplianceItem status="ok" title="Ruoli e permessi granulari"
            desc="5 livelli di accesso con permessi definiti a livello database. Principio del minimo privilegio." />
          <ComplianceItem status="warn" title="Cookie banner per il sito frontend"
            desc="Il CMS non imposta cookie di tracciamento. Per il sito pubblico, usa il tuo modulo GDPR per il cookie banner." />
          <ComplianceItem status="warn" title="Data Processing Agreement (DPA)"
            desc="Verifica di avere i DPA firmati con Supabase e Vercel (disponibili nei rispettivi portali)." />
          <ComplianceItem status="warn" title="Privacy Policy del CMS"
            desc="Prepara una privacy policy specifica per l'accesso al CMS da parte dei redattori." />
        </div>
      )}

      {/* Data Management */}
      {activeTab === "data" && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header flex items-center gap-2"><Database className="w-4 h-4" /> Dati Personali nel CMS</div>
            <div className="p-4 space-y-2">
              {[
                { type: "Profili redattori", data: "email, nome, avatar, bio", location: "Tabella profiles" },
                { type: "Sottoscrittori newsletter", data: "email, preferenze", location: "Tabella newsletter_subscribers (futura)" },
                { type: "Commenti", data: "nome, email, IP", location: "Tabella comments (futura)" },
                { type: "Inserzionisti", data: "nome azienda, email, telefono", location: "Tabella advertisers" },
                { type: "Log attività", data: "user_id, azione, timestamp", location: "Tabella activity_log" },
              ].map(d => (
                <div key={d.type} className="flex items-center justify-between py-2 border-b text-xs" style={{ borderColor: "var(--c-border)" }}>
                  <span className="font-medium" style={{ color: "var(--c-text-0)" }}>{d.type}</span>
                  <span style={{ color: "var(--c-text-2)" }}>{d.data}</span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--c-text-3)" }}>{d.location}</span>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="card">
              <div className="card-header flex items-center gap-2"><Users className="w-4 h-4" /> Diritti degli Interessati</div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>Diritto di accesso (Art. 15)</p>
                    <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Workflow ancora da implementare in modo operativo e tracciato</p>
                  </div>
                  <button className="btn btn-secondary text-xs opacity-60 cursor-not-allowed" disabled><Download className="w-3.5 h-3.5" /> In arrivo</button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>Diritto alla cancellazione (Art. 17)</p>
                    <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>Richiede procedura sicura con export, verifica tenant e audit dedicato</p>
                  </div>
                  <button className="btn btn-danger text-xs opacity-60 cursor-not-allowed" disabled><Trash2 className="w-3.5 h-3.5" /> In arrivo</button>
                </div>
                <div className="p-3 rounded-lg text-[11px]" style={{ background: "rgba(245,158,11,0.10)", color: "var(--c-text-1)", border: "1px solid rgba(245,158,11,0.35)" }}>
                  Questa sezione non simula più azioni non implementate. Finché il workflow GDPR operativo non è completo, il CMS lo dichiara esplicitamente.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Policies */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header flex items-center gap-2"><FileText className="w-4 h-4" /> Policy del CMS</div>
            <div className="p-4 space-y-3">
              <div className="p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--c-text-0)" }}>Trattamento dati dei redattori</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                  Il CMS raccoglie nome, email e attività dei redattori ai fini della gestione editoriale.
                  I dati sono conservati su server Supabase (EU) e Vercel (Edge global).
                  L&apos;accesso è protetto da autenticazione e i dati sono isolati per testata tramite RLS.
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--c-text-0)" }}>Conservazione dei dati</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                  I log attività vengono conservati per 12 mesi. Gli articoli archiviati restano nel database
                  a tempo indeterminato. I profili utente vengono rimossi alla disattivazione dell&apos;account.
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "var(--c-bg-2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--c-text-0)" }}>Sub-processori</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--c-text-2)" }}>
                  Supabase Inc. (database, auth, storage) — DPA disponibile su supabase.com/privacy<br />
                  Vercel Inc. (hosting, CDN, serverless) — DPA disponibile su vercel.com/legal/dpa<br />
                  Stripe Inc. (pagamenti abbonamenti, se attivo) — DPA disponibile su stripe.com/privacy
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookies */}
      {activeTab === "cookies" && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header flex items-center gap-2"><Eye className="w-4 h-4" /> Cookie utilizzati dal CMS</div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--c-border)" }}>
                    <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Cookie</th>
                    <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Tipo</th>
                    <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Scopo</th>
                    <th className="text-left py-2 font-semibold" style={{ color: "var(--c-text-2)" }}>Durata</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "sb-*-auth-token", type: "Tecnico", scope: "Sessione utente Supabase Auth", dur: "1 ora (refresh auto)" },
                    { name: "editoria_theme", type: "Preferenza", scope: "Preferenza tema dark/light", dur: "Permanente" },
                    { name: "editoria_current_tenant", type: "Preferenza", scope: "Ultima testata selezionata", dur: "Permanente" },
                  ].map(c => (
                    <tr key={c.name} className="border-b" style={{ borderColor: "var(--c-border)" }}>
                      <td className="py-2 font-mono" style={{ color: "var(--c-accent)" }}>{c.name}</td>
                      <td className="py-2"><span className="badge" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>{c.type}</span></td>
                      <td className="py-2" style={{ color: "var(--c-text-1)" }}>{c.scope}</td>
                      <td className="py-2" style={{ color: "var(--c-text-1)" }}>{c.dur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-lg flex gap-3" style={{ background: "var(--c-accent-soft)" }}>
            <Shield className="w-5 h-5 shrink-0" style={{ color: "var(--c-accent)" }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--c-text-0)" }}>Nessun cookie di tracciamento</p>
              <p className="text-[11px]" style={{ color: "var(--c-text-2)" }}>
                Il CMS utilizza solo cookie tecnici e di preferenza. Nessun cookie di marketing o profilazione.
                Per il sito pubblico, gestisci il cookie banner con il tuo modulo GDPR dedicato.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
