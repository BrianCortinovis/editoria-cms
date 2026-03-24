'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/store';

interface InputWithAiProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fieldName?: string;
  onAiResult?: (result: string) => void;
}

export const InputWithAi = forwardRef<HTMLInputElement, InputWithAiProps>(
  ({ className, label, error, id, fieldName, onAiResult, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const { currentTenant } = useAuthStore();
    const [showAiPopover, setShowAiPopover] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const handleAiSubmit = async () => {
      if (!prompt.trim() || !fieldName) return;

      setAiLoading(true);
      setAiResult('');

      try {
        const response = await fetch('/api/ai/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: currentTenant?.id,
            taskType: 'field-assist',
            prompt: `Campo: ${fieldName}\nValore attuale: ${value}\n\nRichiesta: ${prompt}\n\nRispondi SOLO con il nuovo valore del campo, senza spiegazioni aggiuntive.`,
          }),
        });

        const data = await response.json();
        if (data.content) {
          setAiResult(data.content);
          onAiResult?.(data.content);
        } else {
          setAiResult(`Errore: ${data.error}`);
        }
      } catch {
        setAiResult('Errore di connessione');
      } finally {
        setAiLoading(false);
      }
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-3 py-2 text-sm rounded-lg transition-colors',
              'border',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              className
            )}
            style={{
              background: 'var(--c-bg-3)',
              borderColor: error ? 'var(--c-danger)' : 'var(--c-border)',
              color: 'var(--c-text-0)',
            }}
            value={value}
            {...props}
          />

          {/* AI Button */}
          {fieldName && (
            <button
              type="button"
              onClick={() => setShowAiPopover(!showAiPopover)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors"
              style={{ color: 'var(--c-accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Sparkles size={16} />
            </button>
          )}

          {/* AI Popover */}
          {showAiPopover && fieldName && (
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-lg shadow-2xl z-50 overflow-hidden"
              style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}
            >
              <div
                className="flex items-center justify-between px-3 py-2 border-b"
                style={{ background: 'var(--c-bg-2)', borderColor: 'var(--c-border)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--c-text-0)' }}>
                  ✨ AI Assist
                </span>
                <button onClick={() => setShowAiPopover(false)} style={{ color: 'var(--c-text-2)' }}>
                  <X size={14} />
                </button>
              </div>

              <div className="p-2 space-y-2">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                  placeholder="Chiedi all'AI..."
                  disabled={aiLoading}
                  className="w-full px-2 py-1.5 text-xs rounded border"
                  style={{
                    background: 'var(--c-bg-0)',
                    borderColor: 'var(--c-border)',
                    color: 'var(--c-text-0)',
                  }}
                />
                <button
                  onClick={handleAiSubmit}
                  disabled={aiLoading || !prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--c-accent)' }}
                >
                  {aiLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'inherit' }} />
                      Elaborazione...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Genera
                    </>
                  )}
                </button>

                {aiResult && (
                  <div
                    className="p-2 rounded text-xs max-h-20 overflow-y-auto"
                    style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}
                  >
                    {aiResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <span className="text-xs" style={{ color: 'var(--c-danger)' }}>{error}</span>}
      </div>
    );
  }
);
InputWithAi.displayName = 'InputWithAi';
