"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import { AVAILABLE_MODULES, type ModuleId } from "@/lib/modules";
import { Globe, Loader2, Lock, Mail, Package, Power, Save, Share2, Sparkles } from "lucide-react";
import AIButton from "@/components/ai/AIButton";

const iconMap: Record<string, typeof Sparkles> = {
  Sparkles,
  Mail,
  Lock,
  Share2,
  Globe,
};

export function PlatformModulesSettings() {
  const { currentTenant, currentRole } = useAuthStore();
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [moduleConfig, setModuleConfig] = useState<Record<string, Record<string, string>>>({});
  const [loadedSettings, setLoadedSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const isAdmin = currentRole === "admin";

  useEffect(() => {
    if (!currentTenant) return;
    const tenantId = currentTenant.id;
    const supabase = createClient();

    async function loadModuleSettings() {
      const { data, error } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .single();

      if (error) {
        toast.error("Errore caricamento moduli");
        return;
      }

      const settings = (data?.settings ?? {}) as Record<string, unknown>;
      setLoadedSettings(settings);
      setActiveModules((settings.active_modules as string[]) ?? []);
      setModuleConfig((settings.module_config as Record<string, Record<string, string>>) ?? {});
    }

    void loadModuleSettings();
  }, [currentTenant]);

  const toggleModule = (moduleId: ModuleId) => {
    setActiveModules((prev) => (prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]));
  };

  const updateConfig = (moduleId: string, key: string, value: string) => {
    setModuleConfig((prev) => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("tenants")
      .update({
        settings: {
          ...loadedSettings,
          active_modules: activeModules,
          module_config: moduleConfig,
        },
      })
      .eq("id", currentTenant.id);

    if (error) {
      toast.error(error.message);
    } else {
      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "settings" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Moduli salvati, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      setLoadedSettings((prev) => ({
        ...prev,
        active_modules: activeModules,
        module_config: moduleConfig,
      }));
      toast.success("Moduli salvati");
    }
    setSaving(false);
  };

  if (!currentTenant) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Seleziona un tenant attivo per gestire i moduli.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
        Solo gli Admin possono gestire i moduli del tenant.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Moduli premium del tenant
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Attivazione moduli e configurazione premium stanno nel profilo platform, non nella sidebar operativa del CMS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "module-plan",
                label: "Piano moduli",
                prompt: "Analizza moduli attivi e configurazioni del tenant e suggerisci quali moduli attivare o rifinire per newsroom, SEO, ADV e gestione: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                activeModules,
                moduleConfig,
              },
              null,
              2
            )}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "var(--c-accent)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva moduli
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {AVAILABLE_MODULES.map((mod) => {
          const Icon = iconMap[mod.icon] || Package;
          const isActive = activeModules.includes(mod.id);
          const isExpanded = expandedModule === mod.id;

          return (
            <div
              key={mod.id}
              className="rounded-2xl border"
              style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}
            >
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedModule(isExpanded ? null : mod.id)}>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ background: isActive ? "var(--c-accent-soft)" : "var(--c-bg-2)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: isActive ? "var(--c-accent)" : "var(--c-text-3)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {mod.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--c-text-2)" }}>
                    {mod.description}
                  </p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleModule(mod.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                  style={
                    isActive
                      ? { background: "rgba(78,202,106,0.12)", color: "var(--c-success)" }
                      : { background: "var(--c-bg-3)", color: "var(--c-text-2)" }
                  }
                >
                  <Power className="h-3.5 w-3.5" />
                  {isActive ? "Attivo" : "Disattivo"}
                </button>
              </div>

              {isExpanded && isActive && mod.id === "ai_assistant" ? (
                <div className="px-4 pb-4 pt-0">
                  <div className="rounded-xl p-4 text-xs leading-5" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                    Il modulo IA si attiva qui, ma API key, provider e modelli si configurano solo nella sezione <strong style={{ color: "var(--c-text-0)" }}>IA & API</strong> del profilo platform.
                  </div>
                </div>
              ) : null}

              {isExpanded && isActive && mod.id !== "ai_assistant" && mod.configFields ? (
                <div className="px-4 pb-4 pt-0">
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-2)" }}>
                    {mod.configFields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                          {field.label}
                        </label>
                        {field.type === "select" ? (
                          <select
                            value={moduleConfig[mod.id]?.[field.key] ?? ""}
                            onChange={(event) => updateConfig(mod.id, field.key, event.target.value)}
                            className="input w-full mt-1"
                          >
                            <option value="">Seleziona...</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option === "claude" ? "Claude (Anthropic)" : option === "openai" ? "OpenAI (GPT)" : option === "gemini" ? "Gemini (Google)" : option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.key.includes("key") ? "password" : "text"}
                            value={moduleConfig[mod.id]?.[field.key] ?? ""}
                            onChange={(event) => updateConfig(mod.id, field.key, event.target.value)}
                            className="input w-full mt-1"
                            placeholder={field.key.includes("key") ? "sk-..." : ""}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {isExpanded && !isActive ? (
                <div className="px-4 pb-4">
                  <p className="rounded-xl p-3 text-xs" style={{ background: "var(--c-bg-2)", color: "var(--c-text-3)" }}>
                    Attiva il modulo per configurarlo.
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
