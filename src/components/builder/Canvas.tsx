'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { CanvasBlock } from './CanvasBlock';
import { DEVICE_WIDTHS } from '@/lib/config/breakpoints';
import { cn } from '@/lib/utils/cn';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { PageBackgroundFrame } from '@/components/render/PageBackgroundFrame';

export function Canvas() {
  const { blocks, pageMeta, selectBlock, selectBlocks, clearSelection, selectedBlockIds, selectedBlockId } = usePageStore();
  const { deviceMode, zoom, setZoom, showGrid, gridSize, showOutlines } = useUiStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSurfaceRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [marquee, setMarquee] = useState<null | { x: number; y: number; w: number; h: number }>(null);
  const marqueeRef = useRef<null | { x: number; y: number; w: number; h: number }>(null);
  const [pageHeight, setPageHeight] = useState(800);

  const canvasWidth = DEVICE_WIDTHS[deviceMode];
  const documentTopPadding = 36;

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

  // Calculate dynamic page height based on content
  useEffect(() => {
    const updatePageHeight = () => {
      if (pageSurfaceRef.current) {
        const scrollHeight = pageSurfaceRef.current.scrollHeight || 800;
        setPageHeight(Math.max(800, scrollHeight + 40));
      }
    };

    updatePageHeight();
    const timer = setTimeout(updatePageHeight, 100);
    return () => clearTimeout(timer);
  }, [blocks]);

  // Auto-fit on first load and device change
  useEffect(() => {
    if (containerSize.w > 0) {
      fitToWidth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceMode, containerSize.w]);

  const fitToWidth = useCallback(() => {
    if (containerSize.w <= 0) return;
    const padding = 0;
    const availableWidth = containerSize.w - padding * 2;
    const newZoom = Math.min(1, availableWidth / canvasWidth);
    setZoom(Math.round(newZoom * 100) / 100);
  }, [containerSize.w, canvasWidth, setZoom]);

  const fitAll = useCallback(() => {
    if (containerSize.w <= 0 || containerSize.h <= 0) return;
    const padding = 0;
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
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-block-id]') ||
      target.closest('[data-block-toolbar="true"]') ||
      target.closest('[data-resize-handle="true"]')
    ) {
      return;
    }

    if (!pageSurfaceRef.current) return;

    const surfaceRect = pageSurfaceRef.current.getBoundingClientRect();
    // Adjust for zoom: divide mouse coordinates by zoom factor
    const startX = (e.clientX - surfaceRect.left) / zoom;
    const startY = (e.clientY - surfaceRect.top) / zoom;
    let moved = false;

    const onMove = (moveEvent: MouseEvent) => {
      moved = true;
      const currentX = (moveEvent.clientX - surfaceRect.left) / zoom;
      const currentY = (moveEvent.clientY - surfaceRect.top) / zoom;
      const nextMarquee = {
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        w: Math.abs(currentX - startX),
        h: Math.abs(currentY - startY),
      };
      marqueeRef.current = nextMarquee;
      setMarquee(nextMarquee);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      if (!moved) {
        clearSelection();
        setMarquee(null);
        return;
      }

      const liveMarquee = marqueeRef.current || {
        x: startX,
        y: startY,
        w: 0,
        h: 0,
      };

      // Selection rect in viewport coordinates (accounting for zoom)
      const selectionRect = {
        left: surfaceRect.left + (liveMarquee.x * zoom),
        top: surfaceRect.top + (liveMarquee.y * zoom),
        right: surfaceRect.left + ((liveMarquee.x + liveMarquee.w) * zoom),
        bottom: surfaceRect.top + ((liveMarquee.y + liveMarquee.h) * zoom),
      };

      const ids = Array.from(pageSurfaceRef.current?.querySelectorAll<HTMLElement>('[data-block-root="true"][data-block-id]') || [])
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          return !(
            rect.right < selectionRect.left ||
            rect.left > selectionRect.right ||
            rect.bottom < selectionRect.top ||
            rect.top > selectionRect.bottom
          );
        })
        .map((node) => node.dataset.blockId)
        .filter((id): id is string => Boolean(id));

      if (ids.length > 0) {
        selectBlocks(ids, ids[ids.length - 1]);
      } else {
        clearSelection();
      }

      setMarquee(null);
      marqueeRef.current = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [clearSelection, selectBlocks, zoom]);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { type: 'canvas', parentId: null },
  });

  const editorCanvasBackground = 'linear-gradient(180deg, #b8bec8 0%, #9ea7b4 100%)';

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ overflowX: 'auto', overflowY: 'auto', flex: '1 1 0%', height: '100%', minHeight: 0, background: editorCanvasBackground }}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Inner scrollable content — just a centered column */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: documentTopPadding,
          paddingBottom: 0,
          minWidth: '100%',
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: 'var(--c-text-2)', background: 'var(--c-bg-2)' }}>
                {deviceMode === 'tablet' ? 'Tablet' : 'Mobile'} — {canvasWidth}px
              </span>
            </div>
          )}

          {/* The actual page */}
          <PageBackgroundFrame
            meta={pageMeta}
            scopeId={`editor-canvas-${canvasWidth}`}
            className={cn(
              'shadow-xl relative',
              deviceMode === 'desktop' ? 'rounded-none' : 'rounded-xl border',
              isOver && 'ring-2 ring-dashed',
              showOutlines && 'sb-show-outlines'
            )}
            style={{
              borderColor: 'var(--c-border)',
              outlineColor: 'var(--c-accent)',
              width: canvasWidth,
              minHeight: pageHeight,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              padding: '0',
              boxShadow: deviceMode === 'desktop'
                ? '0 30px 60px rgba(55, 65, 81, 0.18)'
                : '0 24px 48px rgba(55, 65, 81, 0.22)',
              ...(isOver ? { outline: '2px dashed var(--c-accent)' } : {}),
              ...(showGrid ? {
                backgroundImage: `linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPositionX: 'var(--c-bg-0)',
              } : { backgroundColor: 'var(--c-bg-0)' }),
            }}
          >
            <div
              onMouseDown={handleCanvasMouseDown}
              data-page-surface="true"
              data-multi-select-surface="true"
              className="relative"
              ref={(node) => {
                setNodeRef(node);
                pageSurfaceRef.current = node;
              }}
              style={{ width: '100%', minHeight: pageHeight, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              onClick={handleCanvasClick}
            >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full gap-4" style={{ minHeight: pageHeight, color: 'var(--c-text-2)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-bg-2)' }}>
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
                  selected={selectedBlockIds.includes(block.id)}
                  primarySelected={selectedBlockId === block.id}
                  showOutlines={showOutlines}
                />
              ))
            )}
            {marquee && (
              <div
                className="pointer-events-none absolute z-[60] border-2 border-dashed"
                style={{
                  left: marquee.x,
                  top: marquee.y,
                  width: marquee.w,
                  height: marquee.h,
                  borderColor: 'var(--c-accent)',
                  background: 'rgba(37, 99, 235, 0.10)',
                }}
              />
            )}
            </div>
          </PageBackgroundFrame>
        </div>
      </div>

      {/* Bottom-right zoom indicator */}
      <div className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none z-40" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}>
        {canvasWidth}px · {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
