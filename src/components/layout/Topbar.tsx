"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, Bell, ExternalLink, Search, Sparkles, ChevronDown, ChevronLeft, Undo2, Redo2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useAIStatus } from "@/lib/ai-status";
import { useFieldContextStore } from "@/lib/stores/field-context-store";
import { usePageStore } from "@/lib/stores/page-store";
import type { Tables } from "@/types/database";

type EditorPageOption = Pick<
  Tables<"site_pages">,
  "id" | "title" | "slug" | "is_published" | "updated_at"
>;

function ProviderGlyph({ provider, className = "w-4 h-4" }: { provider: "claude" | "openai" | "gemini"; className?: string }) {
  if (provider === "claude") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#D97757" />
        <path d="M12 5.5l1.7 4.3 4.8.4-3.7 2.9 1.2 4.6L12 15.2 8 18l1.2-4.6-3.7-2.9 4.8-.4L12 5.5z" fill="#FFF7ED" />
      </svg>
    );
  }

  if (provider === "openai") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#111827" />
        <g fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 6.2c1.5-.9 3.5-.4 4.4 1.1.4.7.5 1.5.4 2.3 1.4.7 2.1 2.4 1.4 3.9-.3.7-.8 1.2-1.4 1.5.2 1.7-1 3.4-2.8 3.6-.8.1-1.6-.1-2.3-.5-1.3 1-3.2.8-4.2-.5-.4-.5-.6-1.1-.7-1.7-1.6-.2-2.8-1.6-2.6-3.2.1-.8.5-1.5 1.1-2 .2-1.7 1.8-2.9 3.4-2.7.4 0 .8.2 1.2.4.5-.7 1-1.2 1.7-1.6z" />
          <path d="M9.2 9.2 12 7.6l2.8 1.6v3.2L12 14l-2.8-1.6z" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="geminiGradientTopbar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9L12 2.5zm6.3 11.2.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z"
        fill="url(#geminiGradientTopbar)"
      />
    </svg>
  );
}

