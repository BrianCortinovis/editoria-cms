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
import { AiBuildWizard } from '@/components/ai/AiBuildWizard';
import { buildDefaultPageMeta } from '@/lib/pages/page-seo';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { HelpCenter } from '@/components/help/HelpCenter';
import { useUiStore } from '@/lib/stores/ui-store';
import { usePageStore, loadAutosave, clearAutosave, setAutosaveContext } from '@/lib/stores/page-store';
import { createBlock, type BlockType } from '@/lib/types';
import { getBlockDefinition } from '@/lib/blocks/registry';
import { generateId } from '@/lib/utils/id';
import { useAuthStore } from '@/lib/store';
import '@/lib/blocks/init';
import toast from 'react-hot-toast';
import {
  PanelLeft, PanelRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Loader2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface BuilderShellProps {
  projectId: string;
  projectName: string;
  pageId: string;
}

export function BuilderShell({ projectId, projectName, pageId }: BuilderShellProps) {
  const { currentTenant } = useAuthStore();
  const {
    leftPanelOpen, rightPanelOpen,
    setLeftPanelOpen, setRightPanelOpen,
    previewMode, setPreviewMode,
  } = useUiStore();
  const { blocks, pageMeta, setPageMeta, loadPage, addBlock, replacePage } = usePageStore();
  const [saving, setSaving] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [seoOptimizing, setSeoOptimizing] = useState(false);
  const [seoDialogOpen, setSeoDialogOpen] = useState(false);
  const [seoStep, setSeoStep] = useState<'idle' | 'analyzing' | 'saving' | 'done' | 'error'>('idle');
  const [seoStepMessage, setSeoStepMessage] = useState<string>('Pronto ad analizzare la pagina.');
  const [seoResultPreview, setSeoResultPreview] = useState<Record<string, unknown> | null>(null);
  const [aiBuildOpen, setAiBuildOpen] = useState(false);
  const pageApiUrl = `/api/builder/pages/${pageId}`;

  const persistPage = useCallback(async (nextBlocks = blocks, nextMeta = pageMeta) => {
    const response = await fetch(pageApiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: nextBlocks, meta: nextMeta }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to save page');
    }
    clearAutosave(projectId, pageId);
    return payload;
  }, [pageApiUrl, projectId, pageId, blocks, pageMeta]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveState('idle');
    setSaveMessage(null);
    try {
      await persistPage();
      setSaveState('saved');
      setSaveMessage('Salvato');
      toast.success('Pagina salvata');
    } catch (error) {
      console.error('Save error:', error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Salvataggio non riuscito');
      toast.error(error instanceof Error ? error.message : 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  }, [persistPage]);

  const handleClearPage = useCallback(async () => {
    setSaving(true);
    setSaveState('idle');
    setSaveMessage(null);
    try {
      replacePage([], {});
      clearAutosave(projectId, pageId);
      await persistPage([], {});
      setSaveState('saved');
      setSaveMessage('Pagina svuotata');
      toast.success('Pagina svuotata e salvata');
    } catch (error) {
      console.error('Clear page error:', error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'Svuotamento non riuscito');
      toast.error(error instanceof Error ? error.message : 'Svuotamento non riuscito');
    } finally {
      setSaving(false);
    }
  }, [pageId, persistPage, projectId, replacePage]);

  const handleSeoOptimize = useCallback(async () => {
    if (!currentTenant?.id) {
      toast.error('Tenant non disponibile');
      return;
    }

    setSeoOptimizing(true);
    setSeoStep('analyzing');
    setSeoStepMessage('Analisi del contenuto della pagina e generazione metadati SEO…');
    setSaveState('idle');
    setSaveMessage(null);
    setSeoResultPreview(null);

    try {
      const pageResponse = await fetch(pageApiUrl, { method: 'GET' });
      const pagePayload = await pageResponse.json().catch(() => null);
      if (!pageResponse.ok || !pagePayload?.page) {
        throw new Error(pagePayload?.error || 'Impossibile leggere la pagina corrente');
      }

      const page = pagePayload.page as {
        title?: string;
        slug?: string;
        meta?: Record<string, unknown>;
      };

      const response = await fetch('/api/ai/seo-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          action: 'optimize_page',
          page: {
            title: page.title || projectName,
            slug: page.slug || 'homepage',
            blocks,
            meta: pageMeta,
            tenant_name: currentTenant.name,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.seo) {
        throw new Error(payload?.error || 'Analisi SEO non riuscita');
      }

      setSeoResultPreview(payload.seo as Record<string, unknown>);
      setSeoStep('saving');
      setSeoStepMessage('Applicazione dei metadati SEO alla pagina e salvataggio…');

      const nextMeta = {
        ...(page.meta || {}),
        ...pageMeta,
        ...payload.seo,
      };

      setPageMeta(nextMeta);
      await persistPage(blocks, nextMeta);
      setSaveState('saved');
      setSaveMessage('SEO applicato');
      setSeoStep('done');
      setSeoStepMessage('SEO applicato con successo alla pagina corrente.');
      toast.success('SEO pagina ottimizzato e salvato');
    } catch (error) {
      console.error('SEO optimize error:', error);
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : 'SEO non riuscito');
      setSeoStep('error');
      setSeoStepMessage(error instanceof Error ? error.message : 'SEO non riuscito');
      toast.error(error instanceof Error ? error.message : 'SEO non riuscito');
    } finally {
      setSeoOptimizing(false);
    }
  }, [blocks, currentTenant?.id, currentTenant?.name, pageApiUrl, pageMeta, projectName, persistPage, setPageMeta]);

  const openSeoDialog = useCallback(() => {
    setSeoDialogOpen(true);
    setSeoStep('idle');
    setSeoStepMessage('L’IA analizzerà la pagina e proporrà/applicherà i metadati migliori.');
    setSeoResultPreview(null);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tag = target.tagName.toLowerCase();

    // Direct editable elements
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
      return true;
    }

    // Check if inside editor interactive regions (RightPanel, etc)
    if (Boolean(target.closest('[data-editor-interactive-root="true"]')) || Boolean(target.closest('[data-editor-input="true"]'))) {
      return true;
    }

    // Contenteditable areas
    if (Boolean(target.closest('[contenteditable="true"]'))) {
      return true;
    }

    return false;
  }, []);

  const hasFocusedEditableElement = useCallback(() => {
    if (typeof document === 'undefined') {
      return false;
    }

    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return false;
    }

    return isEditableTarget(active);
  }, [isEditableTarget]);

  const parseTranslate = useCallback((transform?: string) => {
    if (!transform) return { x: 0, y: 0 };
    const match = transform.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
  }, []);

  // Set autosave context
  useEffect(() => {
    setAutosaveContext(projectId, pageId);
    setSaveState('idle');
    setSaveMessage(null);
  }, [projectId, pageId, setPageMeta]);

  // Load page data — check autosave first
  useEffect(() => {
    const autosave = loadAutosave(projectId, pageId);
    loadPage([], {});

    fetch(pageApiUrl)
      .then((r) => r.json())
      .then((data) => {
        const serverBlocks = data.page?.blocks || [];
        const serverMeta = buildDefaultPageMeta({
          title: data.page?.title || projectName,
          slug: data.page?.slug || 'homepage',
          blocks: serverBlocks,
          currentMeta: data.page?.meta || {},
        });
        // Use autosave ONLY if server has nothing (empty page) and autosave has content
        if (serverBlocks.length === 0 && autosave && autosave.blocks.length > 0) {
          loadPage(autosave.blocks, serverMeta);
          setRecovered(true);
          setTimeout(() => setRecovered(false), 5000);
        } else if (serverBlocks.length > 0) {
          loadPage(serverBlocks, serverMeta);
          // Server has data — clear any stale autosave
          clearAutosave(projectId, pageId);
        } else {
          loadPage([], serverMeta);
        }
      })
      .catch(() => {
        // Server failed — use autosave if available
        if (autosave && autosave.blocks.length > 0) {
          loadPage(autosave.blocks, {});
          setRecovered(true);
          setTimeout(() => setRecovered(false), 5000);
        } else {
          loadPage([], {});
        }
      });
  }, [loadPage, pageApiUrl, projectId, pageId, projectName]);

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
      const { isEditingProps } = useUiStore.getState();

      // Skip if event came from an editable context
      if (isEditableTarget(e.target)) {
        return;
      }
      if (hasFocusedEditableElement()) {
        return;
      }

      // Escape: Exit preview
      if (e.key === 'Escape' && previewMode) {
        setPreviewMode(false);
      }
      // Ctrl/Cmd+S: Save page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !previewMode) {
        e.preventDefault();
        void handleSave();
      }
      // Delete/Backspace: Delete selected block (only if no input is focused)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !previewMode) {
        // If event came from an input/textarea directly, NEVER process it
        const target = e.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          return; // Let browser handle it normally
        }

        // Check if focused element is contenteditable or inside one
        const active = document.activeElement;
        if (active instanceof HTMLElement && (active.isContentEditable || active.closest('[contenteditable="true"]'))) {
          return; // Let contenteditable handle it
        }

        // If we have selected blocks and not in an editable context, delete them
        e.preventDefault();
        const { selectedBlockIds, removeBlocks } = usePageStore.getState();
        if (selectedBlockIds.length > 0) {
          removeBlocks(selectedBlockIds);
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
        e.preventDefault();
        const { selectedBlockId, blocks } = usePageStore.getState();
        if (selectedBlockId) {
          const block = blocks.find(b => b.id === selectedBlockId);
          if (block) {
            localStorage.setItem('copiedBlock', JSON.stringify(block));
          }
        }
      }
      // Ctrl/Cmd+X: Cut selected block (copy + delete)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && !previewMode) {
        e.preventDefault();
        const { selectedBlockIds, blocks, removeBlocks } = usePageStore.getState();
        if (selectedBlockIds.length > 0) {
          // Copy all selected blocks
          const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id));
          if (selectedBlocks.length > 0) {
            localStorage.setItem('copiedBlock', JSON.stringify(selectedBlocks.length === 1 ? selectedBlocks[0] : selectedBlocks));
          }
          // Delete all selected blocks
          removeBlocks(selectedBlockIds);
        }
      }
      // Ctrl/Cmd+V: Paste copied block
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !previewMode) {
        e.preventDefault();
        try {
          const copied = localStorage.getItem('copiedBlock');
          if (copied) {
            const data = JSON.parse(copied);
            const { addBlock } = usePageStore.getState();
            // Handle both single block and array of blocks
            const blocksToAdd = Array.isArray(data) ? data : [data];
            blocksToAdd.forEach(block => {
              block.id = generateId();
              addBlock(block);
            });
          }
        } catch (err) {
          console.error('Paste error:', err);
        }
      }
      // Ctrl/Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !previewMode) {
        e.preventDefault();
        // Assuming there's an undo function in the store
        const store = usePageStore.getState();
        if ('undo' in store && typeof store.undo === 'function') {
          (store.undo as () => void)();
        }
      }
      // Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z: Redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y' || (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') && !previewMode) {
        e.preventDefault();
        // Assuming there's a redo function in the store
        const store = usePageStore.getState();
        if ('redo' in store && typeof store.redo === 'function') {
          (store.redo as () => void)();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !previewMode) {
        e.preventDefault();
        const { selectAllBlocks } = usePageStore.getState();
        selectAllBlocks();
      }

      // Arrow keys: nudge selected block
      if (!previewMode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const { selectedBlockId, getSelectedBlock, updateBlockStyle } = usePageStore.getState();
        if (selectedBlockId) {
          e.preventDefault();
          const selectedBlock = getSelectedBlock();
          if (!selectedBlock) {
            return;
          }

          const current = parseTranslate(selectedBlock.style.transform);
          const step = e.shiftKey ? 10 : 1;
          const delta = {
            x: e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
            y: e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
          };

          updateBlockStyle(selectedBlockId, {
            transform: `translate(${current.x + delta.x}px, ${current.y + delta.y}px)`,
          });
        }
      }
    };
    window.addEventListener('keydown', handler as EventListener, { passive: false } as AddEventListenerOptions);
    return () => window.removeEventListener('keydown', handler as EventListener, { passive: false } as EventListenerOptions);
  }, [handleSave, hasFocusedEditableElement, isEditableTarget, parseTranslate, previewMode, setPreviewMode]);

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
    return <PreviewMode pageId={pageId} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full min-w-0 max-w-full flex flex-col overflow-hidden" style={{ background: "var(--c-bg-0)" }}>
        {/* Top Toolbar */}
        <Toolbar
          projectId={projectId}
          onSave={() => void handleSave()}
          onClearPage={() => void handleClearPage()}
          onOpenAiBuild={() => setAiBuildOpen(true)}
          onPreview={handlePreview}
          onExport={() => void handleExport()}
          onSeoOptimize={openSeoDialog}
          saving={saving}
          seoOptimizing={seoOptimizing}
          saveState={saveState}
          saveMessage={saveMessage}
        />

        {/* Recovered work notification */}
        {recovered && (
          <div className="text-sm text-center py-2 px-4 flex items-center justify-center gap-2 shrink-0 z-[100]" style={{ background: 'var(--c-success)', color: 'white' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.35 5.35l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 01.7-.7L7 9.29l3.65-3.64a.5.5 0 01.7.7z" fill="currentColor"/></svg>
            Lavoro recuperato automaticamente
            <button onClick={() => setRecovered(false)} className="ml-2 underline opacity-80 hover:opacity-100">OK</button>
          </div>
        )}

        <AiBuildWizard
          open={aiBuildOpen}
          tenantId={currentTenant?.id}
          currentBlocks={blocks}
          currentMeta={pageMeta}
          onClose={() => setAiBuildOpen(false)}
          onApply={async (nextBlocks, nextMeta) => {
            replacePage(nextBlocks, nextMeta);
            await persistPage(nextBlocks, nextMeta);
            setSaveState('saved');
            setSaveMessage('Pagina generata');
            toast.success('Pagina generata con BUILD IA');
          }}
        />

        {seoDialogOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!seoOptimizing) {
                  setSeoDialogOpen(false);
                }
              }}
            />
            <div
              className="relative w-[92vw] max-w-2xl rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
            >
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                  >
                    {seoOptimizing ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--c-text-0)' }}>SEO AI Pagina</h3>
                    <p className="text-xs" style={{ color: 'var(--c-text-2)' }}>Analisi e ottimizzazione dei metadati della pagina corrente</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!seoOptimizing) {
                      setSeoDialogOpen(false);
                    }
                  }}
                  className="text-sm px-2 py-1 rounded-lg transition"
                  style={{ color: 'var(--c-text-2)' }}
                  disabled={seoOptimizing}
                >
                  Chiudi
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--c-text-0)' }}>Cosa farà l&apos;IA</p>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--c-text-1)' }}>
                    <div>1. Legge struttura e contenuto reale dei blocchi della pagina.</div>
                    <div>2. Genera `meta title`, `meta description`, `Open Graph`, `canonical` e impostazioni `robots`.</div>
                    <div>3. Applica i valori al `pageMeta` e li salva sul record pagina del CMS.</div>
                    <div>4. Aggiorna i metadata usati dal sito pubblico e dalla preview.</div>
                  </div>
                </div>

                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--c-text-0)' }}>Stato procedura</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2" style={{ color: seoStep === 'analyzing' || seoStep === 'saving' || seoStep === 'done' ? 'var(--c-text-0)' : 'var(--c-text-2)' }}>
                      {seoStep === 'analyzing' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                      Analisi contenuto pagina
                    </div>
                    <div className="flex items-center gap-2" style={{ color: seoStep === 'saving' || seoStep === 'done' ? 'var(--c-text-0)' : 'var(--c-text-2)' }}>
                      {seoStep === 'saving' ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                      Applicazione metadati SEO
                    </div>
                    <div className="flex items-center gap-2" style={{ color: seoStep === 'done' ? 'var(--c-success)' : seoStep === 'error' ? 'var(--c-danger)' : 'var(--c-text-2)' }}>
                      {seoStep === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                      {seoStepMessage}
                    </div>
                  </div>
                </div>

                {seoResultPreview && (
                  <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>Valori applicati</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Meta title</div>
                        <div style={{ color: 'var(--c-text-0)' }}>{String(seoResultPreview.title || '')}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Meta description</div>
                        <div style={{ color: 'var(--c-text-0)' }}>{String(seoResultPreview.description || '')}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Canonical</div>
                          <div style={{ color: 'var(--c-text-0)' }}>{String(seoResultPreview.canonicalPath || '')}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Keyword</div>
                          <div style={{ color: 'var(--c-text-0)' }}>{String(seoResultPreview.focusKeyword || '')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <button
                  onClick={() => setSeoDialogOpen(false)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition"
                  style={{ borderColor: 'var(--c-border)', color: 'var(--c-text-1)' }}
                  disabled={seoOptimizing}
                >
                  {seoStep === 'done' ? 'Chiudi' : 'Annulla'}
                </button>
                {seoStep !== 'done' && (
                  <button
                    onClick={() => void handleSeoOptimize()}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: 'var(--c-accent)', color: 'white' }}
                    disabled={seoOptimizing}
                  >
                    {seoOptimizing ? 'Ottimizzazione in corso…' : 'Conferma e applica'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 flex overflow-hidden relative">
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
            </div>
          )}

        </div>
      </div>

      {/* Help Center */}
      <HelpCenter />
    </DndContext>
  );
}
