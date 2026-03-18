export type AIProvider = "claude" | "openai" | "gemini";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

interface ProviderConfig {
  apiKey: string;
  model?: string;
}

// ========================
// CLAUDE (Anthropic)
// ========================
async function callClaude(
  messages: AIMessage[],
  config: ProviderConfig
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const model = config.model || "claude-sonnet-4-20250514";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemMsg,
      messages: userMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return {
    text: data.content?.[0]?.text || "",
    provider: "claude",
    model,
    usage: data.usage
      ? {
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
        }
      : undefined,
  };
}

// ========================
// OPENAI
// ========================
async function callOpenAI(
  messages: AIMessage[],
  config: ProviderConfig
): Promise<AIResponse> {
  const model = config.model || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    provider: "openai",
    model,
    usage: data.usage
      ? {
          input_tokens: data.usage.prompt_tokens,
          output_tokens: data.usage.completion_tokens,
        }
      : undefined,
  };
}

// ========================
// GEMINI (Google)
// ========================
async function callGemini(
  messages: AIMessage[],
  config: ProviderConfig
): Promise<AIResponse> {
  const model = config.model || "gemini-2.0-flash";
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: systemMsg
          ? { parts: [{ text: systemMsg }] }
          : undefined,
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    text,
    provider: "gemini",
    model,
    usage: data.usageMetadata
      ? {
          input_tokens: data.usageMetadata.promptTokenCount || 0,
          output_tokens: data.usageMetadata.candidatesTokenCount || 0,
        }
      : undefined,
  };
}

// ========================
// DISPATCH
// ========================
export async function callAI(
  provider: AIProvider,
  messages: AIMessage[],
  config: ProviderConfig
): Promise<AIResponse> {
  switch (provider) {
    case "claude":
      return callClaude(messages, config);
    case "openai":
      return callOpenAI(messages, config);
    case "gemini":
      return callGemini(messages, config);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
