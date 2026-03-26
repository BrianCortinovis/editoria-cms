'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { usePageStore } from '@/lib/stores/page-store';
import { isModuleActive } from '@/lib/modules';
import toast from 'react-hot-toast';
import type { Block } from '@/lib/types';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt: string;
  contextData?: string;
  systemPrompt?: string;
  onApply: (result: string) => void;
  title?: string;
  blockId?: string;
  fieldName?: string;
}

const JSON_FIELD_NAMES = new Set([
  'layout',
  'background',
  'typography',
  'border',
  'animation',
  'advanced-gradient',
  'glassmorphism',
  'clip-path-shape',
]);

function unwrapAiResponse(raw: string): string {
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json|css|html)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function sanitizeContextValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 6).map((item) => sanitizeContextValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[object]';
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 12)
        .map(([key, nestedValue]) => [key, sanitizeContextValue(nestedValue, depth + 1)])
    );
  }

  return String(value);
}

function summarizeBlockForAi(block: Block, depth = 0): Record<string, unknown> {
  return {
    id: block.id,
    type: block.type,
    label: block.label,
    hidden: block.hidden,
    locked: block.locked,
    props: sanitizeContextValue(block.props),
    style: {
      layout: sanitizeContextValue(block.style.layout),
      background: sanitizeContextValue(block.style.background),
      typography: sanitizeContextValue(block.style.typography),
      border: sanitizeContextValue(block.style.border),
    },
    dataSource: sanitizeContextValue(block.dataSource),
    childCount: block.children.length,
    children:
      depth >= 1
        ? block.children.slice(0, 6).map((child) => ({
            id: child.id,
            type: child.type,
            label: child.label,
          }))
        : block.children.slice(0, 6).map((child) => summarizeBlockForAi(child, depth + 1)),
  };
}

export function AIModal({
  isOpen,
  onClose,
  defaultPrompt,
  contextData = '',
  systemPrompt,
  onApply,
  title = 'Assistente IA',
  blockId,
  fieldName,
}: AIModalProps) {
  const { currentTenant } = useAuthStore();
  const { getBlock, getBlockLocation, blocks, pageMeta } = usePageStore();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const settings = (currentTenant?.settings ?? {}) as Record<string, unknown>;
  // Allow AI in development, check module in production
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !isModuleActive(settings, 'ai_assistant')) {
    return null;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Scrivi un prompt');
      return;
    }

    // In dev, use a placeholder tenant if not set
    const tenant = currentTenant ?? { id: 'dev-tenant' };

    setLoading(true);
    setSubmitted(false);
    setResult('');

    try {
      const liveBlock = blockId ? getBlock(blockId) : null;
      const liveLocation = blockId ? getBlockLocation(blockId) : null;
      const contextSections = [
        fieldName ? `CAMPO O OBIETTIVO:\n${fieldName}` : '',
        contextData ? `CONTESTO FORNITO:\n${contextData}` : '',
        liveBlock
          ? `BLOCCO O SEZIONE ATTIVA:\n${JSON.stringify(
              {
                ...summarizeBlockForAi(liveBlock),
                location: liveLocation,
              },
              null,
              2
            )}`
          : '',
        blocks.length > 0
          ? `PAGINA / STRUTTURA INTORNO:\n${JSON.stringify(
              {
                pageMeta: sanitizeContextValue(pageMeta),
                rootBlocks: blocks.slice(0, 8).map((rootBlock) => ({
                  id: rootBlock.id,
                  type: rootBlock.type,
                  label: rootBlock.label,
                  childCount: rootBlock.children.length,
                })),
              },
              null,
              2
            )}`
          : '',
      ].filter(Boolean).join('\n\n');

      const finalPrompt = prompt.replace('{context}', contextSections || contextData);
      const expectsJson = fieldName ? JSON_FIELD_NAMES.has(fieldName) : false;
      const normalizedPrompt = fieldName
        ? [
            `Campo: ${fieldName}`,
            contextSections ? `Contesto: ${contextSections}` : '',
            '',
            `Richiesta: ${finalPrompt}`,
            '',
            expectsJson
              ? 'Rispondi SOLO con un oggetto JSON valido, senza spiegazioni o markdown.'
              : 'Rispondi SOLO con il risultato finale, senza spiegazioni o markdown.',
          ]
            .filter(Boolean)
            .join('\n')
        : finalPrompt;

      // In development, mock a response for testing
      if (process.env.NODE_ENV === 'development') {
        await new Promise(r => setTimeout(r, 800)); // Simulate API delay

        // Generate a mock response based on the prompt
        let mockResponse = '';
        if (finalPrompt.includes('glassmorphism')) {
          mockResponse = JSON.stringify({
            enabled: true,
            blur: 12,
            saturation: 100,
            bgOpacity: 0.15,
            bgColor: '#ffffff',
            borderOpacity: 0.2,
          }, null, 2);
        } else if (finalPrompt.includes('gradient')) {
          mockResponse = JSON.stringify({
            type: 'linear',
            angle: 135,
            stops: [
              { color: '#667eea', position: 0 },
              { color: '#764ba2', position: 100 },
            ],
          }, null, 2);
        } else {
          mockResponse = JSON.stringify({ success: true, message: 'Mock response per testing locale' }, null, 2);
        }

        setResult(unwrapAiResponse(mockResponse));
        setSubmitted(true);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/freeform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          task: 'seo',
          system: systemPrompt || 'Sei un assistente editoriale per un CMS giornalistico italiano. Rispondi in modo conciso e utile.',
          prompt: normalizedPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Errore IA');
        setLoading(false);
        return;
      }

      setResult(unwrapAiResponse(data.text));
      setSubmitted(true);
      setLoading(false);
    } catch {
      toast.error('Errore di comunicazione');
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result.trim()) {
      toast.error('Nessun risultato da applicare');
      return;
    }
    onApply(result);
    setResult('');
    setPrompt(defaultPrompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={20} style={{ color: 'var(--c-accent)' }} />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-opacity-50"
            style={{ background: 'var(--c-bg-2)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--c-text-1)' }}>
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="w-full p-3 rounded border resize-none"
              style={{
                borderColor: 'var(--c-border)',
                background: 'var(--c-bg-1)',
                color: 'var(--c-text-0)',
              }}
              rows={4}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-2)' }}>
              Usa {'{context}'} per inserire i dati del blocco
            </p>
          </div>

          {/* Result Display */}
          {(result || loading) && (
            <div>
              <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--c-text-1)' }}>
                Risultato IA
              </label>
              <div
                className="p-3 rounded border min-h-[100px] whitespace-pre-wrap break-words"
                style={{
                  borderColor: 'var(--c-border)',
                  background: 'var(--c-bg-1)',
                  color: 'var(--c-text-0)',
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generando...</span>
                  </div>
                ) : (
                  result
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-4 border-t gap-2"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--c-bg-2)',
              color: 'var(--c-text-0)',
            }}
            disabled={loading}
          >
            Annulla
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
              style={{
                background: loading ? 'var(--c-bg-2)' : 'var(--c-accent)',
                color: loading ? 'var(--c-text-1)' : 'white',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Generando...' : 'Genera'}
            </button>

            {submitted && (
              <button
                onClick={handleApply}
                disabled={loading || !result.trim()}
                className="px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
                style={{
                  background: 'var(--c-success, #10b981)',
                  color: 'white',
                }}
              >
                <Check size={16} />
                Applica
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
