'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext, pointerWithin, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { PreviewMode } from './PreviewMode';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { AiPanel } from '@/components/ai/AiPanel';
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
    leftPanelOpen, rightPanelOpen, aiPanelOpen,
    setLeftPanelOpen, setRightPanelOpen,
    previewMode, setPreviewMode,
  } = useUiStore();
  const { blocks, setBlocks, addBlock } = usePageStore();
  const [saving, setSaving] = useState(false);
  const [recovered, setRecovered] = useState(false);

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

    fetch(`/api/projects/${projectId}/pages/${pageId}`)
      .then((r) => r.json())
      .then((data) => {
        const serverBlocks = data.blocks || [];
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
  }, [projectId, pageId, setBlocks]);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      // Clear autosave after successful server save
      clearAutosave(projectId, pageId);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [projectId, pageId, blocks]);

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
      // Ctrl/Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape: Exit preview
      if (e.key === 'Escape' && previewMode) {
        setPreviewMode(false);
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
  const handleDragStart = (event: DragStartEvent) => {
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
        a.download = `${projectName}.html`;
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
        {/* Recovered work notification */}
        {recovered && (
          <div className="text-sm text-center py-2 px-4 flex items-center justify-center gap-2 shrink-0 z-[100]" style={{ background: 'var(--c-success)', color: 'white' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.35 5.35l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7 9.29l3.65-3.64a.5.5 0 01.7.7z" fill="currentColor"/></svg>
            Lavoro recuperato automaticamente
            <button onClick={() => setRecovered(false)} className="ml-2 underline opacity-80 hover:opacity-100">OK</button>
          </div>
        )}
        <Toolbar
          projectName={projectName}
          onSave={handleSave}
          onPreview={handlePreview}
          onExport={handleExport}
          saving={saving}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Fixed width */}
          {leftPanelOpen ? (
            <div className="w-[280px] shrink-0 h-full relative">
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
          ) : (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="w-8 shrink-0 flex items-center justify-center border-r"
              style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)', color: 'var(--c-text-2)' }}
              title="Apri blocchi"
            >
              <PanelLeft size={14} />
            </button>
          )}

          {/* Canvas - Fills remaining space */}
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <Canvas />
            </SortableContext>
          </div>

          {/* Right Panel - Fixed width */}
          {rightPanelOpen ? (
            <div className="w-[340px] shrink-0 h-full relative">
              <RightPanel />
              <button
                onClick={() => setRightPanelOpen(false)}
                className="absolute top-2 left-2 p-1 rounded text-zinc-500 z-10"
                style={{ background: 'var(--c-bg-2)' }}
                title="Chiudi pannello"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="w-8 shrink-0 flex items-center justify-center border-l"
              style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)', color: 'var(--c-text-2)' }}
              title="Apri proprieta"
            >
              <PanelRight size={14} />
            </button>
          )}

          {/* AI Panel - Fixed width, outside main layout */}
          <AiPanel />
        </div>
      </div>
    </DndContext>
  );
}
