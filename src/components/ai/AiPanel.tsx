'use client';

import { useUiStore } from '@/lib/stores/ui-store';
import { X, Sparkles } from 'lucide-react';

/**
 * AI Panel - Floating AI assistance panel
 * Can be expanded to show AI suggestions, history, etc.
 */
export function AiPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useUiStore();

  if (!aiPanelOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-500" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <button
          onClick={() => setAiPanelOpen(false)}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
        >
          <X size={14} />
        </button>
      </div>

      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        <p>AI assistance features coming soon!</p>
        <p className="text-xs mt-2 text-zinc-500">
          • Smart content suggestions<br />
          • Style recommendations<br />
          • Layout optimization
        </p>
      </div>
    </div>
  );
}
