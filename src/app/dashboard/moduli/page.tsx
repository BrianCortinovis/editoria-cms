"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import { AVAILABLE_MODULES, type ModuleId } from "@/lib/modules";
import toast from "react-hot-toast";
import {
  Sparkles,
  Mail,
  Lock,
  Share2,
  Globe,
  Power,
  Save,
  Loader2,
  Package,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

const iconMap: Record<string, typeof Sparkles> = {
  Sparkles, Mail, Lock, Share2, Globe,
};

export default function ModuliPage() {
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
    setActiveModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const updateConfig = (moduleId: string, key: string, value: string) => {
    setModuleConfig(prev => ({
      ...prev,
      [moduleId]: { ...(prev[moduleId] ?? {}), [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!currentTenant) return;
    setSaving(true);
    const supabase = createClient();
    const existingSettings = loadedSettings;

    const { error } = await supabase.from("tenants").update({
      settings: {
        ...existingSettings,
        active_modules: activeModules,
        module_config: moduleConfig,
      },
    }).eq("id", currentTenant.id);

    if (error) toast.error(error.message);
    else {
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

  if (!isAdmin) {
    return (
      <div className="max-w-2xl text-center py-20">
        <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Solo gli Admin possono gestire i moduli</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
            Attiva moduli premium per questa testata. Ogni modulo richiede configurazione separata.
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
              {
                id: "module-risk-check",
                label: "Controllo dipendenze",
                prompt: "Controlla dipendenze, moduli disattivi critici, configurazioni mancanti e rischi operativi del CMS in questa pagina moduli: {context}",
              },
            ]}
            contextData={JSON.stringify({
              tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
              activeModules,
              moduleConfig,
              availableModules: AVAILABLE_MODULES.map((mod) => ({
                id: mod.id,
                name: mod.name,
                description: mod.description,
                configFields: mod.configFields?.map((field) => field.key) || [],
              })),
            }, null, 2)}
          />
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva
          </button>
        </div>
      </div>

      {AVAILABLE_MODULES.map(mod => {
        const Icon = iconMap[mod.icon] || Package;
        const isActive = activeModules.includes(mod.id);
        const isExpanded = expandedModule === mod.id;

        return (
          <div key={mod.id} className="card">
            <div
              className="flex items-center gap-4 p-4 cursor-pointer"
              onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isActive ? "var(--c-accent-soft)" : "var(--c-bg-2)" }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? "var(--c-accent)" : "var(--c-text-3)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{mod.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-2)" }}>{mod.description}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleModule(mod.id); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={isActive
                  ? { background: "rgba(78,202,106,0.12)", color: "var(--c-success)" }
                  : { background: "var(--c-bg-3)", color: "var(--c-text-2)" }}
              >
                <Power className="w-3.5 h-3.5" />
                {isActive ? "Attivo" : "Disattivo"}
              </button>
            </div>

            {/* Config fields */}
            {isExpanded && isActive && mod.configFields && (
              <div className="px-4 pb-4 pt-0">
                <div className="p-4 rounded-lg space-y-3" style={{ background: "var(--c-bg-2)" }}>
                  {mod.configFields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                        {field.label}
                      </label>
                      {field.type === "select" ? (
                        <select
                          value={moduleConfig[mod.id]?.[field.key] ?? ""}
                          onChange={e => updateConfig(mod.id, field.key, e.target.value)}
                          className="input w-full mt-1"
                        >
                          <option value="">Seleziona...</option>
                          {field.options?.map(o => (
                            <option key={o} value={o}>{o === "claude" ? "Claude (Anthropic)" : o === "openai" ? "OpenAI (GPT)" : o === "gemini" ? "Gemini (Google)" : o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.key.includes("key") ? "password" : "text"}
                          value={moduleConfig[mod.id]?.[field.key] ?? ""}
                          onChange={e => updateConfig(mod.id, field.key, e.target.value)}
                          placeholder={field.key.includes("key") ? "sk-..." : ""}
                          className="input w-full mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isExpanded && !isActive && (
              <div className="px-4 pb-4">
                <p className="text-xs p-3 rounded-lg" style={{ background: "var(--c-bg-2)", color: "var(--c-text-3)" }}>
                  Attiva il modulo per configurarlo.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
