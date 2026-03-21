import type { Block, PageData } from './index';

// === AI Providers ===
export type AiProvider = 'claude' | 'gemini' | 'openai' | 'ollama';

// === AI Task Types (mapped to best provider) ===
export type AiTaskType =
  // Code tasks → Claude CLI
  | 'generate-html'
  | 'generate-css'
  | 'suggest-layout'
  | 'debug-code'
  | 'generate-block'
  // Content tasks → Gemini
  | 'write-content'
  | 'seo-optimize'
  | 'generate-headline'
  | 'translate'
  // Creative tasks → OpenAI
  | 'image-alt-text'
  | 'creative-suggest'
  | 'color-palette'
  | 'image-prompt'
  // Graphics tasks → OpenAI/Claude/Gemini
  | 'suggest-gradient'
  | 'suggest-clip-path'
  | 'suggest-animation'
  | 'suggest-effects'
  | 'suggest-divider'
  // Realtime tasks → Ollama
  | 'autocomplete'
  | 'quick-rewrite'
  // Generic
  | 'field-assist'
  | 'chat';

// === AI Context ===
export interface AiContext {
  currentPage?: PageData;
  selectedBlock?: Block;
  fieldName?: string;
  fieldValue?: string;
  surroundingBlocks?: Block[];
  projectName?: string;
  customInstructions?: string;
}

// === AI Request ===
export interface AiRequest {
  taskType: AiTaskType;
  prompt: string;
  context?: AiContext;
  stream?: boolean;
  preferredProvider?: AiProvider;
}

// === AI Response ===
export interface AiResponse {
  content: string;
  provider: AiProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
  error?: string;
}

// === AI Chat Message ===
export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: AiProvider;
}

// === Field Assist Quick Action ===
export interface AiQuickAction {
  label: string;
  icon: string;
  taskType: AiTaskType;
  promptTemplate: string;
}

// === Provider Config ===
export interface AiProviderConfig {
  provider: AiProvider;
  enabled: boolean;
  model: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
}

// === Task → Provider Mapping ===
export const TASK_PROVIDER_MAP: Record<AiTaskType, AiProvider> = {
  'generate-html': 'claude',
  'generate-css': 'claude',
  'suggest-layout': 'claude',
  'debug-code': 'claude',
  'generate-block': 'claude',
  'write-content': 'gemini',
  'seo-optimize': 'gemini',
  'generate-headline': 'gemini',
  'translate': 'gemini',
  'image-alt-text': 'openai',
  'creative-suggest': 'openai',
  'color-palette': 'openai',
  'image-prompt': 'openai',
  'suggest-gradient': 'openai',
  'suggest-clip-path': 'claude',
  'suggest-animation': 'gemini',
  'suggest-effects': 'openai',
  'suggest-divider': 'gemini',
  'autocomplete': 'ollama',
  'quick-rewrite': 'ollama',
  'field-assist': 'gemini',
  'chat': 'gemini',
};
