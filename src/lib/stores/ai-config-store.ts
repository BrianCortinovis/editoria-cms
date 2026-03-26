import { create } from 'zustand';

export type AIProvider = 'claude' | 'openai' | 'gemini';

interface AIConfigState {
  provider: AIProvider;
  model: string;
  setProvider: (provider: AIProvider) => void;
  setModel: (model: string) => void;
  setConfig: (provider: AIProvider, model: string) => void;
}

export const useAIConfigStore = create<AIConfigState>((set) => ({
  provider: 'claude',
  model: 'claude-sonnet-4-20250514',
  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),
  setConfig: (provider, model) => set({ provider, model }),
}));
