'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import type { Block } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import {
  Trash2, Copy, Eye, EyeOff, Settings2,
  Move, FlipHorizontal2, Lock, Unlock,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Magnet, AlignCenterHorizontal, AlignCenterVertical
} from 'lucide-react';
import { DEVICE_WIDTHS } from '@/lib/config/breakpoints';
import { generateDividerSvg, dividerToClipPath, generateDividerGradientMask } from '@/lib/shapes/dividers';

interface CanvasBlockProps {
  block: Block;
  selected: boolean;
  showOutlines: boolean;
}

// ================================================================
// RESIZE HANDLE - Big, visible, precise to 1px
// ================================================================
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSORS: Record<ResizeDir, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
};

function ResizeHandle({ dir, onDrag }: {
  dir: ResizeDir;
  onDrag: (dir: ResizeDir, dx: number, dy: number, done: boolean) => void;
}) {
  const startRef = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.current = { x: e.clientX, y: e.clientY };

    const onMove = (ev: MouseEvent) => {
      onDrag(dir, ev.clientX - startRef.current.x, ev.clientY - startRef.current.y, false);
    };
    const onUp = (ev: MouseEvent) => {
      onDrag(dir, ev.clientX - startRef.current.x, ev.clientY - startRef.current.y, true);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = CURSORS[dir];
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const isCorner = dir.length === 2;
  const isHoriz = dir === 'e' || dir === 'w';
  const isVert = dir === 'n' || dir === 's';

  // Bigger hit areas and visible handles
  const styles: Record<ResizeDir, React.CSSProperties> = {
    n:  { top: -3, left: 20, right: 20, height: 6, cursor: 'ns-resize' },
    s:  { bottom: -3, left: 20, right: 20, height: 6, cursor: 'ns-resize' },
    e:  { right: -3, top: 20, bottom: 20, width: 6, cursor: 'ew-resize' },
    w:  { left: -3, top: 20, bottom: 20, width: 6, cursor: 'ew-resize' },
    ne: { top: -6, right: -6, width: 14, height: 14, cursor: 'nesw-resize' },
    nw: { top: -6, left: -6, width: 14, height: 14, cursor: 'nwse-resize' },
    se: { bottom: -6, right: -6, width: 14, height: 14, cursor: 'nwse-resize' },
    sw: { bottom: -6, left: -6, width: 14, height: 14, cursor: 'nesw-resize' },
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        isCorner
          ? 'border-2 rounded-sm shadow-md transition-colors'
          : 'group/handle'
      )}
      style={isCorner ? {
        position: 'absolute',
        zIndex: 70,
        ...styles[dir],
        background: 'var(--c-bg-0)',
        borderColor: 'var(--c-accent)',
        borderWidth: '2px'
      } : { position: 'absolute', zIndex: 70, ...styles[dir] }}
    >
      {/* Edge handles: show a thick blue line */}
      {!isCorner && (
        <div
          className="absolute rounded-full transition-all opacity-60 hover:opacity-100"
          style={{
            background: 'var(--c-accent)',
            ...(isHoriz ? { width: '4px', left: '50%', transform: 'translateX(-50%)', top: '8px', bottom: '8px' } : { height: '4px', top: '50%', transform: 'translateY(-50%)', left: '8px', right: '8px' })
          }}
        />
      )}
      {/* Mid-point knob on edges */}
      {!isCorner && (
        <div
          className="absolute rounded-full shadow-sm"
          style={{
            background: 'var(--c-bg-0)',
            borderColor: 'var(--c-accent)',
            borderWidth: '2px',
            width: '12px',
            height: '12px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
    </div>
  );
}

// ================================================================
// MAIN CANVAS BLOCK
// ================================================================
export function CanvasBlock({ block, selected, showOutlines }: CanvasBlockProps) {
  const {
    selectBlock, removeBlock, duplicateBlock, updateBlock, updateBlockStyle,
    hoveredBlockId, hoverBlock, setEditingBlock, editingBlockId, moveBlock, blocks
  } = usePageStore();
  const { setRightPanelOpen, setRightPanelTab, zoom, deviceMode } = useUiStore();
  const [mirrorResize, setMirrorResize] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<{ type: 'h' | 'v'; pos: number }[]>([]);
  const canvasWidth = DEVICE_WIDTHS[deviceMode];
  const blockRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [resizing, setResizing] = useState(false);
  const [toolbarPos, setToolbarPos] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'>('top-left');
  // Store initial style values and rendered width when resize starts
  const initStyleRef = useRef(block.style);
  const initRenderedWidthRef = useRef(0);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: block.id, data: { type: 'block', block } });

  // Combine dnd-kit transform with block's own transform (translate for free drag)
  const dndTransform = CSS.Transform.toString(transform);
  const blockTransform = block.style.transform || '';
  const combinedTransform = [dndTransform, blockTransform].filter(Boolean).join(' ') || undefined;

  const style = {
    transform: combinedTransform,
    transition,
    opacity: isDragging ? 0.4 : block.hidden ? 0.3 : 1,
  };

  // Track dimensions
  useEffect(() => {
    if ((selected || resizing) && blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      setDims({ w: Math.round(rect.width / zoom), h: Math.round(rect.height / zoom) });
    }
  }, [selected, resizing, block.style, zoom]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectBlock(block.id);
    setRightPanelOpen(true);
  }, [block.id, selectBlock, setRightPanelOpen]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (['text', 'custom-html', 'code'].includes(block.type)) {
      setEditingBlock(block.id);
    }
  }, [block.id, block.type, setEditingBlock]);

  // ================================================================
  // RESIZE: true pixel-level control
  // Changes actual CSS dimensions, padding, margins - 1px precision
  // ================================================================
  const handleResize = useCallback((dir: ResizeDir, dx: number, dy: number, done: boolean) => {
    if (!blockRef.current) return;

    // Adjust for zoom level
    const adx = Math.round(dx / zoom);
    const ady = Math.round(dy / zoom);

    if (!resizing) {
      setResizing(true);
      initStyleRef.current = JSON.parse(JSON.stringify(block.style));
      initRenderedWidthRef.current = blockRef.current ? Math.round(blockRef.current.getBoundingClientRect().width / zoom) : 0;
    }

    const s = initStyleRef.current;
    const pad = s.layout.padding;
    const parsePx = (v: string) => parseInt(v) || 0;

    const updates: Record<string, unknown> = {};
    let newPad = { ...pad };

    // Vertical: N = change top padding, S = change bottom padding / minHeight
    if (dir.includes('n')) {
      const newTop = Math.max(0, parsePx(pad.top) - ady);
      newPad = { ...newPad, top: `${newTop}px` };
      if (mirrorResize) newPad.bottom = `${newTop}px`;
    }
    if (dir.includes('s')) {
      const newBot = Math.max(0, parsePx(pad.bottom) + ady);
      newPad = { ...newPad, bottom: `${newBot}px` };
      if (mirrorResize) newPad.top = `${newBot}px`;
      // Also adjust minHeight
      const origH = parsePx(s.layout.minHeight || '0');
      if (origH > 0) {
        updates.minHeight = `${Math.max(20, origH + ady)}px`;
      }
    }

    // Horizontal: change actual width via maxWidth
    if (dir.includes('w') || dir.includes('e')) {
      // Use initial rendered width saved at resize start
      // Only parse as px if the value actually ends with 'px', not '%' or other units
      const maxWStr = s.layout.maxWidth || '';
      const origMaxW = maxWStr.endsWith('px') ? (parseInt(maxWStr) || 0) : 0;
      const baseW = origMaxW > 0 ? origMaxW : initRenderedWidthRef.current;

      if (dir.includes('e') && !dir.includes('w')) {
        // East only: expand/shrink from right
        const newW = Math.max(100, baseW + adx);
        updates.maxWidth = `${newW}px`;
        updates.width = `${newW}px`;
        if (mirrorResize) {
          const newW2 = Math.max(100, baseW + adx * 2);
          updates.maxWidth = `${newW2}px`;
          updates.width = `${newW2}px`;
        }
      } else if (dir.includes('w') && !dir.includes('e')) {
        // West only: expand/shrink from left
        const newW = Math.max(100, baseW - adx);
        updates.maxWidth = `${newW}px`;
        updates.width = `${newW}px`;
        if (mirrorResize) {
          const newW2 = Math.max(100, baseW - adx * 2);
          updates.maxWidth = `${newW2}px`;
          updates.width = `${newW2}px`;
        }
      } else {
        // Both (corner): east side
        if (dir.includes('e')) {
          const newW = Math.max(100, baseW + adx);
          updates.maxWidth = `${newW}px`;
          updates.width = `${newW}px`;
        }
        if (dir.includes('w')) {
          const curW = parsePx((updates.maxWidth as string) || `${baseW}`);
          const newW = Math.max(100, curW - adx);
          updates.maxWidth = `${newW}px`;
          updates.width = `${newW}px`;
        }
      }
    }

    updateBlockStyle(block.id, {
      layout: { ...s.layout, padding: newPad, ...updates }
    });

    // Update dimension display
    if (blockRef.current) {
      const r = blockRef.current.getBoundingClientRect();
      setDims({ w: Math.round(r.width / zoom), h: Math.round(r.height / zoom) });
    }

    if (done) {
      setResizing(false);
    }
  }, [block.id, block.style, mirrorResize, resizing, updateBlockStyle, zoom]);

  // ================================================================
  // FREE DRAG: move block freely using translate transform
  // ================================================================
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initTranslateRef = useRef({ x: 0, y: 0 });
  const SNAP_THRESHOLD = 5; // px

  // Parse existing translate from transform string
  const parseTranslate = useCallback((t?: string) => {
    if (!t) return { x: 0, y: 0 };
    const m = t.match(/translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
  }, []);

  // Get snap targets from other blocks and canvas edges
  const getSnapTargets = useCallback(() => {
    const targets: { x: number[]; y: number[] } = { x: [0, canvasWidth / 2, canvasWidth], y: [0] };
    const pageEl = blockRef.current?.closest('.sb-show-outlines, [style*="minHeight"]')?.parentElement;

    blocks.forEach((b) => {
      if (b.id === block.id) return;
      const el = pageEl?.querySelector(`[data-block-id="${b.id}"]`) as HTMLElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const z = zoom;
      const bx = rect.left / z;
      const by = rect.top / z;
      const bw = rect.width / z;
      const bh = rect.height / z;
      targets.x.push(bx, bx + bw / 2, bx + bw);
      targets.y.push(by, by + bh / 2, by + bh);
    });
    return targets;
  }, [block.id, blocks, canvasWidth, zoom]);

  // Apply snap to a position
  const applySnap = useCallback((newX: number, newY: number, myW: number, myH: number) => {
    if (!snapEnabled) { setSnapLines([]); return { x: newX, y: newY }; }

    const targets = getSnapTargets();
    let sx = newX, sy = newY;
    const lines: { type: 'h' | 'v'; pos: number }[] = [];

    // Block edges: left, center, right
    const myEdgesX = [newX, newX + myW / 2, newX + myW];
    const myEdgesY = [newY, newY + myH / 2, newY + myH];

    for (const ex of myEdgesX) {
      for (const tx of targets.x) {
        if (Math.abs(ex - tx) <= SNAP_THRESHOLD) {
          sx = newX + (tx - ex);
          lines.push({ type: 'v', pos: tx });
          break;
        }
      }
    }
    for (const ey of myEdgesY) {
      for (const ty of targets.y) {
        if (Math.abs(ey - ty) <= SNAP_THRESHOLD) {
          sy = newY + (ty - ey);
          lines.push({ type: 'h', pos: ty });
          break;
        }
      }
    }
    setSnapLines(lines);
    return { x: sx, y: sy };
  }, [snapEnabled, getSnapTargets]);

  const handleFreeDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initTranslateRef.current = parseTranslate(block.style.transform);
    const myRect = blockRef.current?.getBoundingClientRect();
    const myW = myRect ? Math.round(myRect.width / zoom) : 0;
    const myH = myRect ? Math.round(myRect.height / zoom) : 0;

    const onMove = (ev: MouseEvent) => {
      const dx = Math.round((ev.clientX - dragStartRef.current.x) / zoom);
      const dy = Math.round((ev.clientY - dragStartRef.current.y) / zoom);
      let newX = initTranslateRef.current.x + dx;
      let newY = initTranslateRef.current.y + dy;

      // Snap
      const snapped = applySnap(newX, newY, myW, myH);
      newX = snapped.x;
      newY = snapped.y;

      updateBlockStyle(block.id, {
        transform: `translate(${newX}px, ${newY}px)`,
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSnapLines([]);
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [block.id, block.style.transform, updateBlockStyle, zoom, parseTranslate, applySnap]);

  // ================================================================
  // NUDGE: move 1px with arrow buttons
  // ================================================================
  const nudge = useCallback((dx: number, dy: number) => {
    const cur = parseTranslate(block.style.transform);
    updateBlockStyle(block.id, {
      transform: `translate(${cur.x + dx}px, ${cur.y + dy}px)`,
    });
  }, [block.id, block.style.transform, updateBlockStyle, parseTranslate]);

  // ================================================================
  // CENTER: align to page or relative to another section
  // ================================================================
  const centerOnPage = useCallback((axis: 'h' | 'v' | 'both') => {
    const cur = parseTranslate(block.style.transform);
    const el = blockRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const myW = Math.round(rect.width / zoom);
    const myH = Math.round(rect.height / zoom);

    // Get page container position
    const pageEl = el.closest('[style*="minHeight"]') as HTMLElement;
    if (!pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();
    const pageW = Math.round(pageRect.width / zoom);
    const pageH = Math.round(pageRect.height / zoom);

    // Current position of block relative to page (without transform)
    const relX = Math.round((rect.left - pageRect.left) / zoom) - cur.x;
    const relY = Math.round((rect.top - pageRect.top) / zoom) - cur.y;

    let newX = cur.x, newY = cur.y;
    if (axis === 'h' || axis === 'both') {
      newX = Math.round((pageW - myW) / 2) - relX;
    }
    if (axis === 'v' || axis === 'both') {
      newY = Math.round((pageH - myH) / 2) - relY;
    }
    updateBlockStyle(block.id, {
      transform: `translate(${newX}px, ${newY}px)`,
    });
  }, [block.id, block.style.transform, updateBlockStyle, zoom, parseTranslate]);

  // Move block up/down
  const blockIndex = blocks.findIndex(b => b.id === block.id);
  const canMoveUp = blockIndex > 0;
  const canMoveDown = blockIndex < blocks.length - 1;

  const blockStyle = buildCssFromBlockStyle(block);
  if (block.shape?.type === 'clip-path' && block.shape.value) {
    (blockStyle as Record<string, string>).clipPath = block.shape.value;
  }

  const isEditing = editingBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;

  return (
    <div
      data-block-id={block.id}
      ref={(node) => { setNodeRef(node); (blockRef as React.MutableRefObject<HTMLDivElement | null>).current = node; }}
      style={{
        ...style,
        position: 'relative',
        width: block.style.layout.width || '100%',
        maxWidth: block.style.layout.maxWidth || '100%',
      }}
      className={cn('sb-block-wrapper', selected && 'sb-selected', isEditing && 'sb-editing', isHovered && !selected && 'sb-hovered')}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => hoverBlock(block.id)}
      onMouseLeave={() => hoverBlock(null)}
      {...attributes}
    >
      {/* Top divider - hidden when using clip-path */}
      {/* {block.shape?.topDivider && (
        <div dangerouslySetInnerHTML={{ __html: generateDividerSvg(block.shape.topDivider.shape, 1440, block.shape.topDivider.height, block.shape.topDivider.color, block.shape.topDivider.flip, block.shape.topDivider.invert) }} style={{ marginBottom: -1 }} />
      )} */}

      {/* Block content */}
      <div style={blockStyle}>
        <BlockContent block={block} isEditing={isEditing} />
        {block.children.length > 0 && (
          <div style={{ display: block.style.layout.display === 'flex' ? 'flex' : 'block', flexDirection: block.style.layout.flexDirection as 'row' | 'column' | undefined, gap: block.style.layout.gap, alignItems: block.style.layout.alignItems, justifyContent: block.style.layout.justifyContent }}>
            {block.children.map((child) => (
              <CanvasBlock key={child.id} block={child} selected={usePageStore.getState().selectedBlockId === child.id} showOutlines={showOutlines} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom divider - hidden when using clip-path */}
      {/* {block.shape?.bottomDivider && (
        <div dangerouslySetInnerHTML={{ __html: generateDividerSvg(block.shape.bottomDivider.shape, 1440, block.shape.bottomDivider.height, block.shape.bottomDivider.color, block.shape.bottomDivider.flip, !block.shape.bottomDivider.invert) }} style={{ marginTop: -1 }} />
      )} */}

      {/* ================================================================ */}
      {/* SELECTION UI - Big handles, inline toolbar, dimensions */}
      {/* ================================================================ */}
      {selected && !isDragging && (
        <>
          {/* Selection border */}
          <div className="absolute inset-0 pointer-events-none border-2 z-40" style={{ borderRadius: block.style.border.radius, borderColor: 'var(--c-accent)' }} />

          {/* 8 resize handles - BIG and visible */}
          <ResizeHandle dir="n" onDrag={handleResize} />
          <ResizeHandle dir="s" onDrag={handleResize} />
          <ResizeHandle dir="e" onDrag={handleResize} />
          <ResizeHandle dir="w" onDrag={handleResize} />
          <ResizeHandle dir="ne" onDrag={handleResize} />
          <ResizeHandle dir="nw" onDrag={handleResize} />
          <ResizeHandle dir="se" onDrag={handleResize} />
          <ResizeHandle dir="sw" onDrag={handleResize} />

          {/* ================================================================ */}
          {/* TOOLBAR - Draggable position on borders */}
          {/* ================================================================ */}
          <div
            className={cn(
              "absolute flex items-center gap-1 z-50 group",
              toolbarPos === 'top-left' && 'top-2 left-2',
              toolbarPos === 'top-right' && 'top-2 right-2',
              toolbarPos === 'bottom-left' && 'bottom-2 left-2',
              toolbarPos === 'bottom-right' && 'bottom-2 right-2',
              toolbarPos === 'top-center' && 'top-2 left-1/2 -translate-x-1/2',
              toolbarPos === 'bottom-center' && 'bottom-2 left-1/2 -translate-x-1/2'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main toolbar bar */}
            <div className="flex items-center gap-1 rounded-xl px-3 py-1.5 shadow-lg cursor-move" style={{ background: 'var(--c-accent)' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const start = { x: e.clientX, y: e.clientY };

                const handleMouseMove = (mv: MouseEvent) => {
                  const dx = mv.clientX - start.x;
                  const dy = mv.clientY - start.y;

                  // Simple logic: if moved more horizontally, position changes left/right
                  // if moved vertically, position changes top/bottom
                  if (Math.abs(dx) > 30) {
                    if (dx > 0) {
                      setToolbarPos(toolbarPos.includes('top') ? 'top-right' : 'bottom-right');
                    } else {
                      setToolbarPos(toolbarPos.includes('top') ? 'top-left' : 'bottom-left');
                    }
                  } else if (Math.abs(dy) > 30) {
                    if (dy > 0) {
                      setToolbarPos(toolbarPos.includes('left') ? 'bottom-left' : toolbarPos.includes('right') ? 'bottom-right' : 'bottom-center');
                    } else {
                      setToolbarPos(toolbarPos.includes('left') ? 'top-left' : toolbarPos.includes('right') ? 'top-right' : 'top-center');
                    }
                  }
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              title="Trascina per spostare toolbar"
            >
              {/* Drag handle - free movement */}
              <button onMouseDown={handleFreeDragStart} className="p-2 cursor-grab active:cursor-grabbing rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Trascina per spostare liberamente">
                <Move size={20} />
              </button>

              <div className="w-px h-7 mx-1" style={{ background: 'rgba(0,0,0,0.2)' }} />

              {/* Label */}
              <span className="text-[13px] px-1.5 font-semibold select-none max-w-[140px] truncate" style={{ color: 'var(--c-bg-0)' }}>
                {block.label}
              </span>

              <div className="w-px h-7 mx-1" style={{ background: 'rgba(0,0,0,0.2)' }} />

              {/* Nudge 1px arrows */}
              <button onClick={() => nudge(-1, 0)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Sinistra 1px">
                <ArrowLeft size={16} />
              </button>
              <button onClick={() => nudge(0, -1)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Su 1px">
                <ArrowUp size={16} />
              </button>
              <button onClick={() => nudge(0, 1)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Giu 1px">
                <ArrowDown size={16} />
              </button>
              <button onClick={() => nudge(1, 0)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Destra 1px">
                <ArrowRight size={16} />
              </button>

              <div className="w-px h-7 mx-1" style={{ background: 'rgba(0,0,0,0.2)' }} />

              {/* Snap magnet */}
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--c-bg-0)', background: snapEnabled ? 'rgba(0,0,0,0.2)' : 'transparent' }} onMouseEnter={(e) => !snapEnabled && (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')} onMouseLeave={(e) => !snapEnabled && (e.currentTarget.style.background = 'transparent')}
                title={snapEnabled ? 'Magnete ON (5px)' : 'Magnete OFF'}
              >
                <Magnet size={18} />
              </button>

              {/* Center horizontal on page */}
              <button onClick={() => centerOnPage('h')} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Centra orizzontale pagina">
                <AlignCenterHorizontal size={18} />
              </button>

              {/* Center vertical on page */}
              <button onClick={() => centerOnPage('v')} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Centra verticale pagina">
                <AlignCenterVertical size={18} />
              </button>

              <div className="w-px h-7 mx-1" style={{ background: 'rgba(0,0,0,0.2)' }} />

              {/* Mirror resize */}
              <button
                onClick={() => setMirrorResize(!mirrorResize)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--c-bg-0)', background: mirrorResize ? 'rgba(0,0,0,0.2)' : 'transparent' }} onMouseEnter={(e) => !mirrorResize && (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')} onMouseLeave={(e) => !mirrorResize && (e.currentTarget.style.background = 'transparent')}
                title={mirrorResize ? 'Resize speculare ON' : 'Resize speculare OFF'}
              >
                <FlipHorizontal2 size={18} />
              </button>

              {/* Duplicate */}
              <button onClick={() => duplicateBlock(block.id)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Duplica (Ctrl+D)">
                <Copy size={18} />
              </button>

              {/* Settings */}
              <button onClick={() => { setRightPanelOpen(true); setRightPanelTab('properties'); }} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Proprieta">
                <Settings2 size={18} />
              </button>

              {/* Visibility */}
              <button onClick={() => updateBlock(block.id, { hidden: !block.hidden })} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title={block.hidden ? 'Mostra' : 'Nascondi'}>
                {block.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {/* Lock */}
              <button onClick={() => updateBlock(block.id, { locked: !block.locked })} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title={block.locked ? 'Sblocca' : 'Blocca'}>
                {block.locked ? <Lock size={18} /> : <Unlock size={18} />}
              </button>

              <div className="w-px h-7 mx-1" style={{ background: 'rgba(0,0,0,0.2)' }} />

              {/* Delete */}
              <button onClick={() => removeBlock(block.id)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--c-bg-0)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="Elimina (Delete)">
                <Trash2 size={18} />
              </button>
            </div>

            {/* Toolbar position buttons - show on hover */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setToolbarPos('top-left')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'top-left' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'top-left' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Top-Left"
              >↖</button>
              <button
                onClick={() => setToolbarPos('top-center')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'top-center' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'top-center' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Top-Center"
              >⬆</button>
              <button
                onClick={() => setToolbarPos('top-right')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'top-right' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'top-right' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Top-Right"
              >↗</button>
              <button
                onClick={() => setToolbarPos('bottom-left')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'bottom-left' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'bottom-left' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Bottom-Left"
              >↙</button>
              <button
                onClick={() => setToolbarPos('bottom-center')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'bottom-center' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'bottom-center' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Bottom-Center"
              >⬇</button>
              <button
                onClick={() => setToolbarPos('bottom-right')}
                className="w-6 h-6 rounded-sm text-[9px] flex items-center justify-center font-bold transition-all"
                style={{
                  background: toolbarPos === 'bottom-right' ? 'var(--c-accent)' : 'rgba(0,0,0,0.3)',
                  color: 'white',
                  transform: toolbarPos === 'bottom-right' ? 'scale(1.1)' : 'scale(0.9)'
                }}
                title="Bottom-Right"
              >↘</button>
            </div>
          </div>

          {/* Dimensions + position badge */}
          <div className="absolute bottom-2 right-2 text-sm font-mono px-3 py-1.5 rounded-lg z-50 pointer-events-none shadow-lg" style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-0)' }}>
            {dims.w} × {dims.h} px {(() => { const t = parseTranslate(block.style.transform); return t.x || t.y ? ` · x:${t.x} y:${t.y}` : ''; })()}
          </div>

          {/* Snap guide lines */}
          {snapLines.map((line, i) => (
            <div
              key={i}
              className="pointer-events-none z-[60] fixed"
              style={line.type === 'v'
                ? { left: line.pos * zoom, top: 0, bottom: 0, width: 1, background: '#f43f5e', position: 'fixed' }
                : { top: line.pos * zoom, left: 0, right: 0, height: 1, background: '#f43f5e', position: 'fixed' }
              }
            />
          ))}

          {/* Padding visualization overlay */}
          <div className="absolute inset-0 pointer-events-none z-30" style={{
            borderTop: `${Math.min(parseInt(block.style.layout.padding.top) || 0, 60)}px solid rgba(59,130,246,0.06)`,
            borderBottom: `${Math.min(parseInt(block.style.layout.padding.bottom) || 0, 60)}px solid rgba(59,130,246,0.06)`,
            borderLeft: `${Math.min(parseInt(block.style.layout.padding.left) || 0, 60)}px solid rgba(59,130,246,0.06)`,
            borderRight: `${Math.min(parseInt(block.style.layout.padding.right) || 0, 60)}px solid rgba(59,130,246,0.06)`,
            borderRadius: block.style.border.radius,
          }} />
        </>
      )}

      {/* Hover state (not selected) */}
      {isHovered && !selected && !isDragging && (
        <>
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed z-30" style={{ borderRadius: block.style.border.radius, borderColor: 'var(--c-accent)' }} />
          <div className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded z-40 pointer-events-none font-medium" style={{ background: 'var(--c-accent)', color: 'var(--c-bg-0)' }}>
            {block.label || block.type}
          </div>
        </>
      )}
    </div>
  );
}

// ================================================================
// BLOCK CONTENT RENDERERS
// ================================================================
function BlockContent({ block, isEditing }: { block: Block; isEditing: boolean }) {
  switch (block.type) {
    case 'hero': return <HeroContent block={block} />;
    case 'text': return <TextContent block={block} isEditing={isEditing} />;
    case 'divider': return <DividerContent block={block} />;
    case 'banner-ad': return <BannerAdContent block={block} />;
    case 'quote': return <QuoteContent block={block} />;
    case 'navigation': return <NavigationContent block={block} />;
    case 'footer': return <FooterContent block={block} />;
    case 'newsletter': return <NewsletterContent block={block} />;
    case 'counter': return <CounterContent block={block} />;
    case 'image-gallery': return <ImageGalleryContent block={block} />;
    case 'video': return <VideoContent block={block} />;
    case 'carousel': return <CarouselContent block={block} />;
    case 'accordion': return <AccordionContent block={block} />;
    case 'author-bio': return <AuthorBioContent block={block} />;
    case 'slideshow': return <SlideshowContent block={block} />;
    case 'section': case 'container': case 'columns': return null;
    default:
      return (
        <div className="p-6 text-center text-sm border-2 border-dashed rounded-lg" style={{ color: 'var(--c-text-2)', borderColor: 'var(--c-border)' }}>
          <span className="font-semibold text-base block mb-1" style={{ color: 'var(--c-text-1)' }}>{block.label || block.type}</span>
          <span className="text-xs opacity-60" style={{ color: 'var(--c-text-2)' }}>Doppio click per configurare</span>
        </div>
      );
  }
}

function HeroContent({ block }: { block: Block }) {
  const p = block.props as Record<string, string | number>;
  return (
    <div className="relative flex flex-col items-center justify-center text-center">
      {p.overlayColor && <div className="absolute inset-0" style={{ backgroundColor: p.overlayColor as string, opacity: (p.overlayOpacity as number) || 0.5 }} />}
      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{(p.title as string) || 'Titolo Hero'}</h1>
        {p.subtitle && <p className="text-xl opacity-80 mb-8">{p.subtitle as string}</p>}
        {p.ctaText && <button className="px-8 py-3 rounded-lg font-medium transition-colors" style={{ background: 'var(--c-accent)', color: 'var(--c-bg-0)' }}>{p.ctaText as string}</button>}
      </div>
    </div>
  );
}

function TextContent({ block, isEditing }: { block: Block; isEditing: boolean }) {
  const p = block.props as { content: string; dropCap?: boolean; columns?: number };
  const blockStyle = buildCssFromBlockStyle(block);

  // Apply shape.value as clip-path to make text follow vector shape
  const textStyle = { ...blockStyle };
  if (block.shape?.value && block.shape.type === 'clip-path') {
    (textStyle as Record<string, string>).clipPath = block.shape.value;
  }

  return (
    <div
      className={cn('prose prose-zinc dark:prose-invert max-w-none', p.dropCap && 'first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2', p.columns && p.columns > 1 && `columns-${p.columns} gap-8`)}
      style={{
        ...textStyle,
        outline: isEditing ? 'none' : undefined,
        minHeight: isEditing ? 40 : undefined,
      }}
      contentEditable={isEditing} suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: p.content || '<p>Inserisci testo...</p>' }}
    />
  );
}

function DividerContent({ block }: { block: Block }) {
  const p = block.props as { shape: string; height: number; color: string; flip: boolean; invert: boolean };
  return <div dangerouslySetInnerHTML={{ __html: generateDividerSvg(p.shape as 'wave', 1440, p.height || 80, p.color || '#ffffff', p.flip || false, p.invert || false) }} />;
}

function BannerAdContent({ block }: { block: Block }) {
  const p = block.props as { format: string; width: number; height: number; label: string; showLabel: boolean };
  return (
    <div className="flex flex-col items-center">
      {p.showLabel && <span className="text-[10px] mb-1 uppercase tracking-wider" style={{ color: 'var(--c-text-2)' }}>{p.label || 'Pubblicita'}</span>}
      <div className="border-2 border-dashed flex items-center justify-center text-sm font-mono rounded" style={{ width: p.width || 728, height: p.height || 90, maxWidth: '100%', background: 'var(--c-bg-1)', borderColor: 'var(--c-border)', color: 'var(--c-text-2)' }}>
        {p.format} ({p.width}x{p.height})
      </div>
    </div>
  );
}

function QuoteContent({ block }: { block: Block }) {
  const p = block.props as { text: string; author: string; source: string };
  return (
    <blockquote>
      <p className="text-xl italic mb-4">&ldquo;{p.text || 'Citazione...'}&rdquo;</p>
      {p.author && <cite className="text-sm not-italic" style={{ color: 'var(--c-text-2)' }}>— {p.author}{p.source ? `, ${p.source}` : ''}</cite>}
    </blockquote>
  );
}

function NavigationContent({ block }: { block: Block }) {
  const p = block.props as { logo: { value: string }; items: { id: string; label: string }[]; ctaButton?: { text: string } };
  return (
    <nav className="flex items-center justify-between w-full">
      <span className="text-lg font-bold">{p.logo?.value || 'Logo'}</span>
      <div className="flex items-center gap-6">
        {p.items?.map((item) => <span key={item.id} className="text-sm cursor-pointer transition-colors" style={{ color: 'var(--c-text-1)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--c-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--c-text-1)'}>{item.label}</span>)}
        {p.ctaButton?.text && <button className="px-4 py-2 text-sm rounded-lg" style={{ background: 'var(--c-accent)', color: 'var(--c-bg-0)' }}>{p.ctaButton.text}</button>}
      </div>
    </nav>
  );
}

function FooterContent({ block }: { block: Block }) {
  const p = block.props as { columns: { title: string }[]; copyright: string };
  return (
    <div>
      <div className="grid grid-cols-3 gap-8 mb-8">
        {p.columns?.map((col, i) => <div key={i}><h4 className="font-semibold mb-3">{col.title}</h4><div className="text-sm opacity-60">Contenuto...</div></div>)}
      </div>
      <div className="text-center text-sm opacity-50 pt-4 border-t border-white/10">{p.copyright}</div>
    </div>
  );
}

function NewsletterContent({ block }: { block: Block }) {
  const p = block.props as { title: string; description: string; placeholder: string; buttonText: string };
  return (
    <div className="text-center max-w-md mx-auto">
      <h3 className="text-2xl font-bold mb-2">{p.title}</h3>
      <p className="text-sm opacity-70 mb-6" style={{ color: 'var(--c-text-1)' }}>{p.description}</p>
      <div className="flex gap-2">
        <input className="flex-1 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)', color: 'var(--c-text-0)' }} placeholder={p.placeholder} readOnly />
        <button className="px-6 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--c-accent)', color: 'var(--c-bg-0)' }}>{p.buttonText}</button>
      </div>
    </div>
  );
}

function CounterContent({ block }: { block: Block }) {
  const p = block.props as { counters: { id: string; value: number; label: string; prefix: string; suffix: string }[] };
  return (
    <div className="flex justify-center gap-12 flex-wrap">
      {p.counters?.map((c) => <div key={c.id} className="text-center"><div className="text-4xl font-bold">{c.prefix}{c.value}{c.suffix}</div><div className="text-sm opacity-70 mt-1">{c.label}</div></div>)}
    </div>
  );
}

function ImageGalleryContent({ block }: { block: Block }) {
  const p = block.props as any;
  const items: any[] = p.items || p.images || [];
  const layout: string = p.layout || 'grid';
  const columns: number = p.columns || 3;
  const gap: string = p.gap || '12px';
  const aspectRatio: string = p.aspectRatio || '4/3';
  const objectFit: string = p.objectFit || 'cover';
  const borderRadius: string = p.borderRadius || '8px';
  const hoverEffect: string = p.hoverEffect || 'zoom';
  const showCaptions: boolean = p.showCaptions !== false;
  const captionPosition: string = p.captionPosition || 'below';
  const lightbox: boolean = p.lightbox !== false;
  const animation: string = p.animation || 'fade-in';
  const maxItems: number = p.maxItems || 0;

  const displayItems = maxItems > 0 ? items.slice(0, maxItems) : items;

  const GALLERY_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  // Hover effect CSS classes mapped to inline styles
  const getHoverStyles = (): string => {
    switch (hoverEffect) {
      case 'zoom': return 'sb-gallery-hover-zoom';
      case 'fade': return 'sb-gallery-hover-fade';
      case 'slide-up': return 'sb-gallery-hover-slideup';
      case 'blur': return 'sb-gallery-hover-blur';
      case 'grayscale': return 'sb-gallery-hover-grayscale';
      case 'shine': return 'sb-gallery-hover-shine';
      default: return '';
    }
  };

  // Animation class
  const getAnimationClass = (): string => {
    switch (animation) {
      case 'fade-in': return 'sb-gallery-anim-fadein';
      case 'slide-up': return 'sb-gallery-anim-slideup';
      case 'stagger': return 'sb-gallery-anim-stagger';
      default: return '';
    }
  };

  // Container style per layout
  const getContainerStyle = (): React.CSSProperties => {
    switch (layout) {
      case 'grid':
        return { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap };
      case 'masonry':
        return { columnCount: columns, columnGap: gap };
      case 'mosaic':
        return { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridAutoRows: '180px', gap };
      case 'justified':
        return { display: 'flex', flexWrap: 'wrap', gap };
      case 'filmstrip':
        return { display: 'flex', gap, overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', paddingBottom: '8px' };
      case 'carousel':
        return { display: 'flex', gap, overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory' };
      case 'collage':
        return { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gridAutoRows: '150px', gap };
      default:
        return { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap };
    }
  };

  // Per-item style for special layouts
  const getItemStyle = (index: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius,
      overflow: 'hidden',
      position: 'relative',
      cursor: 'pointer',
    };

    switch (layout) {
      case 'masonry':
        return { ...base, breakInside: 'avoid', marginBottom: gap };
      case 'mosaic':
        if (index === 0) return { ...base, gridColumn: 'span 2', gridRow: 'span 2' };
        return base;
      case 'justified': {
        const widths = ['32%', '28%', '38%', '45%', '25%', '30%'];
        return { ...base, flex: `1 1 ${widths[index % widths.length]}`, minWidth: '180px', maxWidth: '50%' };
      }
      case 'filmstrip':
        return { ...base, flexShrink: 0, width: '280px', scrollSnapAlign: 'start' };
      case 'carousel':
        return { ...base, flexShrink: 0, width: '100%', scrollSnapAlign: 'center' };
      case 'collage': {
        const spans = [
          { gridColumn: 'span 2', gridRow: 'span 2' },
          { gridColumn: 'span 1', gridRow: 'span 1' },
          { gridColumn: 'span 1', gridRow: 'span 2' },
          { gridColumn: 'span 1', gridRow: 'span 1' },
          { gridColumn: 'span 2', gridRow: 'span 1' },
        ];
        const span = spans[index % spans.length];
        return { ...base, ...span };
      }
      default:
        return base;
    }
  };

  // Aspect ratio style (not for masonry/collage/mosaic which handle their own sizing)
  const getAspectStyle = (index: number): React.CSSProperties => {
    if (['masonry'].includes(layout)) {
      // Masonry uses staggered heights
      const heights = [200, 260, 180, 300, 220, 240];
      return { height: `${heights[index % heights.length]}px` };
    }
    if (['mosaic', 'collage'].includes(layout)) return { height: '100%' };
    if (aspectRatio === 'auto') return { minHeight: '180px' };
    return { aspectRatio };
  };

  // Overlay position mapping
  const getOverlayPositionStyle = (position: string): React.CSSProperties => {
    switch (position) {
      case 'top': return { top: 0, left: 0, right: 0, padding: '16px' };
      case 'center': return { top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' };
      case 'bottom':
      default: return { bottom: 0, left: 0, right: 0, padding: '16px' };
    }
  };

  const renderItem = (item: any, index: number) => {
    const hasSrc = !!item.src;
    const isVideo = item.type === 'video';
    const gradient = GALLERY_GRADIENTS[index % GALLERY_GRADIENTS.length];
    const overlay = item.overlay || { enabled: false };
    const buttons: any[] = item.buttons || [];
    const badge: string = item.badge || '';
    const caption: string = item.caption || '';
    const showOverlayCaption = showCaptions && captionPosition.startsWith('overlay');

    return (
      <div
        key={item.id || index}
        className={cn('group/item', getHoverStyles(), getAnimationClass())}
        style={{
          ...getItemStyle(index),
          ...(animation === 'stagger' ? { animationDelay: `${index * 100}ms` } : {}),
        }}
      >
        {/* Image / Video container */}
        <div
          style={{
            position: 'relative',
            ...getAspectStyle(index),
            background: hasSrc ? undefined : gradient,
            overflow: 'hidden',
            borderRadius,
          }}
        >
          {/* Background image or placeholder */}
          {hasSrc ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${item.src})`,
                backgroundSize: objectFit,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transition: 'transform 0.4s ease, filter 0.4s ease, opacity 0.4s ease',
              }}
              className={cn(
                hoverEffect === 'zoom' && 'group-hover/item:scale-110',
                hoverEffect === 'fade' && 'group-hover/item:opacity-80',
                hoverEffect === 'blur' && 'group-hover/item:blur-sm',
                hoverEffect === 'grayscale' && 'grayscale group-hover/item:grayscale-0',
              )}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {isVideo ? (
                  <polygon points="5 3 19 12 5 21 5 3" />
                ) : (
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </>
                )}
              </svg>
            </div>
          )}

          {/* Video play button overlay */}
          {isVideo && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)', transition: 'transform 0.3s ease',
              }} className="group-hover/item:scale-110">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="8 5 20 12 8 19 8 5" />
                </svg>
              </div>
            </div>
          )}

          {/* Shine sweep effect */}
          {hoverEffect === 'shine' && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 5,
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)',
                transform: 'translateX(-100%)',
                transition: 'transform 0.6s ease',
              }}
              className="group-hover/item:translate-x-full"
            />
          )}

          {/* Slide-up overlay on hover */}
          {hoverEffect === 'slide-up' && (
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                transform: 'translateY(100%)',
                transition: 'transform 0.4s ease',
                zIndex: 3,
              }}
              className="group-hover/item:translate-y-0"
            />
          )}

          {/* Badge */}
          {badge && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 6,
              padding: '4px 10px', borderRadius: '4px',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              color: '#ffffff', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {badge}
            </div>
          )}

          {/* Lightbox expand icon */}
          {lightbox && (
            <div
              style={{
                position: 'absolute', top: 8, right: 8, zIndex: 6,
                width: 32, height: 32, borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.3s ease',
              }}
              className="group-hover/item:opacity-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </div>
          )}

          {/* Content overlay */}
          {overlay.enabled && (
            <div style={{
              position: 'absolute',
              ...getOverlayPositionStyle(overlay.position || 'bottom'),
              background: overlay.color || 'rgba(0,0,0,0.5)',
              zIndex: 4,
              color: '#ffffff',
            }}>
              {overlay.title && (
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: overlay.description ? 4 : 0, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  {overlay.title}
                </div>
              )}
              {overlay.description && (
                <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4 }}>
                  {overlay.description}
                </div>
              )}
              {/* Buttons inside overlay */}
              {buttons.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {buttons.map((btn: any) => (
                    <span
                      key={btn.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: btn.style === 'primary' ? '6px 16px' : '5px 15px',
                        background: btn.style === 'primary' ? '#2563eb' : 'transparent',
                        color: '#ffffff',
                        border: btn.style === 'primary' ? 'none' : '1.5px solid rgba(255,255,255,0.7)',
                        borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: btn.style === 'primary' ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
                      }}
                    >
                      {btn.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Caption as overlay */}
          {showOverlayCaption && caption && !overlay.enabled && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '10px 14px',
              background: captionPosition === 'overlay-center'
                ? 'rgba(0,0,0,0.5)' : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              color: '#ffffff', fontSize: '13px', zIndex: 3,
              ...(captionPosition === 'overlay-center'
                ? { top: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                : {}),
            }}>
              {caption}
            </div>
          )}
        </div>

        {/* Caption below */}
        {showCaptions && captionPosition === 'below' && caption && (
          <div style={{
            padding: '8px 4px 0',
            fontSize: '13px',
            color: 'inherit',
            opacity: 0.7,
            lineHeight: 1.4,
          }}>
            {caption}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Inline styles for hover effects and animations */}
      <style>{`
        .sb-gallery-hover-zoom .group\\/item:hover img,
        .sb-gallery-hover-zoom:hover > div:first-child > div:first-child { transform: scale(1.1); }
        .sb-gallery-hover-shine:hover > div:first-child > div:nth-child(3) { transform: translateX(200%) !important; }
        .group\\/item:hover .group-hover\\/item\\:scale-110 { transform: scale(1.1); }
        .group\\/item:hover .group-hover\\/item\\:opacity-80 { opacity: 0.8; }
        .group\\/item:hover .group-hover\\/item\\:blur-sm { filter: blur(4px); }
        .group\\/item:hover .group-hover\\/item\\:grayscale-0 { filter: grayscale(0); }
        .group\\/item:hover .group-hover\\/item\\:translate-y-0 { transform: translateY(0) !important; }
        .group\\/item:hover .group-hover\\/item\\:translate-x-full { transform: translateX(200%) !important; }
        .group\\/item:hover .group-hover\\/item\\:opacity-100 { opacity: 1 !important; }
        .sb-gallery-anim-fadein { animation: sbGalleryFadeIn 0.6s ease forwards; opacity: 0; }
        .sb-gallery-anim-slideup { animation: sbGallerySlideUp 0.6s ease forwards; opacity: 0; transform: translateY(20px); }
        .sb-gallery-anim-stagger { animation: sbGalleryFadeIn 0.5s ease forwards; opacity: 0; animation-fill-mode: both; }
        @keyframes sbGalleryFadeIn { to { opacity: 1; } }
        @keyframes sbGallerySlideUp { to { opacity: 1; transform: translateY(0); } }
        /* Filmstrip scrollbar */
        .sb-gallery-filmstrip::-webkit-scrollbar { height: 6px; }
        .sb-gallery-filmstrip::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 3px; }
        .sb-gallery-filmstrip::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.3); border-radius: 3px; }
      `}</style>

      <div
        style={getContainerStyle()}
        className={cn(layout === 'filmstrip' && 'sb-gallery-filmstrip')}
      >
        {displayItems.map((item, index) => renderItem(item, index))}
      </div>

      {/* Load more button */}
      {p.loadMore && maxItems > 0 && items.length > maxItems && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '10px 28px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.05)', border: '1.5px solid rgba(0,0,0,0.15)',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            Carica altri
          </span>
        </div>
      )}
    </div>
  );
}

function VideoContent({ block }: { block: Block }) {
  const p = block.props as any;
  const source: string = p.source || 'youtube';
  const url: string = p.url || '';
  const poster: string = p.poster || '';
  const aspectRatio: string = p.aspectRatio || '16/9';
  const objectFit: string = p.objectFit || 'cover';
  const caption: string = p.caption || '';
  const overlay = p.overlay || { enabled: true, title: 'Video', description: '', playButtonStyle: 'circle', playButtonSize: 'large', color: 'rgba(0,0,0,0.4)', position: 'center' };
  const chapters: { time: string; title: string }[] = p.chapters || [];
  const thumbnail = p.thumbnail || { show: true, text: 'Guarda il video', style: 'overlay' };

  const VIDEO_GRADIENTS = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
  ];
  const gradient = VIDEO_GRADIENTS[0];

  // Play button sizes
  const playSizes: Record<string, number> = { small: 48, medium: 64, large: 80 };
  const playSize = playSizes[overlay.playButtonSize || 'large'] || 80;
  const iconSize = Math.round(playSize * 0.4);

  // Source icon
  const renderSourceIcon = () => {
    const iconColor = 'rgba(255,255,255,0.7)';
    const size = 16;
    if (source === 'youtube') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    }
    if (source === 'vimeo') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609C15.906 20.029 13.022 22 10.617 22c-1.484 0-2.738-1.371-3.77-4.113L5.15 11.04c-.56-2.742-1.16-4.113-1.804-4.113-.14 0-.628.294-1.464.882L.842 6.497c.921-.809 1.831-1.618 2.71-2.427C5.012 2.755 6.12 2.07 6.827 2.006c1.622-.156 2.621.953 2.999 3.328.408 2.56.69 4.154.849 4.777.472 2.145.99 3.216 1.558 3.216.44 0 1.1-.695 1.981-2.087.878-1.39 1.35-2.449 1.414-3.177.126-1.205-.347-1.808-1.414-1.808-.504 0-1.022.115-1.558.346 1.032-3.38 3.003-5.024 5.916-4.934 2.158.064 3.176 1.463 3.053 4.197z" />
        </svg>
      );
    }
    // file or embed
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  };

  // Play button render
  const renderPlayButton = () => {
    const style = overlay.playButtonStyle || 'circle';
    const baseStyle: React.CSSProperties = {
      width: playSize, height: playSize,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    };

    const playIcon = (
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="8 5 20 12 8 19 8 5" />
      </svg>
    );

    switch (style) {
      case 'circle':
        return (
          <div style={{ ...baseStyle, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} className="group-hover/video:scale-110">
            {playIcon}
          </div>
        );
      case 'square':
        return (
          <div style={{ ...baseStyle, borderRadius: '12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} className="group-hover/video:scale-110">
            {playIcon}
          </div>
        );
      case 'minimal':
        return (
          <div style={{ ...baseStyle, background: 'transparent' }} className="group-hover/video:scale-110">
            <svg width={iconSize + 8} height={iconSize + 8} viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" stroke="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
              <polygon points="8 5 20 12 8 19 8 5" />
            </svg>
          </div>
        );
      case 'pulse':
        return (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)',
              animation: 'videoPulse 2s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: -24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
              animation: 'videoPulse 2s ease-in-out infinite 0.4s',
            }} />
            <div style={{ ...baseStyle, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} className="group-hover/video:scale-110">
              {playIcon}
            </div>
          </div>
        );
      default:
        return (
          <div style={{ ...baseStyle, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} className="group-hover/video:scale-110">
            {playIcon}
          </div>
        );
    }
  };

  // Overlay position styles
  const getOverlayLayout = (): React.CSSProperties => {
    const pos = overlay.position || 'center';
    switch (pos) {
      case 'top': return { top: 0, left: 0, right: 0, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
      case 'bottom': return { bottom: 0, left: 0, right: 0, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' };
      case 'bottom-left': return { bottom: 0, left: 0, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' };
      case 'center':
      default: return { inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
    }
  };

  const hasPoster = !!poster;
  const thumbnailStyle = thumbnail.style || 'overlay';

  return (
    <div className="group/video">
      <style>{`
        .group\\/video:hover .group-hover\\/video\\:scale-110 { transform: scale(1.1); }
        @keyframes videoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* Main video container */}
      <div style={{ position: 'relative', aspectRatio, overflow: 'hidden', borderRadius: 'inherit', background: hasPoster ? undefined : gradient }}>
        {/* Poster / thumbnail background */}
        {hasPoster ? (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: objectFit,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'transform 0.6s ease',
          }} className="group-hover/video:scale-105" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
        )}

        {/* Overlay color */}
        {overlay.enabled && (
          <div style={{ position: 'absolute', inset: 0, background: overlay.color || 'rgba(0,0,0,0.4)', zIndex: 1 }} />
        )}

        {/* Content overlay */}
        {overlay.enabled && (
          <div style={{ position: 'absolute', ...getOverlayLayout(), zIndex: 3, color: '#ffffff' }}>
            {/* Play button */}
            {renderPlayButton()}

            {/* Title and description */}
            {(overlay.title || overlay.description) && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                {overlay.title && (
                  <div style={{ fontSize: '20px', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.4)', marginBottom: overlay.description ? 6 : 0 }}>
                    {overlay.title}
                  </div>
                )}
                {overlay.description && (
                  <div style={{ fontSize: '14px', opacity: 0.85, textShadow: '0 1px 4px rgba(0,0,0,0.3)', maxWidth: '500px', lineHeight: 1.5 }}>
                    {overlay.description}
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail text */}
            {thumbnail.show && thumbnail.text && thumbnailStyle === 'overlay' && (
              <div style={{ marginTop: 12, fontSize: '13px', fontWeight: 600, opacity: 0.8, letterSpacing: '0.02em' }}>
                {thumbnail.text}
              </div>
            )}
          </div>
        )}

        {/* Play button without overlay */}
        {!overlay.enabled && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            {renderPlayButton()}
          </div>
        )}

        {/* Source indicator badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 5,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: '6px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}>
          {renderSourceIcon()}
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
            {source}
          </span>
        </div>

        {/* URL indicator */}
        {url && (
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 5,
            padding: '4px 8px', borderRadius: '4px',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontFamily: 'monospace',
            maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {url}
          </div>
        )}

        {/* Chapters timeline bar */}
        {chapters.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
            display: 'flex', alignItems: 'flex-end', height: '40px',
            padding: '0 12px 8px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', position: 'relative' }}>
              {/* Timeline bar */}
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
                {chapters.map((ch, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute', top: '-20px',
                      left: `${(i / chapters.length) * 100}%`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                      {ch.title}
                    </span>
                    <div style={{ width: '2px', height: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '1px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail card style */}
      {thumbnail.show && thumbnailStyle === 'card' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', marginTop: '8px',
          background: 'rgba(0,0,0,0.04)', borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.7 }}>{thumbnail.text || 'Guarda il video'}</span>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <p style={{ fontSize: '13px', textAlign: 'center', opacity: 0.6, marginTop: '10px', lineHeight: 1.5 }}>
          {caption}
        </p>
      )}
    </div>
  );
}

// ================================================================
// CAROUSEL CONTENT
// ================================================================
function CarouselContent({ block }: { block: Block }) {
  const p = block.props as any;
  const items: any[] = p.items || [];
  const scrollDirection: string = p.scrollDirection || 'horizontal';
  const scrollSnap: boolean = p.scrollSnap !== false;
  const showArrows: boolean = p.showArrows !== false;
  const showDots: boolean = p.showDots !== false;
  const slidesPerView: number = p.slidesPerView || 3;
  const spaceBetween: number = p.spaceBetween || 20;
  const cardStyle: string = p.cardStyle || 'elevated';
  const showCategory: boolean = p.showCategory !== false;
  const showDate: boolean = p.showDate !== false;
  const showAuthor: boolean = p.showAuthor !== false;
  const showExcerpt: boolean = p.showExcerpt !== false;
  const hoverEffect: string = p.hoverEffect || 'lift';
  const height: string = p.height || 'auto';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  const isHorizontal = scrollDirection === 'horizontal';

  const CAROUSEL_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  // Card style CSS
  const getCardStyles = (): React.CSSProperties => {
    switch (cardStyle) {
      case 'flat':
        return { background: 'rgba(0,0,0,0.02)', border: 'none' };
      case 'elevated':
        return { background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)', border: 'none' };
      case 'bordered':
        return { background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', boxShadow: 'none' };
      case 'glass':
        return { background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' };
      default:
        return { background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
    }
  };

  // Hover effect inline style
  const getHoverClass = (): string => {
    switch (hoverEffect) {
      case 'lift': return 'sb-carousel-hover-lift';
      case 'zoom': return 'sb-carousel-hover-zoom';
      case 'tilt': return 'sb-carousel-hover-tilt';
      case 'glow': return 'sb-carousel-hover-glow';
      default: return '';
    }
  };

  // Scroll handlers
  const scrollBy = (direction: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = isHorizontal
      ? container.clientWidth / slidesPerView * direction
      : container.clientHeight / slidesPerView * direction;
    if (isHorizontal) {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    if (isHorizontal) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      setScrollPos(maxScroll > 0 ? container.scrollLeft / maxScroll : 0);
    } else {
      const maxScroll = container.scrollHeight - container.clientHeight;
      setScrollPos(maxScroll > 0 ? container.scrollTop / maxScroll : 0);
    }
  };

  // Dot count based on items and slides per view
  const dotCount = Math.max(1, Math.ceil(items.length / slidesPerView));
  const activeDot = Math.min(Math.floor(scrollPos * dotCount), dotCount - 1);

  const scrollToDot = (dotIndex: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    if (isHorizontal) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: (dotIndex / (dotCount - 1 || 1)) * maxScroll, behavior: 'smooth' });
    } else {
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({ top: (dotIndex / (dotCount - 1 || 1)) * maxScroll, behavior: 'smooth' });
    }
  };

  // Render a single item
  const renderItem = (item: any, index: number) => {
    const hasImage = !!item.image;
    const gradient = CAROUSEL_GRADIENTS[index % CAROUSEL_GRADIENTS.length];
    const isArticle = item.type === 'article';
    const badge: string = item.badge || '';

    const slideWidth = isHorizontal
      ? `calc((100% - ${spaceBetween * (slidesPerView - 1)}px) / ${slidesPerView})`
      : '100%';
    const slideHeight = !isHorizontal ? '280px' : undefined;

    return (
      <div
        key={item.id || index}
        className={cn('sb-carousel-item', getHoverClass())}
        style={{
          flex: `0 0 ${slideWidth}`,
          width: isHorizontal ? slideWidth : '100%',
          height: slideHeight,
          scrollSnapAlign: scrollSnap ? 'start' : undefined,
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          ...getCardStyles(),
        }}
      >
        {/* Image area */}
        <div style={{
          position: 'relative', height: isArticle ? '180px' : '160px',
          background: hasImage ? undefined : gradient,
          overflow: 'hidden',
        }}>
          {hasImage ? (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              transition: 'transform 0.4s ease',
            }} className="sb-carousel-item-img" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Category badge */}
          {isArticle && showCategory && item.category && (
            <div style={{
              position: 'absolute', bottom: 10, left: 10, zIndex: 4,
              padding: '3px 10px', borderRadius: '4px',
              background: '#2563eb', color: '#ffffff',
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {item.category}
            </div>
          )}

          {/* Custom badge */}
          {badge && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 4,
              padding: '3px 8px', borderRadius: '4px',
              background: badge === 'BREAKING' ? '#dc2626' : badge === 'NEW' ? '#059669' : 'rgba(0,0,0,0.7)',
              color: '#ffffff', fontSize: '9px', fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {badge}
            </div>
          )}

          {/* Overlay gradient */}
          {item.overlay?.enabled && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
              zIndex: 2,
            }} />
          )}
        </div>

        {/* Content area */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Title */}
          <h4 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 6px', color: '#1a1a1a' }}>
            {item.title || 'Titolo'}
          </h4>

          {/* Excerpt / description */}
          {isArticle && showExcerpt && item.excerpt && (
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.excerpt}
            </p>
          )}
          {!isArticle && item.description && (
            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, margin: '0 0 10px' }}>
              {item.description}
            </p>
          )}

          {/* Article meta: author + date */}
          {isArticle && (showAuthor || showDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '11px', color: '#999' }}>
              {showAuthor && item.author && (
                <span style={{ fontWeight: 600 }}>{item.author}</span>
              )}
              {showAuthor && item.author && showDate && item.date && (
                <span style={{ opacity: 0.5 }}>·</span>
              )}
              {showDate && item.date && (
                <span>{item.date}</span>
              )}
            </div>
          )}

          {/* Card buttons */}
          {!isArticle && item.buttons && item.buttons.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {item.buttons.map((btn: any) => (
                <span
                  key={btn.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: btn.style === 'primary' ? '6px 16px' : '5px 15px',
                    background: btn.style === 'primary' ? '#2563eb' : 'transparent',
                    color: btn.style === 'primary' ? '#ffffff' : '#2563eb',
                    border: btn.style === 'primary' ? 'none' : '1.5px solid #2563eb',
                    borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {btn.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: height === 'auto' ? undefined : height }}>
      <style>{`
        .sb-carousel-hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .sb-carousel-hover-zoom:hover .sb-carousel-item-img { transform: scale(1.08); }
        .sb-carousel-hover-tilt:hover { transform: perspective(800px) rotateY(-2deg) rotateX(2deg); }
        .sb-carousel-hover-glow:hover { box-shadow: 0 0 20px rgba(37,99,235,0.25), 0 4px 20px rgba(0,0,0,0.08) !important; }
        .sb-carousel-scroll::-webkit-scrollbar { display: none; }
        .sb-carousel-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="sb-carousel-scroll"
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          gap: `${spaceBetween}px`,
          overflowX: isHorizontal ? 'auto' : 'hidden',
          overflowY: isHorizontal ? 'hidden' : 'auto',
          scrollSnapType: scrollSnap ? (isHorizontal ? 'x mandatory' : 'y mandatory') : undefined,
          paddingBottom: isHorizontal ? '4px' : undefined,
          maxHeight: !isHorizontal && height !== 'auto' ? height : undefined,
        }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>

      {/* Arrows */}
      {showArrows && items.length > slidesPerView && (
        <>
          {isHorizontal ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollBy(-1); }}
                style={{
                  position: 'absolute', top: '50%', left: -16, transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 5, transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollBy(1); }}
                style={{
                  position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 5, transition: 'all 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); scrollBy(-1); }}
                style={{
                  position: 'absolute', left: '50%', top: -16, transform: 'translateX(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); scrollBy(1); }}
                style={{
                  position: 'absolute', left: '50%', bottom: -16, transform: 'translateX(-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </>
          )}
        </>
      )}

      {/* Dots indicator */}
      {showDots && dotCount > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6,
          marginTop: 16,
        }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); scrollToDot(i); }}
              style={{
                width: i === activeDot ? 20 : 8, height: 8,
                borderRadius: 4, border: 'none', padding: 0,
                background: i === activeDot ? '#2563eb' : 'rgba(0,0,0,0.15)',
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccordionContent({ block }: { block: Block }) {
  const p = block.props as { items: { id: string; title: string }[] };
  return (
    <div style={{ borderTop: `1px solid var(--c-border)` }}>
      {p.items?.map((item) => <div key={item.id} className="py-3" style={{ borderBottom: `1px solid var(--c-border)` }}><div className="font-medium flex items-center justify-between cursor-pointer" style={{ color: 'var(--c-text-0)' }}>{item.title}<span style={{ color: 'var(--c-text-2)' }}>+</span></div></div>)}
    </div>
  );
}

function AuthorBioContent({ block }: { block: Block }) {
  const p = block.props as { name: string; role: string; bio: string };
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full shrink-0" style={{ background: 'var(--c-bg-1)' }} />
      <div><div className="font-semibold" style={{ color: 'var(--c-text-0)' }}>{p.name}</div><div className="text-sm" style={{ color: 'var(--c-text-2)' }}>{p.role}</div><div className="text-sm mt-1 opacity-70" style={{ color: 'var(--c-text-1)' }}>{p.bio}</div></div>
    </div>
  );
}

// ================================================================
// SLIDESHOW CONTENT
// ================================================================
interface SlideOverlay { enabled: boolean; color: string; position: string }
interface SlideButton { id: string; text: string; url: string; style: string }
interface SlideTextStyle { titleSize: string; titleWeight: string; descSize: string; color: string }
interface Slide {
  id: string; type: string; image: string; title: string; description: string; link: string;
  overlay: SlideOverlay; buttons: SlideButton[]; textStyle: SlideTextStyle;
}
interface SlideshowProps {
  slides: Slide[];
  autoplay: boolean; interval: number; pauseOnHover: boolean;
  transition: string; transitionSpeed: number; direction: string;
  slidesPerView: number; spaceBetween: number; loop: boolean;
  showDots: boolean; showArrows: boolean; showProgress: boolean;
  dotsPosition: string; arrowStyle: string; height: string; objectFit: string;
  showThumbnails: boolean; thumbnailPosition: string;
  kenBurns: boolean; parallaxEffect: boolean;
}

const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const OVERLAY_POSITIONS: Record<string, React.CSSProperties> = {
  'top-left': { top: 0, left: 0, alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left' },
  'top-center': { top: 0, left: 0, right: 0, alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center' },
  'top-right': { top: 0, right: 0, alignItems: 'flex-start', justifyContent: 'flex-end', textAlign: 'right' },
  'center-left': { top: 0, left: 0, alignItems: 'center', justifyContent: 'flex-start', textAlign: 'left' },
  'center': { top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  'center-right': { top: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right' },
  'bottom-left': { bottom: 0, left: 0, alignItems: 'flex-end', justifyContent: 'flex-start', textAlign: 'left' },
  'bottom-center': { bottom: 0, left: 0, right: 0, alignItems: 'flex-end', justifyContent: 'center', textAlign: 'center' },
  'bottom-right': { bottom: 0, right: 0, alignItems: 'flex-end', justifyContent: 'flex-end', textAlign: 'right' },
};

function SlideshowContent({ block }: { block: Block }) {
  const p = block.props as unknown as SlideshowProps;
  const slides = p.slides || [];
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideCount = slides.length;
  const canLoop = p.loop !== false;

  const goTo = useCallback((idx: number) => {
    if (canLoop) {
      setCurrent(((idx % slideCount) + slideCount) % slideCount);
    } else {
      setCurrent(Math.max(0, Math.min(slideCount - 1, idx)));
    }
    setProgressWidth(0);
  }, [slideCount, canLoop]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Autoplay
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (p.autoplay && !isPaused && slideCount > 1) {
      const interval = p.interval || 5000;
      setProgressWidth(0);
      // Progress bar animation
      if (p.showProgress) {
        const step = 50; // update every 50ms
        let elapsed = 0;
        progressRef.current = setInterval(() => {
          elapsed += step;
          setProgressWidth(Math.min((elapsed / interval) * 100, 100));
        }, step);
      }
      intervalRef.current = setInterval(() => {
        setCurrent(c => {
          const n = c + 1;
          return canLoop ? n % slideCount : Math.min(n, slideCount - 1);
        });
        setProgressWidth(0);
      }, interval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [p.autoplay, p.interval, p.showProgress, isPaused, slideCount, canLoop]);

  const speed = p.transitionSpeed || 600;
  const isVertical = p.direction === 'vertical';
  const transitionType = p.transition || 'fade';

  // Build per-slide transform/opacity for the transition
  const getSlideStyle = (index: number): React.CSSProperties => {
    const isActive = index === current;
    const offset = index - current;
    const base: React.CSSProperties = {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      transition: `all ${speed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };

    switch (transitionType) {
      case 'fade':
        return { ...base, opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 1 };
      case 'slide-h':
        return { ...base, opacity: 1, transform: `translateX(${offset * 100}%)`, zIndex: 2 };
      case 'slide-v':
        return { ...base, opacity: 1, transform: `translateY(${offset * 100}%)`, zIndex: 2 };
      case 'zoom':
        return { ...base, opacity: isActive ? 1 : 0, transform: isActive ? 'scale(1)' : 'scale(1.15)', zIndex: isActive ? 2 : 1 };
      case 'flip':
        return { ...base, opacity: isActive ? 1 : 0, transform: isActive ? 'perspective(1200px) rotateY(0deg)' : `perspective(1200px) rotateY(${offset > 0 ? '90deg' : '-90deg'})`, zIndex: isActive ? 2 : 1, backfaceVisibility: 'hidden' };
      case 'cube':
        return {
          ...base, opacity: Math.abs(offset) <= 1 ? 1 : 0,
          transform: isActive ? 'perspective(1200px) rotateY(0deg)' : `perspective(1200px) rotateY(${offset * 90}deg) translateZ(50%)`,
          transformOrigin: offset > 0 ? 'left center' : 'right center',
          zIndex: isActive ? 2 : 1,
        };
      case 'coverflow':
        return {
          ...base,
          opacity: Math.abs(offset) <= 2 ? 1 - Math.abs(offset) * 0.3 : 0,
          transform: `translateX(${offset * 70}%) scale(${isActive ? 1 : 0.85}) rotateY(${offset * -15}deg)`,
          zIndex: isActive ? 3 : 2 - Math.abs(offset),
        };
      case 'creative':
        return {
          ...base, opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateX(0) rotate(0deg) scale(1)' : `translateX(${offset > 0 ? '80%' : '-80%'}) rotate(${offset > 0 ? '8deg' : '-8deg'}) scale(0.8)`,
          zIndex: isActive ? 2 : 1,
        };
      default:
        return { ...base, opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 1 };
    }
  };

  // Ken Burns keyframe name per slide
  const kenBurnsStyle = (index: number): React.CSSProperties => {
    if (!p.kenBurns || index !== current) return {};
    return {
      animation: `kenBurns ${(p.interval || 5000) + speed}ms ease-in-out forwards`,
    };
  };

  // Arrow button styles
  const arrowBase = 'absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all';
  const arrowStylesObj: Record<string, React.CSSProperties> = {
    circle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      color: 'white'
    },
    square: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      color: 'white'
    },
    minimal: {
      width: '32px',
      height: '32px',
      borderRadius: '4px',
      color: 'white'
    },
    none: { display: 'none' },
  };
  const arrowStyles: Record<string, string> = {
    circle: `${arrowBase} w-10 h-10 rounded-full backdrop-blur-sm`,
    square: `${arrowBase} w-10 h-10 rounded-lg backdrop-blur-sm`,
    minimal: `${arrowBase} w-8 h-8 rounded`,
    none: 'hidden',
  };
  const arrowClass = arrowStyles[p.arrowStyle || 'circle'] || arrowStyles.circle;

  // Dots position styles
  const dotsContainerStyle = (): React.CSSProperties => {
    const pos = p.dotsPosition || 'bottom';
    switch (pos) {
      case 'top': return { position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 10 };
      case 'left': return { position: 'absolute', left: 12, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, zIndex: 10 };
      case 'right': return { position: 'absolute', right: 12, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, zIndex: 10 };
      default: return { position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 10 };
    }
  };

  // Thumbnail strip
  const thumbnailsPosition = p.thumbnailPosition || 'bottom';
  const isThumbHoriz = thumbnailsPosition === 'bottom' || thumbnailsPosition === 'top';

  return (
    <div
      style={{ height: p.height || '500px', position: 'relative', overflow: 'hidden', borderRadius: 'inherit' }}
      onMouseEnter={() => p.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => p.pauseOnHover && setIsPaused(false)}
    >
      {/* Ken Burns keyframes */}
      {p.kenBurns && (
        <style>{`
          @keyframes kenBurns {
            0% { transform: scale(1) translate(0, 0); }
            50% { transform: scale(1.08) translate(-1%, -1%); }
            100% { transform: scale(1.12) translate(1%, 0.5%); }
          }
        `}</style>
      )}

      {/* Slides container */}
      <div style={{ position: 'relative', width: '100%', height: p.showThumbnails ? (isThumbHoriz ? 'calc(100% - 72px)' : '100%') : '100%' }}>
        {slides.map((slide, index) => {
          const hasImage = !!slide.image;
          const gradient = SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];
          const overlayPos = OVERLAY_POSITIONS[slide.overlay?.position || 'bottom-left'] || OVERLAY_POSITIONS['bottom-left'];

          return (
            <div key={slide.id} style={getSlideStyle(index)}>
              {/* Slide background */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: hasImage ? undefined : gradient,
                  backgroundImage: hasImage ? `url(${slide.image})` : undefined,
                  backgroundSize: p.objectFit || 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  ...kenBurnsStyle(index),
                }}
              >
                {/* Placeholder icon when no image */}
                {!hasImage && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Overlay gradient */}
              {slide.overlay?.enabled && (
                <div style={{ position: 'absolute', inset: 0, background: slide.overlay.color || 'rgba(0,0,0,0.4)', zIndex: 1 }} />
              )}

              {/* Text overlay content */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column',
                padding: '32px 40px',
                ...overlayPos,
              }}>
                <div style={{ maxWidth: '600px' }}>
                  {slide.title && (
                    <h2 style={{
                      fontSize: slide.textStyle?.titleSize || '36px',
                      fontWeight: slide.textStyle?.titleWeight || '700',
                      color: slide.textStyle?.color || '#ffffff',
                      margin: '0 0 8px 0', lineHeight: 1.2,
                      textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      {slide.title}
                    </h2>
                  )}
                  {slide.description && (
                    <p style={{
                      fontSize: slide.textStyle?.descSize || '16px',
                      color: slide.textStyle?.color || '#ffffff',
                      margin: '0 0 16px 0', opacity: 0.9, lineHeight: 1.5,
                      textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                      {slide.description}
                    </p>
                  )}
                  {/* Buttons */}
                  {slide.buttons && slide.buttons.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      {slide.buttons.map((btn) => (
                        <span
                          key={btn.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: btn.style === 'primary' ? '10px 24px' : '9px 23px',
                            background: btn.style === 'primary' ? '#2563eb' : 'transparent',
                            color: '#ffffff',
                            border: btn.style === 'primary' ? 'none' : '2px solid rgba(255,255,255,0.8)',
                            borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: btn.style === 'primary' ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                          }}
                        >
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {p.showArrows !== false && slideCount > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className={arrowClass}
            style={{ left: 12 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className={arrowClass}
            style={{ right: 12 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {p.showDots !== false && slideCount > 1 && (
        <div style={dotsContainerStyle()}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              style={{
                width: i === current ? 24 : 8, height: 8,
                borderRadius: 4,
                background: i === current ? '#ffffff' : 'rgba(255,255,255,0.5)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {p.showProgress && slideCount > 1 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)', zIndex: 10 }}>
          <div style={{
            height: '100%', background: '#ffffff',
            width: `${progressWidth}%`,
            transition: 'width 50ms linear',
          }} />
        </div>
      )}

      {/* Slide counter badge */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        color: '#fff', fontSize: 12, fontWeight: 600,
        padding: '4px 10px', borderRadius: 20,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {current + 1} / {slideCount}
      </div>

      {/* Thumbnails strip */}
      {p.showThumbnails && slideCount > 1 && (
        <div style={{
          display: 'flex',
          flexDirection: isThumbHoriz ? 'row' : 'column',
          gap: 6,
          padding: 6,
          background: 'rgba(0,0,0,0.8)',
          ...(thumbnailsPosition === 'bottom' ? { position: 'absolute', bottom: 0, left: 0, right: 0 } :
             thumbnailsPosition === 'top' ? { position: 'absolute', top: 0, left: 0, right: 0 } :
             thumbnailsPosition === 'left' ? { position: 'absolute', top: 0, left: 0, bottom: 0, width: 80 } :
             { position: 'absolute', top: 0, right: 0, bottom: 0, width: 80 }),
          overflowX: isThumbHoriz ? 'auto' : 'hidden',
          overflowY: isThumbHoriz ? 'hidden' : 'auto',
          justifyContent: isThumbHoriz ? 'center' : 'flex-start',
          alignItems: 'center',
          zIndex: 10,
        }}>
          {slides.map((slide, i) => {
            const hasImg = !!slide.image;
            const grad = SLIDE_GRADIENTS[i % SLIDE_GRADIENTS.length];
            return (
              <button
                key={slide.id}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                style={{
                  width: isThumbHoriz ? 60 : '100%',
                  height: isThumbHoriz ? 40 : 50,
                  flexShrink: 0,
                  borderRadius: 4,
                  border: i === current ? '2px solid #ffffff' : '2px solid transparent',
                  background: hasImg ? `url(${slide.image}) center/cover no-repeat` : grad,
                  cursor: 'pointer',
                  opacity: i === current ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  padding: 0,
                  overflow: 'hidden',
                }}
                title={slide.title}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================================
// CSS BUILDER
// ================================================================
function buildCssFromBlockStyle(block: Block): React.CSSProperties {
  const s = block.style;
  const css: React.CSSProperties = {};
  if (s.layout.display) css.display = s.layout.display;
  if (s.layout.flexDirection) css.flexDirection = s.layout.flexDirection as 'row' | 'column';
  if (s.layout.justifyContent) css.justifyContent = s.layout.justifyContent;
  if (s.layout.alignItems) css.alignItems = s.layout.alignItems;
  if (s.layout.gap) css.gap = s.layout.gap;
  css.padding = `${s.layout.padding.top} ${s.layout.padding.right} ${s.layout.padding.bottom} ${s.layout.padding.left}`;
  css.margin = `${s.layout.margin.top} ${s.layout.margin.right} ${s.layout.margin.bottom} ${s.layout.margin.left}`;
  if (s.layout.width) css.width = s.layout.width;
  if (s.layout.maxWidth) css.maxWidth = s.layout.maxWidth;
  if (s.layout.minHeight) css.minHeight = s.layout.minHeight;
  if (s.layout.overflow) css.overflow = s.layout.overflow as 'hidden' | 'auto';
  if (s.layout.position) css.position = s.layout.position as 'relative' | 'sticky';
  if (s.layout.zIndex) css.zIndex = s.layout.zIndex;
  // Use background shorthand for all types to avoid conflicts with backgroundColor
  if (s.background.type === 'color' && s.background.value) {
    css.background = s.background.value;
    delete (css as any).backgroundColor;
  } else if (s.background.type === 'gradient' && s.background.value) {
    css.background = s.background.value;
    delete (css as any).backgroundColor;
  } else if (s.background.type === 'image' && s.background.value) {
    css.background = `url(${s.background.value})`;
    css.backgroundSize = s.background.size || 'cover';
    css.backgroundPosition = s.background.position || 'center';
    css.backgroundRepeat = s.background.repeat || 'no-repeat';
    delete (css as any).backgroundColor;
  }
  if (s.typography.fontFamily) css.fontFamily = s.typography.fontFamily;
  if (s.typography.fontSize) css.fontSize = s.typography.fontSize;
  if (s.typography.fontWeight) css.fontWeight = s.typography.fontWeight;
  if (s.typography.lineHeight) css.lineHeight = s.typography.lineHeight;
  if (s.typography.letterSpacing) css.letterSpacing = s.typography.letterSpacing;
  if (s.typography.color) css.color = s.typography.color;
  if (s.typography.textAlign) css.textAlign = s.typography.textAlign as 'left' | 'center' | 'right';
  if (s.typography.textTransform) css.textTransform = s.typography.textTransform as 'uppercase' | 'lowercase';
  if (s.border.width) css.borderWidth = s.border.width;
  if (s.border.style) css.borderStyle = s.border.style;
  if (s.border.color) css.borderColor = s.border.color;
  if (s.border.radius) css.borderRadius = s.border.radius;
  if (s.shadow) css.boxShadow = s.shadow;
  if (s.opacity !== undefined) css.opacity = s.opacity;
  // translate() is applied on the wrapper for free drag; only pass non-translate transforms to inner div
  if (s.transform) {
    const nonTranslate = s.transform.replace(/translate\([^)]*\)/g, '').trim();
    if (nonTranslate) css.transform = nonTranslate;
  }
  if (s.transition) css.transition = s.transition;
  if (s.filter) css.filter = s.filter;
  if (s.backdropFilter) (css as Record<string,string>).backdropFilter = s.backdropFilter;
  if (s.mixBlendMode) (css as Record<string,string>).mixBlendMode = s.mixBlendMode;
  if (s.textShadow) (css as Record<string,string>).textShadow = s.textShadow;

  // Apply clip-path from dividers (section border shaping)
  // If topDivider or bottomDivider exist, apply them as clip-path to make shape contour
  const blockRef = block as any;
  if (blockRef.shape?.topDivider || blockRef.shape?.bottomDivider) {
    const topDivider = blockRef.shape?.topDivider;
    const bottomDivider = blockRef.shape?.bottomDivider;

    // If only topDivider, apply top clip-path
    if (topDivider && !bottomDivider) {
      const clipPath = dividerToClipPath(topDivider.shape, topDivider.height || 60);
      (css as Record<string,string>).clipPath = clipPath;

      // Apply gradient if enabled
      if (topDivider.gradient?.enabled) {
        const gradientMask = generateDividerGradientMask(
          topDivider.gradient.colorStart || topDivider.color || '#ffffff',
          topDivider.gradient.colorEnd || 'transparent',
          topDivider.gradient.direction || 'vertical'
        );
        (css as Record<string,string>).backgroundImage = gradientMask;
      }
    }
    // If both or only bottom, apply bottom clip-path (inverted)
    else if (bottomDivider) {
      const clipPath = dividerToClipPath(bottomDivider.shape, bottomDivider.height || 60);
      (css as Record<string,string>).clipPath = clipPath;

      // Apply gradient if enabled
      if (bottomDivider.gradient?.enabled) {
        const gradientMask = generateDividerGradientMask(
          bottomDivider.gradient.colorStart || bottomDivider.color || '#ffffff',
          bottomDivider.gradient.colorEnd || 'transparent',
          bottomDivider.gradient.direction || 'vertical'
        );
        (css as Record<string,string>).backgroundImage = gradientMask;
      }
    }
  }

  // Apply effects (glassmorphism)
  if (s.effects?.glassmorphism?.enabled) {
    const g = s.effects.glassmorphism;
    const backdropStr = `blur(${g.blur || 10}px) saturate(${g.saturation || 100}%)`;
    (css as Record<string,string>).backdropFilter = backdropStr;

    // Convert hex color to RGB for rgba()
    const hexColor = g.bgColor || '#ffffff';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const gb = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    css.background = `rgba(${r}, ${gb}, ${b}, ${g.bgOpacity || 0.1})`;

    if (g.borderOpacity !== undefined) css.borderColor = `rgba(0, 0, 0, ${g.borderOpacity})`;
  }

  return css;
}