export default function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { profile, currentTenant, currentRole } = useAuthStore();
  const { selectedField } = useFieldContextStore();
  const ai = useAIStatus();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleLabels: Record<string, string> = { super_admin: "Admin", chief_editor: "Capo", editor: "Redattore", contributor: "Collab.", advertiser: "Comm." };
  const isEditorRoute = pathname === "/dashboard/editor";
  const selectedEditorPageId = searchParams.get("page") ?? "";
  const undoEditor = usePageStore((state) => state.undo);
  const redoEditor = usePageStore((state) => state.redo);
  const editorCanUndo = usePageStore((state) => state.historyIndex > 0);
  const editorCanRedo = usePageStore((state) => state.historyIndex < state.history.length - 1);

  const [aiProvider, setAiProvider] = useState<'claude' | 'openai' | 'gemini'>('claude');
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [providerMenuStep, setProviderMenuStep] = useState<"providers" | "models">("providers");
  const [providerMenuProvider, setProviderMenuProvider] = useState<'claude' | 'openai' | 'gemini'>('claude');
  const [editorPages, setEditorPages] = useState<EditorPageOption[]>([]);
  const [editorPagesLoading, setEditorPagesLoading] = useState(false);
  const [hasEditableTarget, setHasEditableTarget] = useState(false);

  const providers = [
    {
      value: 'claude',
      label: 'Claude',
      models: [
        { id: 'claude-sonnet-4-20250514', name: 'Sonnet' },
        { id: 'claude-opus-4-20250805', name: 'Opus' },
      ]
    },
    {
      value: 'openai',
      label: 'OpenAI',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      ]
    },
    {
      value: 'gemini',
      label: 'Gemini',
      models: [
        { id: 'gemini-2.0-flash', name: 'Flash 2.0' },
        { id: 'gemini-1.5-pro', name: 'Pro 1.5' },
      ]
    },
  ] as const;

  const currentProviderData = providers.find(p => p.value === aiProvider);
  const [selectedModel, setSelectedModel] = useState(currentProviderData?.models[0]?.id || '');
  const providerMenuData = providers.find((p) => p.value === providerMenuProvider);
  const selectedModelData = currentProviderData?.models.find((model) => model.id === selectedModel) || currentProviderData?.models[0] || null;
  const selectedEditorPage = useMemo(
    () => editorPages.find((page) => page.id === selectedEditorPageId) ?? null,
    [editorPages, selectedEditorPageId]
  );

  const openProviderSelector = () => {
    setProviderMenuStep("providers");
    setProviderMenuProvider(aiProvider);
    setShowProviderMenu((current) => !current);
  };

  useEffect(() => {
    if (!isEditorRoute || !currentTenant?.id) {
      setEditorPages([]);
      setEditorPagesLoading(false);
      return;
    }

    let cancelled = false;
    setEditorPagesLoading(true);

    const loadPages = async () => {
      try {
        const response = await fetch(`/api/builder/pages?tenant_id=${currentTenant.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load pages");
        }

        if (!cancelled) {
          setEditorPages(Array.isArray(data.pages) ? data.pages : []);
        }
      } catch (error) {
        console.error("Failed to load editor pages:", error);
        if (!cancelled) {
          setEditorPages([]);
        }
      } finally {
        if (!cancelled) {
          setEditorPagesLoading(false);
        }
      }
    };

    void loadPages();

    return () => {
      cancelled = true;
    };
  }, [currentTenant?.id, isEditorRoute]);

  useEffect(() => {
    const updateEditableState = () => {
      const active = document.activeElement;
      if (!active || !(active instanceof HTMLElement)) {
        setHasEditableTarget(false);
        return;
      }

      const tag = active.tagName.toLowerCase();
      const editable =
        active.isContentEditable ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select";

      setHasEditableTarget(editable);
    };

    updateEditableState();
    document.addEventListener("focusin", updateEditableState);
    document.addEventListener("focusout", updateEditableState);
    document.addEventListener("click", updateEditableState);

    return () => {
      document.removeEventListener("focusin", updateEditableState);
      document.removeEventListener("focusout", updateEditableState);
      document.removeEventListener("click", updateEditableState);
    };
  }, []);

  const handleEditorPageChange = (nextPageId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", nextPageId);
    router.push(`/dashboard/editor?${nextParams.toString()}`);
  };

  const runNativeHistoryCommand = (command: "undo" | "redo") => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.focus();
    }

    try {
      document.execCommand(command);
    } catch {
      const keyboardEvent = new KeyboardEvent("keydown", {
        key: command === "undo" ? "z" : "y",
        ctrlKey: true,
        metaKey: true,
        bubbles: true,
      });
      active?.dispatchEvent(keyboardEvent);
    }
  };

  const handleUndo = () => {
    if (isEditorRoute) {
      undoEditor();
      return;
    }

    runNativeHistoryCommand("undo");
  };

  const handleRedo = () => {
    if (isEditorRoute) {
      redoEditor();
      return;
    }

    runNativeHistoryCommand("redo");
  };

  const canUndo = isEditorRoute ? editorCanUndo : hasEditableTarget;
  const canRedo = isEditorRoute ? editorCanRedo : hasEditableTarget;

  return (
    <header className="sticky top-0 z-[120] flex w-full min-w-0 max-w-full flex-col overflow-visible"
      style={{ background: "color-mix(in srgb, var(--c-bg-1) 80%, transparent)", backdropFilter: "blur(16px)" }}>

      {/* AI Status Bar */}
      {ai.active && (
        <div className="relative overflow-hidden" style={{ height: 32, background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
          {/* Progress bar */}
          {ai.progress >= 0 ? (
            <div className="absolute bottom-0 left-0 h-[2px] transition-all duration-300"
              style={{ width: `${ai.progress}%`, background: "var(--c-accent)" }} />
          ) : (
            <div className="absolute bottom-0 left-0 h-[2px] w-full">
              <div className="h-full animate-pulse" style={{
                background: "linear-gradient(90deg, transparent 0%, var(--c-accent) 50%, transparent 100%)",
                animation: "ai-slide 1.5s ease-in-out infinite",
              }} />
            </div>
          )}

          <div className="h-full flex items-center px-4 gap-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: "var(--c-accent)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--c-accent)" }}>IA</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: "var(--c-text-1)" }}>
              {ai.message}
            </span>
            {ai.provider && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto font-medium"
                style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}>
                {ai.provider}
              </span>
            )}
            {ai.progress >= 0 && (
              <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--c-text-3)" }}>
                {ai.progress}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main topbar */}
      <div className="h-14 flex w-full min-w-0 max-w-full items-center gap-2 overflow-visible px-3 lg:px-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition" style={{ color: "var(--c-text-2)" }}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="text-sm font-semibold min-w-0 truncate" style={{ color: "var(--c-text-0)" }}>{title}</h1>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
              title={isEditorRoute ? "Annulla ultima modifica del builder" : "Annulla ultima modifica del campo attivo"}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Annulla</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
              title={isEditorRoute ? "Ripeti ultima modifica del builder" : "Ripeti ultima modifica del campo attivo"}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Ripeti</span>
            </button>
          </div>

          {isEditorRoute && (
            <div
              className="hidden md:flex items-center gap-2 min-w-0 max-w-[250px] xl:max-w-[420px] rounded-lg px-2 py-1.5 border"
              style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)" }}
            >
              <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--c-text-3)" }}>
                Pagina
              </span>
              <select
                value={selectedEditorPageId}
                onChange={(e) => handleEditorPageChange(e.target.value)}
                data-ai-ignore-field-context="true"
                className="bg-transparent border-0 text-xs font-medium focus:outline-none min-w-0 w-[120px] lg:w-[160px] xl:w-[240px]"
                style={{ color: "var(--c-text-0)" }}
                disabled={editorPagesLoading || editorPages.length === 0}
              >
                {editorPagesLoading && <option value="">Caricamento pagine...</option>}
                {!editorPagesLoading && editorPages.length === 0 && <option value="">Nessuna pagina</option>}
                {!editorPagesLoading && editorPages.length > 0 && !selectedEditorPageId && (
                  <option value="">Seleziona una pagina</option>
                )}
                {editorPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title} {page.is_published ? "• Pubblicata" : "• Bozza"}
                  </option>
                ))}
              </select>
              {selectedEditorPage && (
                <span className="hidden xl:inline text-[11px] truncate max-w-[140px]" style={{ color: "var(--c-text-3)" }}>
                  /{selectedEditorPage.slug}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="hidden xl:flex items-center gap-2 rounded-lg px-3 py-1.5 w-52 shrink-0" style={{ background: "var(--c-bg-3)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
          <input type="text" placeholder="Cerca..." data-ai-ignore-field-context="true" className="bg-transparent border-0 text-sm focus:outline-none w-full" style={{ color: "var(--c-text-0)" }} />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--c-border)", color: "var(--c-text-3)" }}>/</kbd>
        </div>

        {/* AI Provider & Model Selector */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={openProviderSelector}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition border"
              style={{
                background: 'var(--c-bg-2)',
                color: 'var(--c-text-0)',
                borderColor: 'var(--c-border)',
              }}
            >
              {currentProviderData && <ProviderGlyph provider={currentProviderData.value} className="w-4 h-4" />}
              <span>Modelli</span>
              {selectedModelData && (
                <span className="hidden xl:inline max-w-[92px] truncate text-[11px]" style={{ color: "var(--c-text-3)" }}>
                  {selectedModelData.name}
                </span>
              )}
              <ChevronDown size={12} />
            </button>

            {showProviderMenu && (
              <div
                className="absolute top-full mt-2 right-0 rounded-lg shadow-lg overflow-hidden z-[9999] min-w-[260px]"
                style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
              >
                {providerMenuStep === "providers" ? (
                  <div className="p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: "var(--c-text-3)" }}>
                      Scegli provider
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {providers.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => {
                            setProviderMenuProvider(p.value);
                            setProviderMenuStep("models");
                          }}
                          className="flex flex-col items-center gap-2 px-3 py-3 border transition"
                          style={{
                            background: aiProvider === p.value ? "var(--c-accent-soft)" : "var(--c-bg-2)",
                            color: "var(--c-text-1)",
                            borderColor: aiProvider === p.value ? "var(--c-accent)" : "var(--c-border)",
                          }}
                        >
                          <ProviderGlyph provider={p.value} className="w-6 h-6" />
                          <span className="text-[11px] font-medium">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-2 border-b mb-1" style={{ borderColor: "var(--c-border)" }}>
                      <button
                        type="button"
                        onClick={() => setProviderMenuStep("providers")}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md"
                        style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <div className="flex items-center gap-2 min-w-0">
                        {providerMenuData && <ProviderGlyph provider={providerMenuData.value} className="w-5 h-5" />}
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--c-text-0)" }}>
                          {providerMenuData?.label}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {providerMenuData?.models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setAiProvider(providerMenuProvider);
                            setSelectedModel(model.id);
                            setShowProviderMenu(false);
                            setProviderMenuStep("providers");
                          }}
                          className="w-full text-left px-3 py-2 text-xs transition border"
                          style={{
                            background: selectedModel === model.id && aiProvider === providerMenuProvider ? 'var(--c-accent)' : 'transparent',
                            color: selectedModel === model.id && aiProvider === providerMenuProvider ? '#fff' : 'var(--c-text-1)',
                            borderColor: 'var(--c-border)',
                          }}
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedField && (
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: 'var(--c-bg-2)',
                color: 'var(--c-accent)',
                border: '1px solid var(--c-border)',
              }}
            >
              {selectedField.label || selectedField.name}
            </span>
          )}
        </div>

        <button className="w-8 h-8 flex items-center justify-center rounded-lg transition relative" style={{ color: "var(--c-text-2)" }}>
          <Bell className="w-4 h-4" />
        </button>

        {currentTenant && (
          <a
            href={currentTenant.domain ? `https://${currentTenant.domain}` : `/site/${currentTenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-white transition shrink-0"
            style={{ background: "var(--c-accent)" }}
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden xl:inline">Sito</span>
          </a>
        )}

        {profile && (
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className="text-xs font-medium leading-tight" style={{ color: "var(--c-text-0)" }}>{profile.full_name}</p>
              <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>{currentRole ? roleLabels[currentRole] : ""}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ai-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </header>
  );
}
