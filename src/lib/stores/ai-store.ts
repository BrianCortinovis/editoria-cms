'use client';

import { create } from 'zustand';
import type { AiChatMessage, AiProvider } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

interface AiState {
  messages: AiChatMessage[];
  isLoading: boolean;
  activeProvider: AiProvider | null;
  fieldAssistOpen: boolean;
  fieldAssistTarget: {
    blockId: string;
    fieldName: string;
    fieldValue: string;
  } | null;

  // Actions
  addMessage: (role: 'user' | 'assistant' | 'system', content: string, provider?: AiProvider) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setActiveProvider: (provider: AiProvider | null) => void;
  openFieldAssist: (blockId: string, fieldName: string, fieldValue: string) => void;
  closeFieldAssist: () => void;
}

export const useAiStore = create<AiState>()((set) => ({
  messages: [],
  isLoading: false,
  activeProvider: null,
  fieldAssistOpen: false,
  fieldAssistTarget: null,

  addMessage: (role, content, provider) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: generateId(),
          role,
          content,
          timestamp: Date.now(),
          provider,
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveProvider: (activeProvider) => set({ activeProvider }),

  openFieldAssist: (blockId, fieldName, fieldValue) =>
    set({
      fieldAssistOpen: true,
      fieldAssistTarget: { blockId, fieldName, fieldValue },
    }),

  closeFieldAssist: () =>
    set({
      fieldAssistOpen: false,
      fieldAssistTarget: null,
    }),
}));
