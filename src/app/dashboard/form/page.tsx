"use client";

import { useCallback, useEffect, useState } from "react";
import slugify from "slugify";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import { Check, Plus } from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface SiteForm {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: Array<Record<string, unknown>>;
  recipient_emails: string[];
  success_message: string | null;
  is_active: boolean;
}

interface SubmissionRow {
  id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  status: string;
  created_at: string;
}

const DEFAULT_FIELDS = [
  { name: "name", label: "Nome", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "message", label: "Messaggio", type: "textarea", required: true },
];

export default function FormPage() {
  const { currentTenant } = useAuthStore();
  const [forms, setForms] = useState<SiteForm[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [moduleReady, setModuleReady] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fieldsJson, setFieldsJson] = useState(JSON.stringify(DEFAULT_FIELDS, null, 2));
  const [recipients, setRecipients] = useState("");
  const [successMessage, setSuccessMessage] = useState("Grazie, abbiamo ricevuto il tuo messaggio.");
  const [isActive, setIsActive] = useState(true);

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => null);
    return typeof payload?.error === "string" ? payload.error : fallback;
  }, []);

  const resetEditor = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setFieldsJson(JSON.stringify(DEFAULT_FIELDS, null, 2));
    setRecipients("");
    setSuccessMessage("Grazie, abbiamo ricevuto il tuo messaggio.");
    setIsActive(true);
    setShowEditor(false);
  };

  const loadForms = useCallback(async () => {
    if (!currentTenant) return;
    const response = await fetch(`/api/cms/forms?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response, "Impossibile caricare i form");
      if (errorMessage.toLowerCase().includes("site_forms")) {
        setModuleReady(false);
      } else {
        toast.error(errorMessage);
      }
      setForms([]);
      return;
    }

    const payload = (await response.json()) as { forms?: SiteForm[] };
    setModuleReady(true);
    const nextForms = Array.isArray(payload.forms) ? payload.forms : [];
    setForms(nextForms);
    if (!selectedFormId && nextForms[0]?.id) {
      setSelectedFormId(nextForms[0].id);
    }
  }, [currentTenant, selectedFormId, readErrorMessage]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedFormId) {
      setSubmissions([]);
      return;
    }
    const response = await fetch(
      `/api/cms/forms?tenant_id=${encodeURIComponent(currentTenant?.id || "")}&form_id=${encodeURIComponent(selectedFormId)}`,
      {
        credentials: "same-origin",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      setSubmissions([]);
      return;
    }
    const payload = (await response.json()) as { submissions?: SubmissionRow[] };
    setSubmissions(Array.isArray(payload.submissions) ? payload.submissions : []);
  }, [currentTenant?.id, selectedFormId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const startEdit = (form: SiteForm) => {
    setEditingId(form.id);
    setName(form.name);
    setSlug(form.slug);
    setDescription(form.description || "");
    setFieldsJson(JSON.stringify(form.fields || DEFAULT_FIELDS, null, 2));
    setRecipients((form.recipient_emails || []).join(", "));
    setSuccessMessage(form.success_message || "");
    setIsActive(form.is_active);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) {
      toast.error("Nome form obbligatorio");
      return;
    }

    let parsedFields: Array<Record<string, unknown>>;
    try {
      parsedFields = JSON.parse(fieldsJson);
      if (!Array.isArray(parsedFields)) throw new Error("Fields must be an array");
    } catch {
      toast.error("Fields JSON non valido");
      return;
    }

    const payload = {
      tenant_id: currentTenant.id,
      name: name.trim(),
      slug: slug || slugify(name, { lower: true, strict: true, locale: "it" }),
      description: description || null,
      fields: parsedFields,
      recipient_emails: recipients.split(",").map((item) => item.trim()).filter(Boolean),
      success_message: successMessage || null,
      is_active: isActive,
    };

    const response = await fetch(editingId ? `/api/cms/forms/${editingId}` : "/api/cms/forms", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile salvare il form"));
      return;
    }

    toast.success(editingId ? "Form aggiornato" : "Form creato");
    resetEditor();
    void loadForms();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Form</h2>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Form builder leggero, submission e endpoint pubblico.</p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "form-strategy",
                label: "Progetta form",
                prompt: "Suggerisci come strutturare form, campi, destinatari e messaggi di successo per il tenant corrente in base al contesto disponibile: {context}",
              },
              {
                id: "form-audit",
                label: "Audit form",
                prompt: "Analizza form, submissions, endpoint pubblici e controlli necessari lato CMS per sicurezza, deliverability e UX: {context}",
              },
            ]}
            contextData={JSON.stringify({
              tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
              forms,
              submissions,
              editor: {
                editingId,
                name,
                slug,
                description,
                fieldsJson,
                recipients,
                successMessage,
                isActive,
              },
            }, null, 2)}
          />
          <button onClick={() => { resetEditor(); setShowEditor(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "var(--c-accent)" }}>
            <Plus className="w-4 h-4" /> Nuovo Form
          </button>
        </div>
      </div>

      {!moduleReady ? (
        <div className="rounded-lg p-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-1)" }}>Il modulo form è pronto nel codice ma la tabella non è ancora applicata al database dev.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
              {forms.length === 0 ? (
                <div className="p-5 text-sm" style={{ color: "var(--c-text-2)" }}>Nessun form creato.</div>
              ) : (
                forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => setSelectedFormId(form.id)}
                    className="w-full text-left px-4 py-3 border-b last:border-b-0"
                    style={{
                      borderColor: "var(--c-border)",
                      background: selectedFormId === form.id ? "var(--c-accent-soft)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium" style={{ color: "var(--c-text-0)" }}>{form.name}</div>
                        <div className="text-xs" style={{ color: "var(--c-text-3)" }}>/api/v1/forms/{form.slug}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); startEdit(form); }}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                      >
                        Modifica
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>

            {showEditor && (
              <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
                <input value={name} onChange={(event) => { setName(event.target.value); if (!editingId) setSlug(slugify(event.target.value, { lower: true, strict: true, locale: "it" })); }} placeholder="Nome form" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
                <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Slug form" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrizione" rows={2} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
                <textarea value={fieldsJson} onChange={(event) => setFieldsJson(event.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg text-xs font-mono" style={{ border: "1px solid var(--c-border)" }} />
                <input value={recipients} onChange={(event) => setRecipients(event.target.value)} placeholder="Email destinatarie separate da virgola" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
                <input value={successMessage} onChange={(event) => setSuccessMessage(event.target.value)} placeholder="Messaggio di successo" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                  <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                  Form attivo
                </label>
                <div className="flex justify-end gap-2">
                  <button onClick={resetEditor} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>Annulla</button>
                  <button onClick={handleSave} className="px-3 py-2 rounded-lg text-sm text-white font-semibold flex items-center gap-1.5" style={{ background: "var(--c-accent)" }}>
                    <Check className="w-4 h-4" /> Salva
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--c-text-0)" }}>Invii recenti</h3>
            {submissions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Nessun invio disponibile.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="rounded-lg p-3" style={{ background: "var(--c-bg-2)" }}>
                    <div className="font-medium text-sm" style={{ color: "var(--c-text-0)" }}>{submission.submitter_name || "Invio anonimo"}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>
                      {submission.submitter_email || "—"} · {submission.status} · {new Date(submission.created_at).toLocaleString("it-IT")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
