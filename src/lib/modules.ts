// Module system for per-tenant premium features
// Each module can be activated/deactivated per tenant

export type ModuleId = "ai_assistant" | "newsletter" | "paywall" | "social_auto" | "multilingual";

export interface Module {
  id: ModuleId;
  name: string;
  description: string;
  icon: string; // lucide icon name
  configFields?: { key: string; label: string; type: "text" | "select" | "boolean"; options?: string[] }[];
}

export const AVAILABLE_MODULES: Module[] = [
  {
    id: "ai_assistant",
    name: "AI Assistant",
    description: "SEO automatico, suggerimento titoli, traduzione, post social con IA (Claude, OpenAI o Gemini)",
    icon: "Sparkles",
    configFields: [
      { key: "ai_provider", label: "Provider IA", type: "select", options: ["claude", "openai", "gemini"] },
      { key: "ai_api_key", label: "API Key", type: "text" },
      { key: "ai_model", label: "Modello (opzionale)", type: "text" },
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Iscrizione newsletter, template email, invio automatico digest settimanale",
    icon: "Mail",
  },
  {
    id: "paywall",
    name: "Paywall & Abbonamenti",
    description: "Articoli premium, piani abbonamento, integrazione Stripe",
    icon: "Lock",
  },
  {
    id: "social_auto",
    name: "Auto-Post Social",
    description: "Pubblicazione automatica su Facebook, Instagram, Telegram alla pubblicazione articolo",
    icon: "Share2",
  },
  {
    id: "multilingual",
    name: "Multilingua",
    description: "Traduzione articoli IT/EN, URL localizzati, hreflang automatico",
    icon: "Globe",
  },
];

// Check if a module is active for a tenant
export function isModuleActive(tenantSettings: Record<string, unknown>, moduleId: ModuleId): boolean {
  const modules = (tenantSettings?.active_modules as string[]) ?? [];
  return modules.includes(moduleId);
}

// Get module config from tenant settings
export function getModuleConfig(tenantSettings: Record<string, unknown>, moduleId: ModuleId): Record<string, string> {
  const config = (tenantSettings?.module_config as Record<string, Record<string, string>>) ?? {};
  return config[moduleId] ?? {};
}
