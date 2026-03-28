"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { usePageStore } from "@/lib/stores/page-store";
import { useAIConfigStore } from "@/lib/stores/ai-config-store";
import { isModuleActive } from "@/lib/modules";
import { useAIStatus } from "@/lib/ai-status";
import { parseAICommand, type AICommand } from "@/lib/ai/command-parser";
import { parseNaturalLanguage, detectContextFromText } from "@/lib/ai/natural-language-executor";
import toast from "react-hot-toast";
import { Sparkles, Loader2, Copy, Check, X } from "lucide-react";
import type { Block } from "@/lib/types";
import { buildCmsFactPolicy } from "@/lib/ai/prompts";

interface AIAction {
  id: string;
  label: string;
  prompt: string; // user prompt — {context} will be replaced with contextData
}

export type { AICommand } from "@/lib/ai/command-parser";

const JSON_FIELD_NAMES = new Set([
  "layout",
  "background",
  "typography",
  "border",
  "animation",
  "advanced-gradient",
  "glassmorphism",
  "clip-path-shape",
]);

function unwrapAiResponse(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json|css|html)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function shouldForceJson(fieldName?: string, taskType?: AIButtonProps["taskType"]) {
  if (!fieldName) return false;
  if (taskType === "layout") return true;
  return JSON_FIELD_NAMES.has(fieldName);
}

function buildDispatchPrompt({
  actionPrompt,
  fieldName,
  fieldValue,
  contextToUse,
  forceJson,
}: {
  actionPrompt: string;
  fieldName?: string;
  fieldValue?: string;
  contextToUse: string;
  forceJson: boolean;
}) {
  if (!fieldName) {
    return actionPrompt.replace("{context}", contextToUse);
  }

  if (forceJson) {
    return [
      `Campo: ${fieldName}`,
      fieldValue ? `Valore attuale: ${fieldValue}` : "",
      contextToUse ? `Contesto: ${contextToUse}` : "",
      "",
      `Richiesta: ${actionPrompt.replace("{context}", contextToUse)}`,
      "",
      "Rispondi SOLO con un oggetto JSON valido contenente il nuovo valore o le proprietà aggiornate del campo, senza spiegazioni, senza markdown.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Campo: ${fieldName}`,
    fieldValue ? `Valore attuale: ${fieldValue}` : "",
    contextToUse ? `Contesto: ${contextToUse}` : "",
    "",
    `Richiesta: ${actionPrompt.replace("{context}", contextToUse)}`,
    "",
    "Rispondi SOLO con il nuovo valore finale del campo, senza spiegazioni, senza introduzioni, senza markdown.",
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizeContextValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 6).map((item) => sanitizeContextValue(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= 2) {
      return "[object]";
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 12)
        .map(([key, nestedValue]) => [key, sanitizeContextValue(nestedValue, depth + 1)])
    );
  }

  return String(value);
}

function summarizeBlockForAi(block: Block, depth = 0): Record<string, unknown> {
  return {
    id: block.id,
    type: block.type,
    label: block.label,
    hidden: block.hidden,
    locked: block.locked,
    props: sanitizeContextValue(block.props),
    style: {
      layout: sanitizeContextValue(block.style.layout),
      background: sanitizeContextValue(block.style.background),
      typography: sanitizeContextValue(block.style.typography),
      border: sanitizeContextValue(block.style.border),
    },
    dataSource: sanitizeContextValue(block.dataSource),
    childCount: block.children.length,
    children:
      depth >= 1
        ? block.children.slice(0, 6).map((child) => ({
            id: child.id,
            type: child.type,
            label: child.label,
          }))
        : block.children.slice(0, 6).map((child) => summarizeBlockForAi(child, depth + 1)),
  };
}

