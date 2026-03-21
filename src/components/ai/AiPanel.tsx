'use client';

import { useEffect, useState, useRef } from 'react';
import { useUiStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/store';
import { X, Sparkles, Send } from 'lucide-react';
import type { AIMessage, AIProvider } from '@/lib/ai/providers';
import { QUICK_PROMPTS } from '@/lib/ai/prompts';

type QuickAction = keyof typeof QUICK_PROMPTS;

const QUICK_ACTIONS: { key: QuickAction; label: string; icon: string }[] = [
  { key: 'seo', label: 'SEO', icon: '🔍' },
  { key: 'titles', label: 'Titoli', icon: '📝' },
  { key: 'social', label: 'Social', icon: '📱' },
  { key: 'translate', label: 'Traduci', icon: '🌐' },
  { key: 'summary', label: 'Riassumi', icon: '📄' },
  { key: 'content', label: 'Contenuto', icon: '✨' },
];

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'claude', label: 'Claude' },
  { value: 'openai', label: 'GPT-4o' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'ollama', label: 'Ollama (Locale)' },
];

export function AiPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useUiStore();
  const { currentTenant } = useAuthStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('claude');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (aiPanelOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Ciao! Sono il tuo assistente AI per ${currentTenant?.name || 'il CMS'}. Come posso aiutarti?`,
        },
      ]);
    }
  }, [aiPanelOpen, currentTenant?.name]);

  const handleQuickAction = async (action: QuickAction) => {
    if (!currentTenant) return;

    const prompt = QUICK_PROMPTS[action];
    const newMessages: AIMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          tenant_id: currentTenant.id,
          provider: selectedProvider,
          context: { pageTitle: 'Page Editor' },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Chat failed');
      }

      const data = await response.json();
      const updatedMessages: AIMessage[] = [...newMessages, { role: 'assistant', content: data.text }];
      setMessages(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentTenant || loading) return;

    const newMessages: AIMessage[] = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          tenant_id: currentTenant.id,
          provider: selectedProvider,
          context: { pageTitle: 'Page Editor' },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Chat failed');
      }

      const data = await response.json();
      const updatedMessages: AIMessage[] = [...newMessages, { role: 'assistant', content: data.text }];
      setMessages(updatedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!aiPanelOpen) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 w-[420px] h-[600px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl flex flex-col z-50"
      style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--c-accent)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--c-text-0)' }}>
            ✨ AI Assistant
          </h3>
        </div>
        <button
          onClick={() => setAiPanelOpen(false)}
          className="p-1 rounded hover:opacity-60 transition"
          style={{ color: 'var(--c-text-2)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Provider Selector */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderColor: 'var(--c-border)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>
          Modello:
        </span>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
          className="text-xs px-2 py-1 rounded border"
          style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)', color: 'var(--c-text-0)' }}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 flex-wrap">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => handleQuickAction(action.key)}
            disabled={loading}
            className="text-xs px-2 py-1 rounded border transition hover:opacity-80 disabled:opacity-50"
            style={{
              background: 'var(--c-bg-2)',
              borderColor: 'var(--c-border)',
              color: 'var(--c-text-0)',
            }}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ color: 'var(--c-text-0)' }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'rounded-br-none'
                  : 'rounded-bl-none'
              }`}
              style={{
                background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-bg-2)',
                color: msg.role === 'user' ? '#fff' : 'var(--c-text-0)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {error && (
          <div className="text-xs p-2 rounded" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            ❌ {error}
          </div>
        )}
        {loading && (
          <div className="text-xs p-2 rounded animate-pulse" style={{ color: 'var(--c-text-2)' }}>
            💭 AI sta pensando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t flex gap-2"
        style={{ borderColor: 'var(--c-border)' }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Scrivi un prompt..."
          disabled={loading}
          className="flex-1 text-sm px-3 py-2 rounded border focus:outline-none"
          style={{
            background: 'var(--c-bg-0)',
            borderColor: 'var(--c-border)',
            color: 'var(--c-text-0)',
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-2 rounded transition disabled:opacity-50"
          style={{ background: 'var(--c-accent)', color: '#fff' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
