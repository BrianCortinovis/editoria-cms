"use client";

import { useState } from "react";
import { Menu, Bell, ExternalLink, Search, Sparkles, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useAIStatus } from "@/lib/ai-status";
import { useFieldContextStore } from "@/lib/stores/field-context-store";

export default function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const { profile, currentTenant, currentRole } = useAuthStore();
  const { selectedField } = useFieldContextStore();
  const ai = useAIStatus();
  const roleLabels: Record<string, string> = { super_admin: "Admin", chief_editor: "Capo", editor: "Redattore", contributor: "Collab.", advertiser: "Comm." };

  const [aiProvider, setAiProvider] = useState<'claude' | 'openai' | 'gemini'>('claude');
  const [showProviderMenu, setShowProviderMenu] = useState(false);

  const providers = [
    { value: 'claude', label: 'Claude', models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250805'] },
    { value: 'openai', label: 'GPT-4o', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { value: 'gemini', label: 'Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
  ] as const;

  const currentProviderData = providers.find(p => p.value === aiProvider);
  const [selectedModel, setSelectedModel] = useState(currentProviderData?.models[0] || '');

  return (
    <header className="sticky top-0 z-30 flex flex-col"
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
      <div className="h-14 flex items-center px-5 gap-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition" style={{ color: "var(--c-text-2)" }}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold flex-1" style={{ color: "var(--c-text-0)" }}>{title}</h1>

        <div className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 w-60" style={{ background: "var(--c-bg-3)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
          <input type="text" placeholder="Cerca..." className="bg-transparent border-0 text-sm focus:outline-none w-full" style={{ color: "var(--c-text-0)" }} />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--c-border)", color: "var(--c-text-3)" }}>/</kbd>
        </div>

        {/* AI Provider & Model Selector */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition border"
              style={{
                background: 'var(--c-bg-2)',
                color: 'var(--c-text-0)',
                borderColor: 'var(--c-border)',
              }}
            >
              <span>{currentProviderData?.label}</span>
              <ChevronDown size={12} />
            </button>

            {showProviderMenu && (
              <div
                className="absolute top-full mt-2 left-0 rounded-lg shadow-lg overflow-hidden z-50 min-w-max"
                style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
              >
                {providers.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      setAiProvider(p.value as any);
                      setSelectedModel(p.models[0]);
                      setShowProviderMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:opacity-70 transition border-b last:border-b-0"
                    style={{
                      background: aiProvider === p.value ? 'var(--c-accent)' : 'transparent',
                      color: aiProvider === p.value ? '#fff' : 'var(--c-text-1)',
                      borderColor: 'var(--c-border)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs rounded-lg px-2 py-1.5 border focus:outline-none"
            style={{
              background: 'var(--c-bg-2)',
              color: 'var(--c-text-0)',
              borderColor: 'var(--c-border)',
            }}
          >
            {currentProviderData?.models.map((model) => (
              <option key={model} value={model}>
                {model.split('-').slice(-1)[0]}
              </option>
            ))}
          </select>

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

        {currentTenant?.domain && (
          <a href={`https://${currentTenant.domain}`} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition"
            style={{ background: "var(--c-accent)" }}>
            <ExternalLink className="w-3 h-3" /> Sito
          </a>
        )}

        {profile && (
          <div className="hidden md:flex items-center gap-2">
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
