"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCcw, Save, ShieldCheck } from "lucide-react";

interface ComplianceDocumentForm {
  slug: string;
  title: string;
  summary: string;
  content: string;
  enabled: boolean;
}

interface CompliancePackForm {
  version: string;
  updatedAt: string;
  footer: {
    enabled: boolean;
  };
  cookieBanner: {
    enabled: boolean;
    scriptUrl: string;
    inlineScript: string;
    noscriptIframeUrl: string;
  };
  documents: {
    privacy: ComplianceDocumentForm;
    cookie: ComplianceDocumentForm;
    terms: ComplianceDocumentForm;
  };
}

const emptyPack: CompliancePackForm = {
  version: "",
  updatedAt: "",
  footer: { enabled: true },
  cookieBanner: {
    enabled: false,
    scriptUrl: "",
    inlineScript: "",
    noscriptIframeUrl: "",
  },
  documents: {
    privacy: { slug: "privacy-policy", title: "", summary: "", content: "", enabled: true },
    cookie: { slug: "cookie-policy", title: "", summary: "", content: "", enabled: true },
    terms: { slug: "termini-e-condizioni", title: "", summary: "", content: "", enabled: true },
  },
};

export default function AdminCompliancePage() {
  const [pack, setPack] = useState<CompliancePackForm>(emptyPack);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/compliance-pack", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.pack) {
        setPack(payload.pack);
      } else {
        setResponseText(payload?.error || "Impossibile caricare il compliance pack.");
      }
      setLoading(false);
    }

    void load();
  }, []);

  const updateDocument = (
    key: "privacy" | "cookie" | "terms",
    field: keyof ComplianceDocumentForm,
    value: string | boolean
  ) => {
    setPack((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [key]: {
          ...current.documents[key],
          [field]: value,
        },
      },
    }));
  };

  const savePack = async () => {
    setSaving(true);
    setResponseText("");

    const response = await fetch("/api/admin/compliance-pack", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pack),
    });
    const payload = await response.json().catch(() => null);

    if (response.ok && payload?.pack) {
      setPack(payload.pack);
      setResponseText(JSON.stringify(payload.sync, null, 2));
    } else {
      setResponseText(payload?.error || "Salvataggio compliance pack non riuscito.");
    }

    setSaving(false);
  };

  const syncNow = async () => {
    setSyncing(true);
    setResponseText("");

    const response = await fetch("/api/admin/compliance-pack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const payload = await response.json().catch(() => null);

    setResponseText(JSON.stringify(payload?.sync || payload, null, 2));
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="border-y px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)" }}>
        Caricamento compliance pack...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-start lg:justify-between" style={{ borderColor: "var(--c-border)" }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Global Compliance Pack
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
            GDPR e legal compliance multi-sito
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Aggiorni qui i documenti generali della piattaforma e il sistema li sincronizza automaticamente su tutti i tenant che ereditano il pack globale.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5" style={{ color: "var(--c-text-2)" }}>
            Il banner cookie del CMS parte con solo cookie tecnici, permette rifiuto e personalizzazione, mostra &quot;I miei consensi&quot; e rinnova la scelta dopo 6 mesi.
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--c-text-2)" }}>
            Versione attuale: <strong style={{ color: "var(--c-text-0)" }}>{pack.version || "n/d"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing || saving}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-1)" }}
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Aggiorna tutti i siti ora
          </button>
          <button
            type="button"
            onClick={savePack}
            disabled={saving || syncing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "var(--c-danger)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva, aggiorna file e propaga
          </button>
        </div>
      </div>

      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" style={{ color: "var(--c-danger)" }} />
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Footer e cookie banner</h3>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--c-border)" }}>
            <span className="flex items-center justify-between gap-3">
              <span style={{ color: "var(--c-text-1)" }}>Mostra link legali nel footer</span>
              <input
                type="checkbox"
                checked={pack.footer.enabled}
                onChange={(event) => setPack((current) => ({ ...current, footer: { enabled: event.target.checked } }))}
              />
            </span>
          </label>

          <label className="rounded-2xl border p-4 text-sm" style={{ borderColor: "var(--c-border)" }}>
            <span className="flex items-center justify-between gap-3">
              <span style={{ color: "var(--c-text-1)" }}>Abilita iniezione cookie banner</span>
              <input
                type="checkbox"
                checked={pack.cookieBanner.enabled}
                onChange={(event) =>
                  setPack((current) => ({
                    ...current,
                    cookieBanner: {
                      ...current.cookieBanner,
                      enabled: event.target.checked,
                    },
                  }))
                }
              />
            </span>
          </label>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Script marketing post-consenso
            </label>
            <input
              type="url"
              value={pack.cookieBanner.scriptUrl}
              onChange={(event) =>
                setPack((current) => ({
                  ...current,
                  cookieBanner: {
                    ...current.cookieBanner,
                    scriptUrl: event.target.value,
                  },
                }))
              }
              placeholder="https://cdn.example.com/script-marketing.js"
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: "1px solid var(--c-border)", background: "transparent" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Noscript iframe URL
            </label>
            <input
              type="url"
              value={pack.cookieBanner.noscriptIframeUrl}
              onChange={(event) =>
                setPack((current) => ({
                  ...current,
                  cookieBanner: {
                    ...current.cookieBanner,
                    noscriptIframeUrl: event.target.value,
                  },
                }))
              }
              placeholder="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: "1px solid var(--c-border)", background: "transparent" }}
            />
          </div>
        </div>

        <div className="mt-4">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
              Inline script post-consenso
            </label>
          <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
            Se presenti, questi script vengono eseguiti solo dopo consenso marketing. Il banner e la gestione preferenze restano nativi del CMS.
          </p>
          <textarea
            value={pack.cookieBanner.inlineScript}
            onChange={(event) =>
              setPack((current) => ({
                ...current,
                cookieBanner: {
                  ...current.cookieBanner,
                  inlineScript: event.target.value,
                },
              }))
            }
            rows={6}
            placeholder="window.myMarketingTool = window.myMarketingTool || {};"
            className="mt-1 w-full rounded-2xl px-3 py-3 text-sm"
            style={{ border: "1px solid var(--c-border)", background: "transparent" }}
          />
        </div>
      </section>

      {(["privacy", "cookie", "terms"] as const).map((key) => {
        const document = pack.documents[key];
        return (
          <section key={key} className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
                  Documento
                </p>
                <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                  {key === "privacy" ? "Privacy policy" : key === "cookie" ? "Cookie policy" : "Termini e condizioni"}
                </h3>
              </div>

              <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                <input
                  type="checkbox"
                  checked={document.enabled}
                  onChange={(event) => updateDocument(key, "enabled", event.target.checked)}
                />
                Attivo
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                  Slug pubblico
                </label>
                <input
                  type="text"
                  value={document.slug}
                  onChange={(event) => updateDocument(key, "slug", event.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1px solid var(--c-border)", background: "transparent" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                  Titolo
                </label>
                <input
                  type="text"
                  value={document.title}
                  onChange={(event) => updateDocument(key, "title", event.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1px solid var(--c-border)", background: "transparent" }}
                />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                  Sommario
                </label>
                <input
                  type="text"
                  value={document.summary}
                  onChange={(event) => updateDocument(key, "summary", event.target.value)}
                  className="mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1px solid var(--c-border)", background: "transparent" }}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                Contenuto
              </label>
              <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                Placeholder disponibili: {"{{site_name}}"}, {"{{company_name}}"}, {"{{contact_email}}"}, {"{{privacy_email}}"}, {"{{legal_address}}"}, {"{{vat_number}}"}, {"{{pack_updated_at}}"}.
              </p>
              <textarea
                value={document.content}
                onChange={(event) => updateDocument(key, "content", event.target.value)}
                rows={18}
                className="mt-2 w-full rounded-2xl px-3 py-3 text-sm"
                style={{ border: "1px solid var(--c-border)", background: "transparent" }}
              />
            </div>
          </section>
        );
      })}

      <section className="border-y" style={{ borderColor: "var(--c-border)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Risposta sistema</h3>
        </div>
        <pre className="overflow-auto px-4 py-4 text-xs" style={{ color: "var(--c-text-1)" }}>
          {responseText || "Nessuna operazione eseguita ancora."}
        </pre>
      </section>
    </div>
  );
}
