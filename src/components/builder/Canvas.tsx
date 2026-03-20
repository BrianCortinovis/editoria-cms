'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { CanvasBlock } from './CanvasBlock';
import { DEVICE_WIDTHS } from '@/lib/config/breakpoints';
import { cn } from '@/lib/utils/cn';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

export function Canvas() {
  const { blocks, selectBlock, selectedBlockId } = usePageStore();
  const { deviceMode, zoom, setZoom, showGrid, gridSize, showOutlines } = useUiStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const canvasWidth = DEVICE_WIDTHS[deviceMode];

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-fit on first load and device change
  useEffect(() => {
    if (containerSize.w > 0) {
      fitToWidth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceMode, containerSize.w]);

  const fitToWidth = useCallback(() => {
    if (containerSize.w <= 0) return;
    const padding = 48;
    const availableWidth = containerSize.w - padding * 2;
    const newZoom = Math.min(1, availableWidth / canvasWidth);
    setZoom(Math.round(newZoom * 100) / 100);
  }, [containerSize.w, canvasWidth, setZoom]);

  const fitAll = useCallback(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return;
    const padding = 48;
    const availableWidth = containerSize.w - padding * 2;
    const availableHeight = containerSize.h - padding * 2;
    const pageEl = containerRef.current?.querySelector('.sb-page-frame') as HTMLElement;
    const ph = pageEl?.scrollHeight || 900;
    const zoomW = availableWidth / canvasWidth;
    const zoomH = availableHeight / ph;
    const newZoom = Math.min(zoomW, zoomH, 1);
    setZoom(Math.round(newZoom * 100) / 100);
  }, [containerSize, canvasWidth, setZoom]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__canvasFitWidth = fitToWidth;
    (window as unknown as Record<string, unknown>).__canvasFitAll = fitAll;
  }, [fitToWidth, fitAll]);

  // Mouse wheel zoom (only with Ctrl/Cmd)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom(Math.max(0.1, Math.min(2, zoom + delta)));
      }
    },
    [zoom, setZoom]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectBlock(null);
      }
    },
    [selectBlock]
  );

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { type: 'canvas', parentId: null },
  });

  return (
    <div
      ref={containerRef}
      className="bg-zinc-100 dark:bg-zinc-950 relative"
      style={{ overflow: 'auto', flex: '1 1 0%', height: '100%', minHeight: 0 }}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Inner scrollable content — just a centered column with padding */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 24,
          paddingBottom: 24,
        }}
        onClick={handleCanvasClick}
      >
        {/* Page frame with CSS zoom — no transform tricks needed.
            CSS zoom properly affects layout flow and scrollbar. */}
        <div
          className="sb-page-frame"
          style={{
            width: canvasWidth,
            zoom: zoom,
            flexShrink: 0,
          }}
        >
          {/* Device frame chrome */}
          {deviceMode !== 'desktop' && (
            <div className="text-center mb-2">
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {deviceMode === 'tablet' ? 'Tablet' : 'Mobile'} — {canvasWidth}px
              </span>
            </div>
          )}

          {/* The actual page */}
          <div
            ref={setNodeRef}
            className={cn(
              'bg-white dark:bg-zinc-900 shadow-xl relative',
              deviceMode === 'desktop' ? 'rounded-none' : 'rounded-xl border border-zinc-300 dark:border-zinc-700',
              isOver && 'ring-2 ring-blue-400 ring-dashed',
              showOutlines && 'sb-show-outlines'
            )}
            style={{
              width: canvasWidth,
              minHeight: 800,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              ...(showGrid ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,${gridSize <= 5 ? 0.06 : 0.03}) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,${gridSize <= 5 ? 0.06 : 0.03}) 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
              } : {}),
            }}
            onClick={handleCanvasClick}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[800px] w-full text-zinc-400 dark:text-zinc-600 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Pagina vuota</p>
                  <p className="text-sm mt-1 max-w-xs">
                    Trascina un blocco dal pannello sinistro, usa un template dal bottone Layout, o chiedi all&apos;AI
                  </p>
                </div>
              </div>
            ) : (
              blocks.map((block) => (
                <CanvasBlock
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  showOutlines={showOutlines}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom-right zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-zinc-900/70 text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none z-40">
        {canvasWidth}px · {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
