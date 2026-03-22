'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext, pointerWithin, useSensor, useSensors, PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Canvas } from './Canvas';
import { PreviewMode } from './PreviewMode';
import { Toolbar } from './Toolbar';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { AiPanel } from '@/components/ai/AiPanel';
import { HelpCenter } from '@/components/help/HelpCenter';
import { useUiStore } from '@/lib/stores/ui-store';
import { usePageStore, loadAutosave, clearAutosave, setAutosaveContext } from '@/lib/stores/page-store';
import { createBlock, type BlockType } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import '@/lib/blocks/init';
import {
  PanelLeft, PanelRight, ChevronLeft, ChevronRight
} from 'lucide-react';

interface BuilderShellProps {
  projectId: string;
  projectName: string;
  pageId: string;
}

export function BuilderShell({ projectId, projectName, pageId }: BuilderShellProps) {
  const {
    leftPanelOpen, rightPanelOpen,
    setLeftPanelOpen, setRightPanelOpen,
    previewMode, setPreviewMode,
  } = useUiStore();
  const { blocks, setBlocks, addBlock } = usePageStore();
  const [saving, setSaving] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const pageApiUrl = `/api/builder/pages/${pageId}`;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(pageApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      clearAutosave(projectId, pageId);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [pageApiUrl, projectId, pageId, blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Set autosave context
  useEffect(() => {
    setAutosaveContext(projectId, pageId);
  }, [projectId, pageId]);

  // Load page data — check autosave first
  useEffect(() => {
    const autosave = loadAutosave(projectId, pageId);

    fetch(pageApiUrl)
      .then((r) => r.json())
      .then((data) => {
        const serverBlocks = data.page?.blocks || [];
        // Use autosave ONLY if server has nothing (empty page) and autosave has content
        if (serverBlocks.length === 0 && autosave && autosave.blocks.length > 0) {
          setBlocks(autosave.blocks);
          setRecovered(true);
          setTimeout(() => setRecovered(false), 5000);
        } else if (serverBlocks.length > 0) {
          setBlocks(serverBlocks);
          // Server has data — clear any stale autosave
          clearAutosave(projectId, pageId);
        }
      })
      .catch(() => {
        // Server failed — use autosave if available
        if (autosave && autosave.blocks.length > 0) {
          setBlocks(autosave.blocks);
          setRecovered(true);
          setTimeout(() => setRecovered(false), 5000);
        }
      });
  }, [pageApiUrl, projectId, pageId, setBlocks]);

  // Warn before leaving with unsaved work
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (blocks.length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [blocks.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: Exit preview
      if (e.key === 'Escape' && previewMode) {
        setPreviewMode(false);
      }
      // Ctrl/Cmd+S: Save page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !previewMode) {
        e.preventDefault();
        void handleSave();
      }
      // Delete/Backspace: Delete selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && !previewMode) {
        const { selectedBlockId, removeBlock } = usePageStore.getState();
        if (selectedBlockId) {
          e.preventDefault();
          removeBlock(selectedBlockId);
        }
      }
      // Ctrl/Cmd+D: Duplicate selected block
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !previewMode) {
        e.preventDefault();
        const { selectedBlockId, duplicateBlock } = usePageStore.getState();
        if (selectedBlockId) {
          duplicateBlock(selectedBlockId);
        }
      }
      // Ctrl/Cmd+C: Copy selected block (store in localStorage)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !previewMode) {
        const { selectedBlockId, blocks } = usePageStore.getState();
        if (selectedBlockId) {
          const block = blocks.find(b => b.id === selectedBlockId);
          if (block) {
            localStorage.setItem('copiedBlock', JSON.stringify(block));
          }
        }
      }
      // Ctrl/Cmd+V: Paste copied block
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !previewMode) {
        e.preventDefault();
        try {
          const copied = localStorage.getItem('copiedBlock');
          if (copied) {
            const block = JSON.parse(copied);
            block.id = generateId();
            const { addBlock } = usePageStore.getState();
            addBlock(block);
          }
        } catch (err) {
          console.error('Paste error:', err);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, previewMode, setPreviewMode]);

  // Drag handlers
  const handleDragStart = () => {
    // drag started
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type === 'library-block') {
      const blockType = activeData.blockType as BlockType;
      const def = getBlockDefinition(blockType);
      if (def) {
        const block = createBlock(def.type, def.label, def.defaultProps, def.defaultStyle);
        block.id = generateId();
        if (def.defaultDataSource) {
          block.dataSource = JSON.parse(JSON.stringify(def.defaultDataSource));
        }
        addBlock(block);
      }
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/${projectId}`, { method: 'POST' });
      const data = await response.json();
      if (data.html) {
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `${projectName}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (previewMode) {
    return <PreviewMode />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full flex flex-col" style={{ background: "var(--c-bg-0)" }}>
        <Toolbar
          projectId={projectId}
          onSave={() => void handleSave()}
          onPreview={handlePreview}
          onExport={() => void handleExport()}
          saving={saving}
        />

        {/* Recovered work notification */}
        {recovered && (
          <div className="text-sm text-center py-2 px-4 flex items-center justify-center gap-2 shrink-0 z-[100]" style={{ background: 'var(--c-success)', color: 'white' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.35 5.35l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7 9.29l3.65-3.64a.5.5 0 01.7.7z" fill="currentColor"/></svg>
            Lavoro recuperato automaticamente
            <button onClick={() => setRecovered(false)} className="ml-2 underline opacity-80 hover:opacity-100">OK</button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Panel - Fixed width or hidden */}
          {leftPanelOpen && (
            <div className="w-[280px] shrink-0 h-full relative border-r" style={{ borderColor: 'var(--c-border)' }}>
              <LeftPanel />
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="absolute top-2 right-2 p-1 rounded z-10"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-2)' }}
                title="Chiudi pannello"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}

          {/* Canvas - Fills remaining space */}
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <Canvas />
            </SortableContext>

            {/* Toggle button for left panel - when closed */}
            {!leftPanelOpen && (
              <button
                onClick={() => setLeftPanelOpen(true)}
                className="absolute top-4 left-4 p-2 rounded-lg z-10 transition-all hover:scale-110"
                style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)', border: '1px solid var(--c-border)' }}
                title="Apri blocchi"
              >
                <PanelLeft size={16} />
              </button>
            )}

            {/* Toggle button for right panel - when closed */}
            {!rightPanelOpen && (
              <button
                onClick={() => setRightPanelOpen(true)}
                className="absolute top-4 right-4 p-2 rounded-lg z-10 transition-all hover:scale-110"
                style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)', border: '1px solid var(--c-border)' }}
                title="Apri proprietà"
              >
                <PanelRight size={16} />
              </button>
            )}
          </div>

          {/* Right Panel - Fixed width or hidden */}
          {rightPanelOpen && (
            <div className="w-[340px] shrink-0 h-full relative border-l" style={{ borderColor: 'var(--c-border)' }}>
              <RightPanel />
              <button
                onClick={() => setRightPanelOpen(false)}
                className="absolute top-2 left-2 p-1 rounded z-10"
                style={{ background: 'var(--c-bg-2)' }}
                title="Chiudi pannello"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* AI Panel */}
          <AiPanel />
        </div>
      </div>

      {/* Help Center */}
      <HelpCenter />
    </DndContext>
  );
}
