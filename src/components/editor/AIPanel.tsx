"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { createClient } from "@/lib/supabase/client";
import { useAIStatus } from "@/lib/ai-status";
import { parseAIResponse } from "@/lib/utils/parse";
import toast from "react-hot-toast";
import {
  Sparkles,
  Search,
  Type,
  Share2,
  Languages,
  FileText,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AIPanelProps {
  title: string;
  body: string;
  summary?: string;
  onApplyMetaTitle?: (v: string) => void;
  onApplyMetaDescription?: (v: string) => void;
  onApplyTitle?: (v: string) => void;
  onApplySummary?: (v: string) => void;
  onApplyTags?: (tags: string[]) => void;
}

type AIAction = "seo" | "titles" | "social" | "translate" | "summary";

interface CopyBtnProps {
  copied: string | null;
  id: string;
  text: string;
  onCopy: (text: string, key: string) => void;
}

function CopyBtn({ copied, id, text, onCopy }: CopyBtnProps) {
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="w-6 h-6 flex items-center justify-center rounded transition shrink-0"
      style={{ color: copied === id ? "var(--c-success)" : "var(--c-text-3)" }}
    >
      {copied === id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function AIPanel({
  title,
  body,
  summary,
  onApplyMetaTitle,
  onApplyMetaDescription,
  onApplyTitle,
  onApplySummary,
}: AIPanelProps) {
  const { currentTenant } = useAuthStore();
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!currentTenant || checked) return;
    // Check fresh settings from DB
    const supabase = createClient();
    supabase
      .from("tenants")
      .select("settings")
      .eq("id", currentTenant.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const s = (data.settings ?? {}) as Record<string, unknown>;
          setAiActive(isModuleActive(s, "ai_assistant"));
        }
        setChecked(true);
      });
  }, [currentTenant, checked]);

  if (!checked || !aiActive) return null;

  const callAI = async (action: AIAction) => {
    if (!currentTenant) return;
    if (!title.trim()) {
      toast.error("Scrivi almeno il titolo prima di usare l'IA");
      return;
    }

    setLoading(action);
    const aiStatus = useAIStatus.getState();
    const actionLabels: Record<string, string> = { seo: "SEO", titles: "Titoli", social: "Post Social", translate: "Traduzione", summary: "Sommario" };
    aiStatus.set({ message: `Generando ${actionLabels[action] || action}...`, provider: "" });

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          type: action,
          title,
          article_body: body,
          summary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Errore IA");
        setLoading(null);
        return;
      }

      // Parse AI response (handles both pre-parsed and stringified JSON)
      const parsedResult = parseAIResponse(data.result);
      setResults(prev => ({ ...prev, [action]: parsedResult }));
      toast.success(`${action.toUpperCase()} generato con ${data.provider}`);
      aiStatus.set({ message: `${actionLabels[action] || action} completato`, provider: data.provider || "" });
      setTimeout(() => useAIStatus.getState().clear(), 3000);
    } catch {
      toast.error("Errore di connessione");
    }
    setLoading(null);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const actions: { id: AIAction; label: string; icon: typeof Sparkles; desc: string }[] = [
    { id: "seo", label: "SEO", icon: Search, desc: "Meta title, description, tag" },
    { id: "titles", label: "Titoli", icon: Type, desc: "5 titoli alternativi" },
    { id: "social", label: "Social", icon: Share2, desc: "Post Facebook, IG, Telegram" },
    { id: "translate", label: "Traduci", icon: Languages, desc: "Traduci in inglese" },
    { id: "summary", label: "Sommario", icon: FileText, desc: "Sommario automatico" },
  ];

  const seoResult = results.seo as { meta_title?: string; meta_description?: string; suggested_tags?: string[]; og_description?: string } | undefined;
  const titlesResult = results.titles as { titles?: string[] } | undefined;
  const socialResult = results.social as Record<string, string> | undefined;
  const translateResult = results.translate as Record<string, string> | undefined;
  const summaryResult = results.summary as Record<string, string> | undefined;

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: expanded ? "1px solid var(--c-border)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            AI Assistant
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
            PRO
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />}
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {actions.map(a => (
              <button
                key={a.id}
                onClick={() => callAI(a.id)}
                disabled={loading !== null}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50 text-left"
                style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
              >
                {loading === a.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <a.icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--c-accent)" }} />
                )}
                <div className="min-w-0">
                  <p style={{ color: "var(--c-text-0)" }}>{a.label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* SEO Results */}
          {seoResult && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--c-bg-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-3)" }}>SEO</p>
              {seoResult.meta_title && (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>Meta Title</p>
                    <p className="text-xs" style={{ color: "var(--c-text-0)" }}>{seoResult.meta_title as string}</p>
                  </div>
                  <CopyBtn copied={copied} text={seoResult.meta_title as string} id="seo-title" onCopy={copyText} />
                  {onApplyMetaTitle && (
                    <button onClick={() => onApplyMetaTitle(seoResult.meta_title as string)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      Usa
                    </button>
                  )}
                </div>
              )}
              {seoResult.meta_description && (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>Meta Description</p>
                    <p className="text-xs" style={{ color: "var(--c-text-0)" }}>{seoResult.meta_description as string}</p>
                  </div>
                  <CopyBtn copied={copied} text={seoResult.meta_description as string} id="seo-desc" onCopy={copyText} />
                  {onApplyMetaDescription && (
                    <button onClick={() => onApplyMetaDescription(seoResult.meta_description as string)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      Usa
                    </button>
                  )}
                </div>
              )}
              {seoResult.suggested_tags && (
                <div>
                  <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>Tag suggeriti</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(seoResult.suggested_tags as string[]).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-bg-3)", color: "var(--c-text-1)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Titles Results */}
          {titlesResult?.titles && (
            <div className="p-3 rounded-lg space-y-1.5" style={{ background: "var(--c-bg-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-3)" }}>Titoli alternativi</p>
              {titlesResult.titles.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <p className="text-xs flex-1" style={{ color: "var(--c-text-0)" }}>{t}</p>
                  {onApplyTitle && (
                    <button onClick={() => onApplyTitle(t)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      Usa
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Social Results */}
          {socialResult && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--c-bg-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-3)" }}>Post Social</p>
              {Object.entries(socialResult).map(([platform, text]) => (
                <div key={platform} className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] capitalize" style={{ color: "var(--c-text-3)" }}>{platform}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-0)" }}>{text}</p>
                  </div>
                  <CopyBtn copied={copied} text={text} id={`social-${platform}`} onCopy={copyText} />
                </div>
              ))}
            </div>
          )}

          {/* Translate Results */}
          {translateResult && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--c-bg-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-3)" }}>Traduzione EN</p>
              {translateResult.title && (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>Title</p>
                    <p className="text-xs" style={{ color: "var(--c-text-0)" }}>{translateResult.title}</p>
                  </div>
                  <CopyBtn copied={copied} text={translateResult.title} id="tr-title" onCopy={copyText} />
                </div>
              )}
              {translateResult.summary && (
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>Summary</p>
                    <p className="text-xs" style={{ color: "var(--c-text-0)" }}>{translateResult.summary}</p>
                  </div>
                  <CopyBtn copied={copied} text={translateResult.summary} id="tr-summary" onCopy={copyText} />
                </div>
              )}
            </div>
          )}

          {/* Summary Results */}
          {summaryResult && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--c-bg-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--c-text-3)" }}>Sommario</p>
              {summaryResult.summary && (
                <div className="flex items-start gap-2">
                  <p className="text-xs flex-1" style={{ color: "var(--c-text-0)" }}>{summaryResult.summary}</p>
                  {onApplySummary && (
                    <button onClick={() => onApplySummary(summaryResult.summary)}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                      Usa
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
