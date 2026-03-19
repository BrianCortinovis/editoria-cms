'use client';

import { useState } from 'react';
import { useUiStore } from '@/lib/stores/ui-store';
import { BlockLibrary } from './BlockLibrary';
import { LayerTree } from './LayerTree';
import { cn } from '@/lib/utils/cn';
import { LayoutGrid, Layers } from 'lucide-react';

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab } = useUiStore();

  const tabs = [
    { id: 'blocks' as const, label: 'Blocchi', icon: LayoutGrid },
    { id: 'layers' as const, label: 'Layers', icon: Layers },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Tab Header */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setLeftPanelTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              leftPanelTab === id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {leftPanelTab === 'blocks' ? <BlockLibrary /> : <LayerTree />}
      </div>
    </div>
  );
}
