'use client';

import { useState } from 'react';
import { useUiStore } from '@/lib/stores/ui-store';
import { BlockLibrary } from './BlockLibrary';
import { LayerTree } from './LayerTree';
import { SystemPanel } from './SystemPanel';
import { cn } from '@/lib/utils/cn';
import { LayoutGrid, Layers, Server } from 'lucide-react';

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab } = useUiStore();

  const tabs = [
    { id: 'blocks' as const, label: 'Blocchi', icon: LayoutGrid },
    { id: 'layers' as const, label: 'Layers', icon: Layers },
    { id: 'system' as const, label: 'Sistema', icon: Server },
  ];

  return (
    <div className="h-full flex flex-col border-r" style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}>
      {/* Tab Header */}
      <div className="flex border-b" style={{ borderColor: 'var(--c-border)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setLeftPanelTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              leftPanelTab === id
                ? 'border-b-2 border-blue-600'
                : ''
            )}
            style={leftPanelTab !== id ? { color: 'var(--c-text-1)' } : undefined}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {leftPanelTab === 'blocks' && <BlockLibrary />}
        {leftPanelTab === 'layers' && <LayerTree />}
        {leftPanelTab === 'system' && <SystemPanel />}
      </div>
    </div>
  );
}
