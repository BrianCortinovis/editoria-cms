"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { useAIStatus } from "@/lib/ai-status";
import { parseAICommand, type AICommand } from "@/lib/ai/command-parser";
import toast from "react-hot-toast";
import { Sparkles, Loader2, Copy, Check, X } from "lucide-react";

interface AIAction {
  id: string;
  label: string;
  prompt: string; // user prompt — {context} will be replaced with contextData
}

export type { AICommand } from "@/lib/ai/command-parser";

interface AIButtonProps {
  /** Actions available in this context */
  actions: AIAction[];
  /** Data to pass as context to the AI (JSON string) */
  fieldValue?: string;
  /** Alternate interface: just context data string */
  contextData?: string;
  /** System prompt override */
  systemPrompt?: string;
  /** Callback when AI generates a result (new interface) */
  onResult?: (result: string) => void;
  /** Callback when AI generates a parsed command (tool calling) */
  onCommand?: (command: AICommand) => void;
  /** Callback when AI generates a result the user wants to apply (legacy interface) */
  onApply?: (actionId: string, result: string) => void;
  /** Block ID for context */
  blockId?: string;
  /** Field name for context */
  fieldName?: string;
  /** Compact mode (just icon button) */
  compact?: boolean;
}

export default function AIButton({ actions, fieldValue, contextData: contextDataProp, systemPrompt, onResult, onCommand, onApply, compact }: AIButtonProps) {
  const { currentTenant } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const settings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
  if (!isModuleActive(settings, "ai_assistant")) return null;

  const handleAction = async (action: AIAction) => {
    if (!currentTenant) return;
    setLoading(action.id);
    useAIStatus.getState().set({ message: action.label + "...", provider: "" });

    try {
      const contextToUse = fieldValue || contextDataProp || "";
      const res = await fetch("/api/ai/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          task: "seo", // fallback task for provider resolution
          system: systemPrompt || "Sei un assistente editoriale per un CMS giornalistico italiano. Rispondi in modo conciso e utile.",
          prompt: action.prompt.replace("{context}", contextToUse),
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Errore IA"); setLoading(null); return; }

      const result = data.text;
      setResults(prev => ({ ...prev, [action.id]: result }));

      // Try to parse as command first
      const command = parseAICommand(result);
      if (command && onCommand) {
        onCommand(command);
        toast.success(`Comando eseguito con ${data.provider}`);
      } else if (onResult) {
        // Fall back to onResult callback
        onResult(result);
        toast.success(`Generato con ${data.provider}`);
      } else {
        toast.success(`Generato con ${data.provider}`);
      }
      useAIStatus.getState().set({ message: `${action.label} completato`, provider: data.provider || "" });
      setTimeout(() => useAIStatus.getState().clear(), 3000);
    } catch {
      toast.error("Errore di connessione");
    }
    setLoading(null);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition"
          style={{ background: open ? "var(--c-accent-soft)" : "transparent", color: "var(--c-accent)" }}
          title="AI Assistant"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-72 rounded-xl shadow-xl z-50 p-3 space-y-2"
            style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--c-text-0)" }}>
                <Sparkles className="w-3 h-3" style={{ color: "var(--c-accent)" }} /> AI Assistant
              </span>
              <button onClick={() => setOpen(false)}><X className="w-3 h-3" style={{ color: "var(--c-text-3)" }} /></button>
            </div>
            {actions.map(a => (
              <div key={a.id}>
                <button
                  onClick={() => handleAction(a)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50 text-left"
                  style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
                >
                  {loading === a.id ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : <Sparkles className="w-3 h-3 shrink-0" style={{ color: "var(--c-accent)" }} />}
                  {a.label}
                </button>
                {results[a.id] && (
                  <div className="mt-1 p-2 rounded-lg text-xs" style={{ background: "var(--c-bg-3)", color: "var(--c-text-0)" }}>
                    <p className="whitespace-pre-wrap">{results[a.id]}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button onClick={() => copyText(results[a.id], a.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                        {copied === a.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} Copia
                      </button>
                      {onApply && (
                        <button onClick={() => onApply(a.id, results[a.id])}
                          className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                          <Check className="w-2.5 h-2.5" /> Usa
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Full-size button
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
        style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
      >
        <Sparkles className="w-3.5 h-3.5" /> IA
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-xl shadow-xl z-50 p-3 space-y-2"
          style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--c-text-0)" }}>
              <Sparkles className="w-3 h-3" style={{ color: "var(--c-accent)" }} /> AI Assistant
            </span>
            <button onClick={() => setOpen(false)}><X className="w-3 h-3" style={{ color: "var(--c-text-3)" }} /></button>
          </div>
          {actions.map(a => (
            <div key={a.id}>
              <button
                onClick={() => handleAction(a)}
                disabled={loading !== null}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50 text-left"
                style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              >
                {loading === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--c-accent)" }} />}
                {a.label}
              </button>
              {results[a.id] && (
                <div className="mt-1.5 p-2.5 rounded-lg text-xs leading-relaxed" style={{ background: "var(--c-bg-3)", color: "var(--c-text-0)" }}>
                  <p className="whitespace-pre-wrap">{results[a.id]}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button onClick={() => copyText(results[a.id], a.id)}
                      className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                      style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                      {copied === a.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />} Copia
                    </button>
                    {onApply && (
                      <button onClick={() => { onApply(a.id, results[a.id]); setOpen(false); }}
                        className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                        <Check className="w-2.5 h-2.5" /> Applica
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
