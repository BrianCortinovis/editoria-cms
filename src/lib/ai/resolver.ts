import type { AIProvider } from "./providers";

export type AITask = "seo" | "titles" | "social" | "translate" | "summary" | "layout" | "search" | "related" | "summarize" | "chatbot" | "field-assist" | "color-palette";

// Default best provider per task (opinionated)
const BEST_PROVIDER_PER_TASK: Record<AITask, AIProvider> = {
  seo: "openai",        // GPT is great at structured SEO output
  titles: "claude",      // Claude excels at creative writing
  social: "gemini",      // Gemini is fast and good for short-form
  translate: "claude",   // Claude produces natural translations
  summary: "openai",     // GPT is solid for summarization
  layout: "claude",      // Claude is best at code analysis
  search: "openai",      // GPT is fast for semantic matching
  related: "claude",     // Claude understands content similarity well
  summarize: "openai",   // GPT is solid for summarization
  chatbot: "claude",     // Claude excels at conversational AI
  "field-assist": "openai",
  "color-palette": "openai",
};

interface AIConfig {
  ai_provider_default?: string;
  claude_api_key?: string;
  claude_model?: string;
  openai_api_key?: string;
  openai_model?: string;
  gemini_api_key?: string;
  gemini_model?: string;
  ollama_url?: string;
  ollama_model?: string;
  [key: string]: string | undefined;
}

export interface ResolvedProvider {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

/**
 * Resolves which provider to use for a given task.
 * Priority:
 * 1. Task-specific override (task_seo, task_titles, etc.)
 * 2. Default provider setting
 * 3. Best provider for that task type
 * 4. Whichever provider has an API key configured
 */
export function resolveProvider(config: AIConfig, task: AITask): ResolvedProvider {
  // 1. Check task-specific override
  const taskOverride = config[`task_${task}`];
  if (taskOverride && taskOverride !== "default") {
    const resolved = getProviderCredentials(config, taskOverride as AIProvider);
    if (resolved) return resolved;
  }

  // 2. Check default provider
  const defaultProvider = config.ai_provider_default as AIProvider | undefined;
  if (defaultProvider) {
    const resolved = getProviderCredentials(config, defaultProvider);
    if (resolved) return resolved;
  }

  // 3. Try best provider for this task
  const best = BEST_PROVIDER_PER_TASK[task];
  const bestResolved = getProviderCredentials(config, best);
  if (bestResolved) return bestResolved;

  // 4. Fallback: use whichever provider has a key
  for (const p of ["claude", "openai", "gemini", "ollama"] as AIProvider[]) {
    const resolved = getProviderCredentials(config, p);
    if (resolved) return resolved;
  }

  // Legacy support: old single-key format
  if (config.ai_api_key) {
    return {
      provider: (config.ai_provider || "openai") as AIProvider,
      apiKey: config.ai_api_key,
      model: config.ai_model,
    };
  }

  throw new Error("No AI provider configured. Add at least one API key in Modules > AI Assistant.");
}

function getProviderCredentials(config: AIConfig, provider: AIProvider): ResolvedProvider | null {
  // Ollama uses ollamaUrl instead of apiKey
  if (provider === 'ollama') {
    const ollamaUrl = config.ollama_url;
    if (!ollamaUrl) return null;
    return { provider, apiKey: ollamaUrl, model: config.ollama_model || undefined };
  }

  const keyField = `${provider}_api_key`;
  const modelField = `${provider}_model`;
  const apiKey = config[keyField];
  if (!apiKey) return null;
  return { provider, apiKey, model: config[modelField] || undefined };
}