function buildAiContextString({
  fieldValue,
  contextData,
  fieldName,
  block,
  blockLocation,
  pageMeta,
  rootBlocks,
}: {
  fieldValue?: string;
  contextData?: string;
  fieldName?: string;
  block: Block | null;
  blockLocation: { parentId: string | null; index: number; siblingsCount: number } | null;
  pageMeta: Record<string, unknown>;
  rootBlocks: Block[];
}) {
  const sections: string[] = [];

  if (fieldName) {
    sections.push(`CAMPO O OBIETTIVO:\n${fieldName}`);
  }

  if (fieldValue) {
    sections.push(`VALORE ATTUALE:\n${fieldValue}`);
  }

  if (contextData) {
    sections.push(`CONTESTO FORNITO:\n${contextData}`);
  }

  if (block) {
    sections.push(
      `BLOCCO O SEZIONE ATTIVA:\n${JSON.stringify(
        {
          ...summarizeBlockForAi(block),
          location: blockLocation,
        },
        null,
        2
      )}`
    );
  }

  if (rootBlocks.length > 0) {
    sections.push(
      `PAGINA / STRUTTURA INTORNO:\n${JSON.stringify(
        {
          pageMeta: sanitizeContextValue(pageMeta),
          rootBlocks: rootBlocks.slice(0, 8).map((rootBlock) => ({
            id: rootBlock.id,
            type: rootBlock.type,
            label: rootBlock.label,
            childCount: rootBlock.children.length,
          })),
        },
        null,
        2
      )}`
    );
  }

  return sections.filter(Boolean).join("\n\n");
}

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
  /** Override task type for provider routing */
  taskType?: 'layout' | 'field-assist' | 'chatbot' | 'seo' | 'titles' | 'social' | 'translate' | 'summary';
  /** Apply generated result immediately when possible */
  autoApply?: boolean;
}

