"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { isModuleActive } from "@/lib/modules";
import { AlertCircle, CheckCircle, Clock, Loader2, Save, Sparkles } from "lucide-react";

interface AISettings {
  claude_api_key: string;
  claude_model: string;
  openai_api_key: string;
  openai_model: string;
  gemini_api_key: string;
  gemini_model: string;
  ollama_url: string;
  ollama_model: string;
}

interface ProviderConfig {
  name: string;
  key: "claude" | "openai" | "gemini" | "ollama";
  icon: string;
  models: string[];
  docs: string;
  isLocal?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "Claude (Anthropic)",
    key: "claude",
    icon: "🧠",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250805", "claude-haiku-4-5-20251001"],
    docs: "https://console.anthropic.com",
  },
  {
    name: "OpenAI",
    key: "openai",
    icon: "⚡",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"],
    docs: "https://platform.openai.com/api-keys",
  },
  {
    name: "Google Gemini",
    key: "gemini",
    icon: "✨",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    docs: "https://aistudio.google.com",
  },
  {
    name: "Ollama (Local)",
    key: "ollama",
    icon: "🐫",
    models: ["llama3.2", "mistral", "neural-chat"],
    docs: "https://ollama.ai",
    isLocal: true,
  },
];

const DEFAULT_MODELS = {
  claude: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  ollama: "llama3.2",
};

