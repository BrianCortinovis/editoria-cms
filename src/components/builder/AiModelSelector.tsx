'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Check, ChevronDown, Zap, Brain, Cpu, Server } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type AiMode = 'claude' | 'gemini' | 'openai' | 'ollama' | 'combo-2' | 'combo-3';

interface AiModel {
  id: AiMode;
  name: string;
  description: string;
  icon: typeof Bot;
  color: string;
  providers?: string[];
}

const AI_MODELS: AiModel[] = [
  { id: 'gemini', name: 'Gemini', description: 'Google - Contenuti & SEO', icon: Brain, color: '#4285f4' },
  { id: 'claude', name: 'Claude', description: 'Anthropic - Codice & Layout', icon: Bot, color: '#cc785c' },
  { id: 'openai', name: 'GPT-4o', description: 'OpenAI - Creativo & Immagini', icon: Zap, color: '#10a37f' },
  { id: 'ollama', name: 'Ollama', description: 'Locale - Veloce & Privato', icon: Server, color: '#888888' },
  { id: 'combo-2', name: 'Combo x2', description: 'Gemini + OpenAI insieme', icon: Cpu, color: '#8b5cf6', providers: ['gemini', 'openai'] },
  { id: 'combo-3', name: 'Combo x3', description: 'Claude + Gemini + OpenAI', icon: Cpu, color: '#ec4899', providers: ['claude', 'gemini', 'openai'] },
];

interface AiModelSelectorProps {
  value: AiMode;
  onChange: (mode: AiMode) => void;
}

export function AiModelSelector({ value, onChange }: AiModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AI_MODELS.find(m => m.id === value) || AI_MODELS[0];
  const Icon = currentModel.icon;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
          'border border-zinc-200 dark:border-zinc-700',
          'hover:border-zinc-400 dark:hover:border-zinc-500',
          'bg-white dark:bg-zinc-900'
        )}
        title={`Modello AI: ${currentModel.name}`}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentModel.color }} />
        <span className="text-zinc-700 dark:text-zinc-300 hidden xl:inline">{currentModel.name}</span>
        <ChevronDown size={10} className="text-zinc-400" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 z-[100] overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700">
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Seleziona Modello AI
            </span>
          </div>

          <div className="p-1">
            {AI_MODELS.map((model) => {
              const ModelIcon = model.icon;
              const isActive = value === model.id;
              const isCombo = model.id.startsWith('combo');

              return (
                <button
                  key={model.id}
                  onClick={() => { onChange(model.id); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  )}
                >
                  <div
                    className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isCombo && 'relative')}
                    style={{ backgroundColor: model.color + '20' }}
                  >
                    <ModelIcon size={16} style={{ color: model.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{model.name}</span>
                      {isCombo && (
                        <span className="text-[8px] px-1 py-px rounded bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-bold">
                          COMBO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500">{model.description}</span>
                    {model.providers && (
                      <div className="flex gap-1 mt-0.5">
                        {model.providers.map(p => (
                          <span key={p} className="text-[8px] px-1 py-px rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isActive && <Check size={14} className="text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-700">
            <p className="text-[9px] text-zinc-400">
              Combo invia la richiesta a piu modelli e unisce i risultati migliori.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
