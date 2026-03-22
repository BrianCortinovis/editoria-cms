'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

const BLOCK_LIST = 'section, hero, text, columns, container, image-gallery, video, slideshow, carousel, quote, accordion, tabs, social, newsletter, banner-ad, related-content, author-bio, timeline, counter, divider';

const EXAMPLE_PROMPTS = [
  'Fammi una home giornalistica con hero e sezioni di notizie',
  'Crea una pagina di articolo con testo e immagini',
  'Quali sono i tuoi block types disponibili?',
  'Crea un layout per un editoriale con citazione',
];

export default function AiDebugPage() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleTest = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setLogs('⏳ Invio richiesta...\n');
    setResponse('');

    try {
      const res = await fetch('/api/ai/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemPrompt,
          blockList: BLOCK_LIST,
        }),
      });

      const data = await res.json();
      setLogs(data.logs || '');
      setResponse(data.content || data.error || 'Nessuna risposta');
    } catch (err) {
      setLogs(`❌ Errore: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className="w-full h-full p-6 overflow-auto" style={{ background: 'var(--c-bg-0)' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--c-text-0)' }}>
          AI Debug Console
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>
                Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Scrivi il tuo prompt qui..."
                className="w-full h-32 text-sm px-3 py-2 rounded border focus:outline-none resize-none"
                style={{
                  background: 'var(--c-bg-0)',
                  borderColor: 'var(--c-border)',
                  color: 'var(--c-text-0)',
                }}
              />
            </div>

            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>
                System Prompt (opzionale)
              </h2>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Lascia vuoto per default..."
                className="w-full h-24 text-sm px-3 py-2 rounded border focus:outline-none resize-none"
                style={{
                  background: 'var(--c-bg-0)',
                  borderColor: 'var(--c-border)',
                  color: 'var(--c-text-0)',
                }}
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
              style={{ background: 'var(--c-accent)', color: '#fff' }}
            >
              <Send size={16} />
              {loading ? 'Elaborazione...' : 'Test'}
            </button>

            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>
                Quick Prompts
              </h3>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(ex)}
                    className="w-full text-left text-xs p-2 rounded transition hover:opacity-80"
                    style={{ background: 'var(--c-bg-0)', color: 'var(--c-text-1)' }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>
                Available Blocks
              </h3>
              <div className="text-xs space-y-1" style={{ color: 'var(--c-text-2)' }}>
                {BLOCK_LIST.split(', ').map((block) => (
                  <div key={block}>• {block}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Logs Panel */}
          <div className="lg:col-span-1 rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>
              Logs Realtime
            </h2>
            <div
              className="w-full h-96 text-xs p-3 rounded font-mono overflow-y-auto whitespace-pre-wrap break-words"
              style={{
                background: 'var(--c-bg-0)',
                color: 'var(--c-text-1)',
                borderColor: 'var(--c-border)',
                border: '1px solid var(--c-border)',
              }}
            >
              {logs || '(Logs appariranno qui)'}
            </div>
          </div>

          {/* Response Panel */}
          <div className="lg:col-span-1 rounded-lg p-4" style={{ background: 'var(--c-bg-1)', border: '1px solid var(--c-border)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--c-text-0)' }}>
              Response
            </h2>
            <div
              className="w-full h-96 text-xs p-3 rounded font-mono overflow-y-auto whitespace-pre-wrap break-words"
              style={{
                background: 'var(--c-bg-0)',
                color: 'var(--c-text-1)',
                borderColor: 'var(--c-border)',
                border: '1px solid var(--c-border)',
              }}
            >
              {response || '(La risposta apparirà qui)'}
            </div>

            {response && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(response);
                  alert('Copiato!');
                }}
                className="mt-3 w-full px-3 py-2 text-xs rounded transition"
                style={{ background: 'var(--c-bg-0)', color: 'var(--c-accent)', border: '1px solid var(--c-border)' }}
              >
                Copia Risposta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