export default function AIButton({ actions, fieldValue, contextData: contextDataProp, systemPrompt, onResult, onCommand, onApply, compact, blockId, fieldName, taskType, autoApply = true }: AIButtonProps) {
  const { currentTenant } = useAuthStore();
  const { getBlock, getBlockLocation, blocks, pageMeta } = usePageStore();
  const { provider: selectedProvider, model: selectedModel } = useAIConfigStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(actions[0]?.id ?? null);

  const settings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
  if (!isModuleActive(settings, "ai_assistant")) return null;

  const defaultSystemPrompt = `Sei un assistente operativo del CMS online del tenant "${currentTenant?.name || "tenant corrente"}".
Aiuti a compilare campi, revisionare contenuti, ottimizzare SEO, analytics, tecnico e gestione operativa.
Quando l'utente ti chiede un risultato per un campo o un modulo, genera direttamente l'output finale, senza spiegazioni inutili.
${buildCmsFactPolicy({ tenantName: currentTenant?.name })}`;

  const handleAction = async (action: AIAction) => {
    if (!currentTenant) return;
    setLoading(action.id);
    useAIStatus.getState().set({ message: action.label + "...", provider: "" });

    try {
      const liveBlock = blockId ? getBlock(blockId) : null;
      const liveLocation = blockId ? getBlockLocation(blockId) : null;
      const contextToUse = buildAiContextString({
        fieldValue,
        contextData: contextDataProp,
        fieldName,
        block: liveBlock,
        blockLocation: liveLocation,
        pageMeta,
        rootBlocks: blocks,
      });
      const effectiveTaskType = taskType || (onCommand || blockId ? 'layout' : 'chatbot');
      const forceJson = shouldForceJson(fieldName, effectiveTaskType);
      const res = await fetch("/api/ai/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          taskType: effectiveTaskType,
          preferredProvider: selectedProvider,
          preferredModel: selectedModel,
          systemPrompt: systemPrompt || defaultSystemPrompt,
          prompt: buildDispatchPrompt({
            actionPrompt: action.prompt,
            fieldName,
            fieldValue,
            contextToUse,
            forceJson,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Errore IA"); setLoading(null); return; }

      const result = unwrapAiResponse(data.content || "");
      setResults(prev => ({ ...prev, [action.id]: result }));

      // Try to parse as command first
      let command = parseAICommand(result);

      // If no command found, try natural language parsing
      if (!command && onCommand && fieldName) {
        // Detect context from fieldName
        const context = detectContextFromText(fieldName) || detectContextFromText(result);
        if (context) {
          const natLangResult = parseNaturalLanguage(result, context);
          if (natLangResult.success && natLangResult.command) {
            command = natLangResult.command;
          }
        }
      }

      if (command && onCommand) {
        onCommand(command);
        toast.success(`Comando eseguito con ${data.provider}`);
      } else if (onResult) {
        onResult(result);
        toast.success(`Applicato con ${data.provider}`);
      } else if (onApply && autoApply) {
        onApply(action.id, result);
        toast.success(`Applicato con ${data.provider}`);
      } else if (onApply) {
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

  const selectedAction = actions.find((action) => action.id === selectedActionId) ?? actions[0] ?? null;
  const selectedResult = selectedAction ? results[selectedAction.id] : "";

  const renderAssistantPanel = () => (
    <div
      className="fixed bottom-4 right-4 z-[70] flex w-[min(94vw,920px)] min-w-[320px] max-w-[94vw] flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{
        background: "var(--c-bg-1)",
        border: "1px solid var(--c-border)",
        height: "min(78vh, 640px)",
        minHeight: "360px",
        resize: "both",
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--c-accent)" }} />
            <span className="truncate">AI Assistant</span>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
            Provider: {selectedProvider} {selectedModel ? `· ${selectedModel}` : ""}
          </p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 transition hover:opacity-70">
          <X className="h-4 w-4" style={{ color: "var(--c-text-3)" }} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="min-h-0 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: "var(--c-border)", color: "var(--c-text-3)" }}>
              Azioni
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="space-y-1.5">
                {actions.map((action) => {
                  const isSelected = selectedAction?.id === action.id;
                  const hasResult = Boolean(results[action.id]);
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        setSelectedActionId(action.id);
                        if (!results[action.id]) {
                          void handleAction(action);
                        }
                      }}
                      disabled={loading !== null && loading !== action.id}
                      className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium transition disabled:opacity-50"
                      style={{
                        background: isSelected ? "var(--c-accent-soft)" : "var(--c-bg-2)",
                        color: isSelected ? "var(--c-accent)" : "var(--c-text-1)",
                        border: `1px solid ${isSelected ? "var(--c-accent)" : "var(--c-border)"}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {loading === action.id ? (
                          <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                        ) : (
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: isSelected ? "var(--c-accent)" : "var(--c-text-3)" }} />
                        )}
                        <div className="min-w-0">
                          <div className="truncate">{action.label}</div>
                          <div className="mt-1 text-[10px]" style={{ color: hasResult ? "var(--c-text-2)" : "var(--c-text-3)" }}>
                            {hasResult ? "Risposta disponibile" : "Genera risposta"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              {selectedAction?.label || "Risposta"}
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
              Pannello ridimensionabile e con scroll interno per leggere risposte lunghe.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {selectedAction ? (
              selectedResult ? (
                <div
                  className="rounded-xl border p-4 text-sm leading-7"
                  style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                >
                  <pre className="whitespace-pre-wrap break-words font-sans">{selectedResult}</pre>
                </div>
              ) : loading === selectedAction.id ? (
                <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-2)" }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generazione in corso...
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-dashed px-6 text-center text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)", background: "var(--c-bg-2)" }}>
                  Seleziona un’azione a sinistra per generare o rileggere la risposta.
                </div>
              )
            ) : null}
          </div>

          {selectedAction ? (
            <div className="border-t px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void handleAction(selectedAction)}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-50"
                  style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
                >
                  {loading === selectedAction.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Rigenera
                </button>
                {selectedResult ? (
                  <>
                    <button
                      onClick={() => copyText(selectedResult, selectedAction.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
                      style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
                    >
                      {copied === selectedAction.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === selectedAction.id ? "Copiato" : "Copia"}
                    </button>
                    {onApply ? (
                      <button
                        onClick={() => { onApply(selectedAction.id, selectedResult); setOpen(false); }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
                        style={{ background: "var(--c-accent)", color: "#fff" }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Applica
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

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

        {open ? renderAssistantPanel() : null}
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

      {open ? renderAssistantPanel() : null}
    </div>
  );
}
