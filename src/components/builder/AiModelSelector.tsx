'use client';

// AI Model selector stub
export function AiModelSelector(_props: { value?: AiMode; onChange?: (v: AiMode) => void }) {
  return null;
}

export type AiMode = 'claude' | 'openai' | 'gemini';

export function useAiModelStore() {
  return { selectedModel: 'claude' as AiMode, setModel: () => {} };
}
