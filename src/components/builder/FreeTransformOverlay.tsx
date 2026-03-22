'use client';

import { useRef, useEffect, useState } from 'react';
import type { Block } from '@/lib/types';

interface FreeTransformOverlayProps {
  block: Block;
  onUpdateClipPath: (newClipPath: string) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
  label: string;
}

/**
 * Free Transform Overlay - Inline editor for precise shape manipulation
 * Allows dragging vertices and center point to customize clip-path
 */
export function FreeTransformOverlay({ block, onUpdateClipPath, onClose }: FreeTransformOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [draggedPointIdx, setDraggedPointIdx] = useState<number | null>(null);
  const [draggingCenter, setDraggingCenter] = useState(false);
  const [isCircle, setIsCircle] = useState(false);
  const [isEllipse, setIsEllipse] = useState(false);

  // Parse clip-path to extract points or circle/ellipse params
  useEffect(() => {
    const clipPath = block.shape?.value || '';

    if (clipPath.includes('circle(')) {
      setIsCircle(true);
      setIsEllipse(false);
      // Parse circle(50% at 50% 50%)
      const match = clipPath.match(/circle\(([\d.]+)%?\s*at\s*([\d.]+)%?\s+([\d.]+)%?\)/);
      if (match) {
        const radius = parseFloat(match[1]);
        const cx = parseFloat(match[2]);
        const cy = parseFloat(match[3]);
        setCenter({ x: cx, y: cy });
        // Create 4 points at cardinal directions
        const r = radius / 100 * 100; // Scale to percentage
        setPoints([
          { x: cx + r, y: cy, label: 'Right' },
          { x: cx - r, y: cy, label: 'Left' },
          { x: cx, y: cy + r, label: 'Bottom' },
          { x: cx, y: cy - r, label: 'Top' },
        ]);
      }
    } else if (clipPath.includes('ellipse(')) {
      setIsEllipse(true);
      setIsCircle(false);
      // Parse ellipse(50% 35% at 50% 50%)
      const match = clipPath.match(/ellipse\(([\d.]+)%?\s+([\d.]+)%?\s*at\s*([\d.]+)%?\s+([\d.]+)%?\)/);
      if (match) {
        const rx = parseFloat(match[1]);
        const ry = parseFloat(match[2]);
        const cx = parseFloat(match[3]);
        const cy = parseFloat(match[4]);
        setCenter({ x: cx, y: cy });
        setPoints([
          { x: cx + rx, y: cy, label: 'Right' },
          { x: cx - rx, y: cy, label: 'Left' },
          { x: cx, y: cy + ry, label: 'Bottom' },
          { x: cx, y: cy - ry, label: 'Top' },
        ]);
      }
    } else if (clipPath.includes('polygon(')) {
      setIsCircle(false);
      setIsEllipse(false);
      // Parse polygon(x1% y1%, x2% y2%, ...)
      const match = clipPath.match(/polygon\((.*?)\)/);
      if (match) {
        const pairs = match[1].split(',').map(p => p.trim());
        const extractedPoints: Point[] = [];
        let sumX = 0, sumY = 0;

        pairs.forEach((pair, idx) => {
          const [x, y] = pair.split(/\s+/).map(v => parseFloat(v));
          extractedPoints.push({ x, y, label: `V${idx}` });
          sumX += x;
          sumY += y;
        });

        setPoints(extractedPoints);
        setCenter({ x: sumX / extractedPoints.length, y: sumY / extractedPoints.length });
      }
    }
  }, [block.shape?.value]);

  // Handle point drag
  const handlePointMouseDown = (idx: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedPointIdx(idx);
  };

  // Handle center drag
  const handleCenterMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingCenter(true);
  };

  // Global mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp to 0-100
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      if (draggedPointIdx !== null) {
        const newPoints = [...points];
        newPoints[draggedPointIdx] = { ...newPoints[draggedPointIdx], x: clampedX, y: clampedY };
        setPoints(newPoints);

        // Update clip-path in real-time
        if (isCircle || isEllipse) {
          // For circle/ellipse, calculate radius from drag
          const dx = clampedX - center.x;
          const dy = clampedY - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          if (isCircle) {
            const newClipPath = `circle(${radius.toFixed(2)}% at ${center.x.toFixed(2)}% ${center.y.toFixed(2)}%)`;
            onUpdateClipPath(newClipPath);
          } else if (isEllipse) {
            // For ellipse, need rx and ry - simplified: use distance to edge
            const newClipPath = `ellipse(${Math.abs(dx).toFixed(2)}% ${Math.abs(dy).toFixed(2)}% at ${center.x.toFixed(2)}% ${center.y.toFixed(2)}%)`;
            onUpdateClipPath(newClipPath);
          }
        } else {
          // For polygon
          const polygonCss = `polygon(${newPoints.map(p => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ')})`;
          onUpdateClipPath(polygonCss);
        }
      } else if (draggingCenter) {
        const newCenter = { x: clampedX, y: clampedY };

        // Offset all points by the center movement
        const dx = newCenter.x - center.x;
        const dy = newCenter.y - center.y;
        const newPoints = points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));

        setCenter(newCenter);
        setPoints(newPoints);

        // Update clip-path
        if (isCircle) {
          const radius = Math.sqrt(
            Math.pow(points[0].x - center.x, 2) +
            Math.pow(points[0].y - center.y, 2)
          );
          const newClipPath = `circle(${radius.toFixed(2)}% at ${newCenter.x.toFixed(2)}% ${newCenter.y.toFixed(2)}%)`;
          onUpdateClipPath(newClipPath);
        } else if (isEllipse) {
          const rx = Math.abs(points[0].x - center.x);
          const ry = Math.abs(points[2].y - center.y);
          const newClipPath = `ellipse(${rx.toFixed(2)}% ${ry.toFixed(2)}% at ${newCenter.x.toFixed(2)}% ${newCenter.y.toFixed(2)}%)`;
          onUpdateClipPath(newClipPath);
        } else {
          const polygonCss = `polygon(${newPoints.map(p => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ')})`;
          onUpdateClipPath(polygonCss);
        }
      }
    };

    const handleMouseUp = () => {
      setDraggedPointIdx(null);
      setDraggingCenter(false);
    };

    if (draggedPointIdx !== null || draggingCenter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedPointIdx, draggingCenter, points, center, isCircle, isEllipse, onUpdateClipPath]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 bg-blue-500/5 border-2 border-blue-400 rounded cursor-crosshair pointer-events-auto"
      style={{ zIndex: 100 }}
      onClick={onClose}
    >
      {/* SVG overlay for visual feedback */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 101 }}
      >
        {/* Draw current shape outline */}
        {isCircle && (
          <circle
            cx={`${center.x}%`}
            cy={`${center.y}%`}
            r={`${Math.sqrt(Math.pow(points[0].x - center.x, 2) + Math.pow(points[0].y - center.y, 2))}%`}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="1"
            opacity="0.5"
          />
        )}
        {isEllipse && (
          <ellipse
            cx={`${center.x}%`}
            cy={`${center.y}%`}
            rx={`${Math.abs(points[0].x - center.x)}%`}
            ry={`${Math.abs(points[2].y - center.y)}%`}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="1"
            opacity="0.5"
          />
        )}
        {!isCircle && !isEllipse && (
          <polygon
            points={points.map(p => `${p.x}%,${p.y}%`).join(' ')}
            fill="none"
            stroke="var(--c-accent)"
            strokeWidth="1"
            opacity="0.5"
          />
        )}

        {/* Center point */}
        <circle
          cx={`${center.x}%`}
          cy={`${center.y}%`}
          r="4"
          fill="#ef4444"
          opacity="0.8"
          style={{ cursor: 'move', pointerEvents: 'auto' }}
          onMouseDown={handleCenterMouseDown}
        />
      </svg>

      {/* Draggable vertices */}
      {points.map((point, idx) => (
        <div
          key={idx}
          className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-50 pointer-events-auto"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: draggedPointIdx === idx ? 'grabbing' : 'grab',
            opacity: draggedPointIdx === idx ? 1 : 0.8,
          }}
          onMouseDown={handlePointMouseDown(idx)}
          title={point.label}
        />
      ))}

      {/* Close hint */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded pointer-events-none">
        Trascina i punti o il centro | Click qui per chiudere
      </div>
    </div>
  );
}