function cleanSecret(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function PlatformAISettings() {
  const { currentTenant, currentRole } = useAuthStore();
  const [settings, setSettings] = useState<AISettings>({
    claude_api_key: "",
    claude_model: DEFAULT_MODELS.claude,
    openai_api_key: "",
    openai_model: DEFAULT_MODELS.openai,
    gemini_api_key: "",
    gemini_model: DEFAULT_MODELS.gemini,
    ollama_url: "",
    ollama_model: DEFAULT_MODELS.ollama,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, "active" | "inactive" | "error">>({});
  const canManageAi = currentRole === "admin";
  const aiModuleEnabled = isModuleActive((currentTenant?.settings as Record<string, unknown>) || {}, "ai_assistant");

  useEffect(() => {
    if (!canManageAi || !currentTenant) {
      setLoading(false);
      return;
    }
    const tenantId = currentTenant.id;

    async function loadSettings() {
      const supabase = createClient();

      try {
        const { data: tenant } = await supabase.from("tenants").select("settings").eq("id", tenantId).single();

        if (tenant?.settings?.module_config?.ai_assistant) {
          const aiConfig = tenant.settings.module_config.ai_assistant;
          setSettings((prev) => ({
            ...prev,
            claude_api_key: cleanSecret(aiConfig.claude_api_key),
            claude_model: cleanValue(aiConfig.claude_model, DEFAULT_MODELS.claude),
            openai_api_key: cleanSecret(aiConfig.openai_api_key),
            openai_model: cleanValue(aiConfig.openai_model, DEFAULT_MODELS.openai),
            gemini_api_key: cleanSecret(aiConfig.gemini_api_key),
            gemini_model: cleanValue(aiConfig.gemini_model, DEFAULT_MODELS.gemini),
            ollama_url: cleanValue(aiConfig.ollama_url),
            ollama_model: cleanValue(aiConfig.ollama_model, DEFAULT_MODELS.ollama),
          }));
        }
      } catch (error) {
        console.error("Error loading AI settings:", error);
        toast.error("Errore caricamento impostazioni IA");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, [currentTenant, canManageAi]);

  const checkProviderStatus = (providerKey: string) => {
    const apiKey = cleanSecret(settings[`${providerKey}_api_key` as keyof AISettings]);
    if (!apiKey && providerKey !== "ollama") {
      setStatuses((prev) => ({ ...prev, [providerKey]: "inactive" }));
    } else if (providerKey !== "ollama" && apiKey.length < 10) {
      setStatuses((prev) => ({ ...prev, [providerKey]: "error" }));
    } else if (providerKey === "ollama" && !settings.ollama_url.trim()) {
      setStatuses((prev) => ({ ...prev, [providerKey]: "inactive" }));
    } else {
      setStatuses((prev) => ({ ...prev, [providerKey]: "active" }));
    }
  };

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();

    try {
      const { data: tenantData } = await supabase.from("tenants").select("settings").eq("id", currentTenant.id).single();
      const currentSettings = tenantData?.settings || {};
      const currentModuleConfig = currentSettings.module_config || {};

      const { error } = await supabase
        .from("tenants")
        .update({
          settings: {
            ...currentSettings,
            module_config: {
              ...currentModuleConfig,
              ai_assistant: {
                claude_api_key: cleanSecret(settings.claude_api_key),
                claude_model: cleanValue(settings.claude_model, DEFAULT_MODELS.claude),
                openai_api_key: cleanSecret(settings.openai_api_key),
                openai_model: cleanValue(settings.openai_model, DEFAULT_MODELS.openai),
                gemini_api_key: cleanSecret(settings.gemini_api_key),
                gemini_model: cleanValue(settings.gemini_model, DEFAULT_MODELS.gemini),
                ollama_url: cleanValue(settings.ollama_url),
                ollama_model: cleanValue(settings.ollama_model, DEFAULT_MODELS.ollama),
              },
            },
          },
        })
        .eq("id", currentTenant.id);

      if (error) throw error;
      toast.success("Impostazioni IA salvate");
    } catch (error) {
      console.error("Error saving AI settings:", error);
      toast.error("Errore nel salvataggio IA");
    } finally {
      setSaving(false);
    }
  };

  if (!currentTenant) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Seleziona un tenant attivo per configurare i provider IA.
      </div>
    );
  }

  if (!canManageAi) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Solo gli Admin possono gestire provider e credenziali IA del tenant.
      </div>
    );
  }

  if (!aiModuleEnabled) {
    return (
      <div className="rounded-2xl border px-4 py-6 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Il modulo IA non è attivo per questo tenant. Attivalo nella sezione Moduli del profilo platform.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6" style={{ color: "var(--c-accent)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Provider IA e API key
          </h3>
        </div>
        <p className="text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Le credenziali IA sono setup tecnico del tenant e restano solo qui nel profilo platform, fuori dalla sidebar operativa del CMS.
        </p>
      </div>

      {!settings.claude_api_key && !settings.openai_api_key && !settings.gemini_api_key && !settings.ollama_url ? (
        <div className="rounded-2xl border p-5" style={{ background: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
          <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--c-text-0)" }}>
            Nessun provider configurato
          </h4>
          <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
            Inserisci almeno una API key o un endpoint Ollama per abilitare assistenza editoriale, SEO, social e compilazione contenuti.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {PROVIDERS.map((provider) => (
          <div key={provider.key} className="rounded-2xl border p-6" style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h4 className="font-semibold" style={{ color: "var(--c-text-0)" }}>{provider.name}</h4>
                  {provider.isLocal ? (
                    <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Locale - Nessuna API key richiesta</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statuses[provider.key] === "active" ? (
                  <>
                    <CheckCircle className="h-5 w-5" style={{ color: "#10b981" }} />
                    <span className="text-xs font-medium" style={{ color: "#10b981" }}>Configurato</span>
                  </>
                ) : statuses[provider.key] === "error" ? (
                  <>
                    <AlertCircle className="h-5 w-5" style={{ color: "#ef4444" }} />
                    <span className="text-xs font-medium" style={{ color: "#ef4444" }}>Errore</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" style={{ color: "#f59e0b" }} />
                    <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>Non configurato</span>
                  </>
                )}
              </div>
            </div>

            {!provider.isLocal ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={settings[`${provider.key}_api_key` as keyof AISettings]}
                    onChange={(event) => {
                      setSettings((prev) => ({ ...prev, [`${provider.key}_api_key`]: event.target.value.trim() }));
                    }}
                    onBlur={() => checkProviderStatus(provider.key)}
                    placeholder="Incolla la tua API key qui..."
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--c-bg-0)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                  />
                  <a href={provider.docs} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs" style={{ color: "var(--c-accent)" }}>
                    → Come ottenere l&apos;API key
                  </a>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
                    Modello
                  </label>
                  <select
                    value={settings[`${provider.key}_model` as keyof AISettings]}
                    onChange={(event) => setSettings((prev) => ({ ...prev, [`${provider.key}_model`]: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--c-bg-0)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                  >
                    {provider.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
                    URL Ollama
                  </label>
                  <input
                    type="text"
                    value={settings.ollama_url}
                    onChange={(event) => setSettings((prev) => ({ ...prev, ollama_url: event.target.value.trim() }))}
                    onBlur={() => checkProviderStatus(provider.key)}
                    placeholder="es: http://192.168.1.100:11434"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--c-bg-0)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
                    Modello
                  </label>
                  <select
                    value={settings.ollama_model}
                    onChange={(event) => setSettings((prev) => ({ ...prev, ollama_model: event.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--c-bg-0)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                  >
                    {provider.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "var(--c-accent)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Salvataggio..." : "Salva impostazioni IA"}
        </button>
      </div>
    </section>
  );
}
