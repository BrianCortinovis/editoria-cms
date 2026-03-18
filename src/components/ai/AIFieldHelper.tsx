"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { useAIStatus } from "@/lib/ai-status";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, Send, X } from "lucide-react";

interface AIFieldHelperProps {
  /** What this field is (e.g. "titolo articolo", "meta description", "descrizione evento") */
  fieldLabel: string;
  /** Current value of the field */
  currentValue: string;
  /** Extra context (e.g. article body, other fields) */
  context?: string;
  /** Callback to set the field value */
  onApply: (value: string) => void;
}

export default function AIFieldHelper({ fieldLabel, currentValue, context, onApply }: AIFieldHelperProps) {
  const { currentTenant } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [aiActive, setAiActive] = useState(false);
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentTenant || checked) return;
    const supabase = createClient();
    supabase.from("tenants").select("settings").eq("id", currentTenant.id).single()
      .then(({ data }) => {
        if (data) {
          const s = (data.settings ?? {}) as Record<string, unknown>;
          setAiActive(isModuleActive(s, "ai_assistant"));
        }
        setChecked(true);
      });
  }, [currentTenant, checked]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  if (!checked || !aiActive) return null;

  const handleSend = async () => {
    if (!prompt.trim() || !currentTenant) return;
    setLoading(true);
    setResult("");
    const aiStatus = useAIStatus.getState();
    aiStatus.set({ message: `Generando "${fieldLabel}"...`, provider: "" });

    try {
      const res = await fetch("/api/ai/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          task: "seo",
          system: `Sei un assistente editoriale integrato in un CMS per giornali italiani.
L'utente sta compilando il campo "${fieldLabel}".
Il valore attuale del campo è: "${currentValue || "(vuoto)"}"
${context ? `Contesto aggiuntivo: ${context.slice(0, 500)}` : ""}

Rispondi SOLO con il testo da inserire nel campo, senza spiegazioni, senza virgolette, senza prefissi.
Se l'utente chiede aiuto o informazioni, rispondi in modo conciso.`,
          prompt: prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult("Errore: " + (data.error || "Riprova"));
      } else {
        setResult(data.text?.trim() || "");
        aiStatus.set({ message: `"${fieldLabel}" completato`, provider: data.provider || "" });
      }
    } catch {
      setResult("Errore di connessione");
    }
    setLoading(false);
    setTimeout(() => useAIStatus.getState().clear(), 3000);
  };

  const handleApply = () => {
    onApply(result);
    setOpen(false);
    setResult("");
    setPrompt("");
  };

  const quickActions = [
    { label: "Compila", prompt: `Genera un contenuto ottimale per il campo "${fieldLabel}" di un articolo di giornale` },
    { label: "Migliora", prompt: `Migliora e rendi più efficace questo testo: "${currentValue}"` },
    { label: "Accorcia", prompt: `Riscrivi in modo più conciso: "${currentValue}"` },
    { label: "Cos'è?", prompt: `Spiegami brevemente a cosa serve il campo "${fieldLabel}" in un CMS editoriale e come compilarlo al meglio` },
  ];

  return (
    <div className="relative inline-flex" ref={panelRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="w-6 h-6 flex items-center justify-center rounded-md transition-all"
        style={{
          background: open ? "var(--c-accent)" : "var(--c-accent-soft)",
          color: open ? "#fff" : "var(--c-accent)",
        }}
        title="AI Assistant per questo campo"
      >
        <Sparkles className="w-3 h-3" />
      </button>

      {/* Popup panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-80 rounded-xl shadow-2xl z-[100] overflow-hidden"
          style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <span className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "var(--c-text-0)" }}>
              <Sparkles className="w-3 h-3" style={{ color: "var(--c-accent)" }} />
              IA · {fieldLabel}
            </span>
            <button type="button" onClick={() => setOpen(false)}>
              <X className="w-3 h-3" style={{ color: "var(--c-text-3)" }} />
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1 px-3 pt-2">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                type="button"
                onClick={() => { setPrompt(qa.prompt); }}
                className="text-[10px] px-2 py-1 rounded-full transition font-medium"
                style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "var(--c-bg-3)", border: "1px solid var(--c-border)" }}>
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                placeholder="Chiedi all'IA..."
                className="flex-1 bg-transparent border-0 text-xs focus:outline-none"
                style={{ color: "var(--c-text-0)" }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className="w-6 h-6 flex items-center justify-center rounded-md transition disabled:opacity-30"
                style={{ background: "var(--c-accent)", color: "#fff" }}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="px-3 pb-3">
              <div className="p-2.5 rounded-lg text-xs leading-relaxed" style={{ background: "var(--c-bg-2)", color: "var(--c-text-0)" }}>
                <p className="whitespace-pre-wrap">{result}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="text-[10px] px-2.5 py-1 rounded-md font-medium transition"
                    style={{ background: "var(--c-accent)", color: "#fff" }}
                  >
                    Inserisci nel campo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResult(""); setPrompt(""); }}
                    className="text-[10px] px-2 py-1 rounded-md font-medium transition"
                    style={{ background: "var(--c-bg-3)", color: "var(--c-text-2)" }}
                  >
                    Riprova
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
