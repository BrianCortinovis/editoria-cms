// Module system for per-tenant premium features
// Each module can be activated/deactivated per tenant

export type ModuleId = "ai_assistant" | "newsletter" | "paywall" | "social_auto" | "multilingual" | "site_builder";

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
    description: "SEO, titoli, traduzione, social con IA. Ogni task usa il modello migliore (Claude, OpenAI, Gemini).",
    icon: "Sparkles",
    configFields: [
      { key: "ai_provider_default", label: "Provider predefinito", type: "select", options: ["claude", "openai", "gemini"] },
      { key: "claude_api_key", label: "API Key Claude (Anthropic)", type: "text" },
      { key: "claude_model", label: "Modello Claude", type: "text" },
      { key: "openai_api_key", label: "API Key OpenAI", type: "text" },
      { key: "openai_model", label: "Modello OpenAI", type: "text" },
      { key: "gemini_api_key", label: "API Key Gemini (Google)", type: "text" },
      { key: "gemini_model", label: "Modello Gemini", type: "text" },
      { key: "task_seo", label: "Task SEO → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
      { key: "task_titles", label: "Task Titoli → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
      { key: "task_social", label: "Task Social → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
      { key: "task_translate", label: "Task Traduzione → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
      { key: "task_summary", label: "Task Sommario → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
      { key: "task_layout", label: "Task Analisi Layout → Provider", type: "select", options: ["default", "claude", "openai", "gemini"] },
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
  {
    id: "site_builder",
    name: "Site Builder",
    description: "Costruisci il sito della testata con blocchi drag-and-drop, temi personalizzabili e preview live",
    icon: "Layout",
    configFields: [
      { key: "site_mode", label: "Modalità sito", type: "select", options: ["builder", "headless", "both"] },
      { key: "site_domain", label: "Dominio sito pubblico", type: "text" },
      { key: "site_subdomain", label: "Sottodominio (es. testata1)", type: "text" },
    ],
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
