'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useFieldContextStore } from '@/lib/stores/field-context-store';
import { X, Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { AIMessage } from '@/lib/ai/providers';
import toast from 'react-hot-toast';

export function GlobalAiChat() {
  const { currentTenant } = useAuthStore();
  const { selectedField, pageContext } = useFieldContextStore();

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: `Ciao! Sono il tuo assistente IA. Seleziona un campo nella pagina e potrò aiutarti a generare contenuto coerente con il contesto.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update system message when field changes
  useEffect(() => {
    if (selectedField) {
      const contextMsg = `
📍 Campo selezionato: ${selectedField.label || selectedField.name}
Valore attuale: "${selectedField.value}"
${
  pageContext.allFields && Object.keys(pageContext.allFields).length > 0
    ? `\nContesto della pagina:\n${Object.entries(pageContext.allFields)
        .slice(0, 5)
        .map(([k, v]) => `- ${k}: "${v}"`)
        .join('\n')}`
    : ''
}

Sono pronto ad aiutarti a generare contenuto per questo campo!`;

      if (messages.length === 1 || messages[messages.length - 1].role !== 'user') {
        setMessages((prev) => [
          prev[0],
          { role: 'assistant', content: contextMsg },
        ]);
      }
    }
  }, [selectedField, pageContext]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentTenant || !selectedField) {
      toast.error('Seleziona un campo nella pagina prima');
      return;
    }

    const newMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: inputValue },
    ];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    try {
      // Build context-aware prompt
      const contextualPrompt = `
Campo da compilare: ${selectedField.label || selectedField.name}
Tipo: ${selectedField.type}
Valore attuale: "${selectedField.value}"

Contesto della pagina:
${
  pageContext.allFields
    ? Object.entries(pageContext.allFields)
        .map(([k, v]) => `${k}: "${v}"`)
        .join('\n')
    : 'Nessun contesto disponibile'
}

Richiesta utente: ${inputValue}

IMPORTANTE: Rispondi SOLO con il nuovo valore per il campo "${selectedField.name}", senza spiegazioni, senza markdown, solo il contenuto puro.`;

      const response = await fetch('/api/ai/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'field-assist',
          prompt: contextualPrompt,
          systemPrompt: `Sei un assistente AI per un CMS editoriale. Aiuti l'utente a generare contenuti coerenti con il contesto della pagina. Quando generi contenuto, assicurati che sia coerente con gli altri campi della pagina. Rispondi sempre in italiano.`,
        }),
      });

      const data = await response.json();
      if (data.content) {
        const aiMessage: AIMessage = { role: 'assistant', content: data.content };
        setMessages((prev) => [...prev, aiMessage]);

        // Auto-copy to clipboard for easy paste
        await navigator.clipboard.writeText(data.content).catch(() => {});
        toast.success('✓ Contenuto generato! Pronto da incollare.');
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Errore: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Errore di connessione. Riprova.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 w-96 rounded-lg shadow-2xl flex flex-col"
      style={{
        background: 'var(--c-bg-1)',
        borderColor: 'var(--c-border)',
        border: '1px solid',
        height: expanded ? '600px' : '56px',
        transition: 'height 0.3s ease',
        zIndex: 9999,
      }}
    >
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-pointer"
        style={{ borderColor: 'var(--c-border)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: 'var(--c-accent)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--c-text-0)' }}>
            ✨ AI Assistant
          </span>
          {selectedField && (
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}>
              {selectedField.label || selectedField.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMessages([{ role: 'assistant', content: 'Chat cancellata. Come posso aiutarti?' }]);
            }}
            className="p-1 rounded transition-opacity"
            style={{ color: 'var(--c-text-2)' }}
            title="Cancella chat"
          >
            <X size={16} />
          </button>
          {expanded ? (
            <ChevronDown size={16} style={{ color: 'var(--c-text-2)' }} />
          ) : (
            <ChevronUp size={16} style={{ color: 'var(--c-text-2)' }} />
          )}
        </div>
      </div>

      {/* Content - Visible Only When Expanded */}
      {expanded && (
        <>
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ color: 'var(--c-text-0)' }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs px-3 py-2 rounded-lg text-sm break-words"
                  style={{
                    background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-bg-2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--c-text-0)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="text-xs p-2 rounded animate-pulse" style={{ color: 'var(--c-text-2)' }}>
                  💭 AI sta pensando...
                </div>
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
              placeholder={selectedField ? 'Scrivi un prompt...' : 'Seleziona un campo...'}
              disabled={loading || !selectedField}
              className="flex-1 text-sm px-3 py-2 rounded border focus:outline-none"
              style={{
                background: 'var(--c-bg-0)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text-0)',
                opacity: selectedField ? 1 : 0.6,
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim() || !selectedField}
              className="p-2 rounded transition-opacity disabled:opacity-50"
              style={{ background: 'var(--c-accent)', color: '#fff' }}
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
