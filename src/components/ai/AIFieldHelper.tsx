'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Sparkles, Loader2, Copy, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIFieldHelperProps {
  fieldName: string;
  fieldValue?: string;
  fieldType?: 'text' | 'textarea' | 'title' | 'description' | 'meta' | 'custom';
  context?: Record<string, any> | string;
  onGenerate?: (result: string) => void;
  className?: string;
  compact?: boolean;
}

export const AIFieldHelper = ({
  fieldName,
  fieldValue,
  fieldType = 'text',
  context,
  onGenerate,
  className = '',
  compact = false,
}: AIFieldHelperProps) => {
  const { currentTenant } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [style, setStyle] = useState<'auto' | 'journalist' | 'publication'>('auto');

  const generateContent = async () => {
    if (!currentTenant) {
      toast.error('Tenant non configurato');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          fieldName,
          fieldType,
          context,
          currentValue: fieldValue,
          style,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      toast.success('Contenuto generato!');
    } catch (error) {
      toast.error('Errore nella generazione');
    } finally {
      setLoading(false);
    }
  };

  const applyResult = () => {
    if (result && onGenerate) {
      onGenerate(result);
      setOpen(false);
      setResult('');
      toast.success('Applicato!');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center p-1.5 rounded transition-colors ${className}`}
        style={{ color: 'var(--c-accent)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-accent-soft)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <Sparkles size={compact ? 16 : 18} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-xl max-w-2xl w-full" style={{ background: 'var(--c-bg-1)' }}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <div className="flex items-center gap-2">
                <Wand2 size={20} style={{ color: 'var(--c-accent)' }} />
                <h2 className="text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>Genera Contenuto</h2>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>Campo: {fieldName}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--c-text-1)' }}>Stile</label>
                <div className="flex gap-2">
                  {['auto', 'journalist', 'publication'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s as any)}
                      className="px-3 py-2 rounded text-sm font-medium transition-colors"
                      style={{
                        background: style === s ? 'var(--c-accent)' : 'var(--c-bg-2)',
                        color: style === s ? 'white' : 'var(--c-text-1)',
                      }}
                    >
                      {s === 'auto' ? 'Auto' : s === 'journalist' ? 'Giornalista' : 'Rivista'}
                    </button>
                  ))}
                </div>
              </div>

              {result ? (
                <div>
                  <div className="p-3 rounded text-sm" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}>{result}</div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={applyResult} className="flex-1 text-white py-2 rounded transition-colors" style={{ background: 'var(--c-accent)' }}>
                      Applica
                    </button>
                    <button onClick={() => setResult('')} className="flex-1 py-2 rounded transition-colors" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}>
                      Cancella
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateContent}
                  disabled={loading}
                  className="w-full text-white py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  style={{ background: 'var(--c-accent)' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? 'Generazione...' : 'Genera'}
                </button>
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'var(--c-border)' }}>
              <button onClick={() => setOpen(false)} className="w-full transition-colors" style={{ color: 'var(--c-text-1)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-0)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-1)')}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIFieldHelper;
