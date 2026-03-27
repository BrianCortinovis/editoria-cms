import { callAI, type AIMessage, type AIProvider, type AIResponse } from "@/lib/ai/providers";
import { resolveProvider, type AITask } from "@/lib/ai/resolver";

type AIConfig = Record<string, string | undefined>;

const FALLBACK_ORDER: Record<AIProvider, AIProvider[]> = {
  claude: ["openai", "gemini", "ollama"],
  openai: ["claude", "gemini", "ollama"],
  gemini: ["openai", "claude", "ollama"],
  ollama: ["openai", "claude", "gemini"],
};

function getProviderRuntimeConfig(aiConfig: AIConfig, provider: AIProvider, preferredModel?: string) {
  if (provider === "ollama") {
    if (!aiConfig.ollama_url) {
      return null;
    }

    return {
      apiKey: aiConfig.ollama_url,
      model: preferredModel || aiConfig.ollama_model,
      ollamaUrl: aiConfig.ollama_url,
    };
  }

  const apiKey = aiConfig[`${provider}_api_key`];
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: preferredModel || aiConfig[`${provider}_model`],
  };
}

function buildProviderChain(primary: AIProvider) {
  return [primary, ...FALLBACK_ORDER[primary]].filter(
    (provider, index, list) => list.indexOf(provider) === index,
  );
}

export async function callAIWithFallback(params: {
  aiConfig: AIConfig;
  task: AITask;
  messages: AIMessage[];
  preferredProvider?: AIProvider;
  preferredModel?: string;
}) {
  const { aiConfig, task, messages, preferredProvider, preferredModel } = params;

  let primary = resolveProvider(aiConfig, task);

  if (preferredProvider) {
    const preferredConfig = getProviderRuntimeConfig(aiConfig, preferredProvider, preferredModel);
    if (!preferredConfig) {
      throw new Error(`Provider ${preferredProvider} non configurato`);
    }

    primary = {
      provider: preferredProvider,
      apiKey: preferredConfig.apiKey,
      model: preferredConfig.model,
    };
  } else if (preferredModel) {
    primary = {
      ...primary,
      model: preferredModel,
    };
  }

  let lastError: Error | null = null;
  const attempts: Array<{ provider: AIProvider; error: string | null }> = [];

  for (const provider of buildProviderChain(primary.provider)) {
    const runtime = getProviderRuntimeConfig(
      aiConfig,
      provider,
      provider === primary.provider ? primary.model : undefined,
    );

    if (!runtime) {
      attempts.push({ provider, error: "not-configured" });
      continue;
    }

    try {
      const result = await callAI(provider, messages, runtime);
      return {
        ...result,
        attempts,
        fallbackUsed: provider !== primary.provider,
      };
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      lastError = normalizedError;
      attempts.push({ provider, error: normalizedError.message });
    }
  }

  const attemptedProviders = attempts
    .map(({ provider, error }) => `${provider}: ${error || "unknown-error"}`)
    .join(" | ");

  const baseMessage = lastError?.message || "Nessun provider IA disponibile";
  throw new Error(`Tutti i provider IA hanno fallito. Primario: ${primary.provider}. Tentativi: ${attemptedProviders}. Ultimo errore: ${baseMessage}`);
}
