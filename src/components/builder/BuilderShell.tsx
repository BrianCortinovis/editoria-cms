'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext, pointerWithin, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { useUiStore } from '@/lib/stores/ui-store';
import { usePageStore } from '@/lib/stores/page-store';
import { createBlock, type BlockType } from '@/lib/types/block';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import '@/lib/blocks/init';
import {
  PanelLeft, PanelRight, ChevronLeft, ChevronRight
} from 'lucide-react';

interface BuilderShellProps {
  pageId: string;
  pageTitle: string;
  tenantId: string;
}

export function BuilderShell({ pageId, pageTitle, tenantId }: BuilderShellProps) {
  const {
    leftPanelOpen, rightPanelOpen,
    setLeftPanelOpen, setRightPanelOpen,
    previewMode, setPreviewMode,
  } = useUiStore();
  const { blocks, setBlocks, addBlock, isDirty, markSaved, setSaving, isSaving } = usePageStore();
  const [loaded, setLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Set context and load page blocks from Supabase
  useEffect(() => {
    usePageStore.getState().setContext(pageId, tenantId);

    fetch(`/api/builder/pages/${pageId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.page?.blocks) {
          setBlocks(data.page.blocks);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [pageId, tenantId, setBlocks]);

  // Save to Supabase
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/builder/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      });
      markSaved();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [pageId, blocks, markSaved, setSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape' && previewMode) {
        setPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, previewMode, setPreviewMode]);

  // Warn before leaving with unsaved work
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Drag handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    if (activeData?.type === 'library-block') {
      const blockType = activeData.blockType as BlockType;
      const def = getBlockDefinition(blockType);
      if (def) {
        const block = createBlock(def.type, def.label, def.defaultProps, def.defaultStyle, def.defaultDataSource);
        block.id = generateId();
        addBlock(block);
      }
    }
  };

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-400 animate-pulse">Caricamento builder...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Toolbar
          projectName={pageTitle}
          onSave={handleSave}
          onPreview={() => setPreviewMode(!previewMode)}
          onExport={() => {}}
          saving={isSaving}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          {leftPanelOpen ? (
            <div className="w-[280px] shrink-0 h-full relative">
              <LeftPanel />
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="absolute top-2 right-2 p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 z-10"
                title="Chiudi pannello"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="w-8 shrink-0 flex items-center justify-center bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400"
              title="Apri blocchi"
            >
              <PanelLeft size={14} />
            </button>
          )}

          {/* Canvas */}
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <Canvas />
            </SortableContext>
          </div>

          {/* Right Panel */}
          {rightPanelOpen ? (
            <div className="w-[340px] shrink-0 h-full relative">
              <RightPanel />
              <button
                onClick={() => setRightPanelOpen(false)}
                className="absolute top-2 left-2 p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 z-10"
                title="Chiudi pannello"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="w-8 shrink-0 flex items-center justify-center bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400"
              title="Apri proprietà"
            >
              <PanelRight size={14} />
            </button>
          )}
        </div>

        {/* Dirty indicator */}
        {isDirty && (
          <div className="absolute bottom-4 right-4 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-lg z-50">
            Modifiche non salvate
          </div>
        )}
      </div>
    </DndContext>
  );
}
