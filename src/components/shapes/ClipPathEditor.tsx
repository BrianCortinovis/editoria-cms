'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react';
import { usePageStore } from '@/lib/stores/page-store';
import type { Block } from '@/lib/types';
import { AIModal } from '@/components/ai/AIModal';

interface Point {
  x: number;
  y: number;
  isCurve?: boolean;
  cp1?: { x: number; y: number }; // control point 1 for bezier
  cp2?: { x: number; y: number }; // control point 2 for bezier
}

interface ClipPathEditorProps {
  block: Block;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 6;

export function ClipPathEditor({ block }: ClipPathEditorProps) {
  const { updateBlockShape } = usePageStore();
  const canvasRef = useRef<SVGSVGElement>(null);

  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'preset' | 'editor'>('preset');
  const [points, setPoints] = useState<Point[]>([
    { x: 50, y: 50 },
    { x: 250, y: 50 },
    { x: 250, y: 150 },
    { x: 50, y: 150 },
  ]);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [isBezierMode, setIsBezierMode] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Generate polygon CSS from points
  const generatePolygonCss = (pts: Point[]): string => {
    if (pts.length < 3) return '';
    const polygonPoints = pts.map((p) => `${((p.x / CANVAS_WIDTH) * 100).toFixed(1)}% ${((p.y / CANVAS_HEIGHT) * 100).toFixed(1)}%`).join(', ');
    return `polygon(${polygonPoints})`;
  };

  // Generate path CSS from bezier points
  const generatePathCss = (pts: Point[]): string => {
    if (pts.length < 2) return '';
    // For path(), use SVG path syntax
    let pathData = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.isCurve && p.cp1 && p.cp2) {
        pathData += ` C ${p.cp1.x} ${p.cp1.y}, ${p.cp2.x} ${p.cp2.y}, ${p.x} ${p.y}`;
      } else {
        pathData += ` L ${p.x} ${p.y}`;
      }
    }
    pathData += ' Z';
    return `path('${pathData}')`;
  };

  const currentClipPath = block.shape?.value || generatePolygonCss(points);

  const updateClipPath = (newPoints: Point[], useBezier: boolean = false) => {
    setPoints(newPoints);
    const css = useBezier ? generatePathCss(newPoints) : generatePolygonCss(newPoints);
    updateBlockShape(block.id, {
      type: 'clip-path',
      value: css,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingMode) return;
    const svg = canvasRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y }]);
  };

  const handlePointMouseDown = (idx: number) => {
    setSelectedPointIdx(idx);
  };

  useEffect(() => {
    if (selectedPointIdx === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const svg = canvasRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(0, Math.min(CANVAS_WIDTH, e.clientX - rect.left));
      const y = Math.max(0, Math.min(CANVAS_HEIGHT, e.clientY - rect.top));

      const newPoints = [...points];
      newPoints[selectedPointIdx] = { ...newPoints[selectedPointIdx], x, y };
      updateClipPath(newPoints, isBezierMode);
    };

    const handleMouseUp = () => {
      setSelectedPointIdx(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedPointIdx, points, isBezierMode]);

  const removePoint = (idx: number) => {
    if (points.length > 3) {
      const newPoints = points.filter((_, i) => i !== idx);
      updateClipPath(newPoints, isBezierMode);
      setSelectedPointIdx(null);
    }
  };

  const contextData = JSON.stringify({
    current: { clipPath: currentClipPath, pointCount: points.length },
    blockType: block.type,
  });

  return (
    <div className="border-b" style={{ borderColor: 'var(--c-border)' }}>
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium cursor-pointer"
        style={{ color: 'var(--c-text-0)' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Forma Personalizzata
        </span>
      </div>

      {open && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Tab Selector */}
          <div className="flex gap-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
            <button
              onClick={() => setTab('preset')}
              className="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === 'preset' ? 'var(--c-accent)' : 'transparent',
                color: tab === 'preset' ? 'var(--c-accent)' : 'var(--c-text-1)',
              }}
            >
              Preset
            </button>
            <button
              onClick={() => setTab('editor')}
              className="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === 'editor' ? 'var(--c-accent)' : 'transparent',
                color: tab === 'editor' ? 'var(--c-accent)' : 'var(--c-text-1)',
              }}
            >
              Editor Visuale
            </button>
          </div>

          {tab === 'preset' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold block" style={{ color: 'var(--c-text-1)' }}>
                Forme Predefinite
              </label>
              <button
                onClick={() => updateClipPath([
                  { x: 0, y: 0 },
                  { x: CANVAS_WIDTH, y: 0 },
                  { x: CANVAS_WIDTH, y: CANVAS_HEIGHT },
                  { x: 0, y: CANVAS_HEIGHT },
                ])}
                className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
              >
                Rettangolo
              </button>
              <button
                onClick={() => updateClipPath([
                  { x: CANVAS_WIDTH / 2, y: 0 },
                  { x: CANVAS_WIDTH, y: CANVAS_HEIGHT },
                  { x: 0, y: CANVAS_HEIGHT },
                ])}
                className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
              >
                Triangolo
              </button>
              <button
                onClick={() => updateClipPath([
                  { x: CANVAS_WIDTH / 2, y: 0 },
                  { x: CANVAS_WIDTH, y: CANVAS_HEIGHT / 2 },
                  { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT },
                  { x: 0, y: CANVAS_HEIGHT / 2 },
                ])}
                className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
              >
                Rombo
              </button>
              <button
                onClick={() => updateClipPath([
                  { x: 75, y: 0 },
                  { x: CANVAS_WIDTH, y: 50 },
                  { x: CANVAS_WIDTH, y: CANVAS_HEIGHT },
                  { x: 0, y: CANVAS_HEIGHT },
                  { x: 0, y: 50 },
                ])}
                className="w-full px-3 py-2 rounded text-xs font-medium text-left"
                style={{ background: 'var(--c-bg-2)', color: 'var(--c-text-1)' }}
              >
                Trapezio
              </button>
            </div>
          )}

          {tab === 'editor' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold block" style={{ color: 'var(--c-text-1)' }}>
                Editor Visuale
              </label>

              {/* SVG Canvas */}
              <svg
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className="border rounded cursor-crosshair w-full"
                style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              >
                {/* Preview shape */}
                {points.length >= 3 && (
                  <polygon
                    points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="var(--c-accent)"
                    strokeWidth="1"
                  />
                )}

                {/* Control points */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    {/* Connection line to next point */}
                    {idx < points.length - 1 && (
                      <line
                        x1={p.x}
                        y1={p.y}
                        x2={points[idx + 1].x}
                        y2={points[idx + 1].y}
                        stroke="var(--c-border)"
                        strokeWidth="1"
                      />
                    )}
                    {/* Close shape line */}
                    {idx === points.length - 1 && points.length > 2 && (
                      <line
                        x1={p.x}
                        y1={p.y}
                        x2={points[0].x}
                        y2={points[0].y}
                        stroke="var(--c-border)"
                        strokeWidth="1"
                      />
                    )}
                    {/* Point circle */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={POINT_RADIUS}
                      fill={selectedPointIdx === idx ? 'var(--c-accent)' : 'white'}
                      stroke={selectedPointIdx === idx ? 'var(--c-accent)' : 'var(--c-border)'}
                      strokeWidth="1.5"
                      onMouseDown={() => handlePointMouseDown(idx)}
                      style={{ cursor: 'grab' }}
                    />
                  </g>
                ))}
              </svg>

              {/* Mode Toggles */}
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drawingMode}
                    onChange={(e) => setDrawingMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
                    Modalità Disegno
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBezierMode}
                    onChange={(e) => setIsBezierMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--c-text-1)' }}>
                    Bezier
                  </span>
                </label>
              </div>

              {/* Points List */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--c-text-1)' }}>
                  Punti ({points.length})
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {points.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                      style={{
                        background: selectedPointIdx === idx ? 'var(--c-accent-soft)' : 'var(--c-bg-2)',
                        color: 'var(--c-text-0)',
                      }}
                    >
                      <span className="flex-1">
                        P{idx + 1}: ({Math.round(p.x)}, {Math.round(p.y)})
                      </span>
                      {points.length > 3 && (
                        <button
                          onClick={() => removePoint(idx)}
                          className="p-0.5 rounded hover:opacity-75"
                        >
                          <Trash2 size={12} style={{ color: 'var(--c-danger)' }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Value Display */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-text-1)' }}>
              CSS Attuale
            </label>
            <textarea
              value={currentClipPath}
              readOnly
              className="w-full px-2 py-1 text-[10px] font-mono rounded border"
              style={{
                background: 'var(--c-bg-1)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text-2)',
              }}
              rows={2}
            />
          </div>

          {/* AI Suggestion */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="w-full px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: 'var(--c-accent)', color: 'white' }}
          >
            <Sparkles size={16} />
            Suggerisci forma
          </button>

          <AIModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            defaultPrompt="Suggest a beautiful clip-path shape for this block: {context}. Return JSON with shape (organic|geometric) and CSS value (polygon or path)."
            contextData={contextData}
            title="Suggerisci Forma"
            onApply={(result) => {
              try {
                const parsed = JSON.parse(result) as { shape?: string; value?: string } | string;
                const value = typeof parsed === 'string' ? parsed : (parsed.value || result);
                if (value && (value.includes('polygon(') || value.includes('path(') || value.includes('circle('))) {
                  updateBlockShape(block.id, {
                    type: 'clip-path',
                    value,
                  });
                }
              } catch {
                // If not valid JSON, try using raw result as clip-path value
                if (result && (result.includes('polygon(') || result.includes('path(') || result.includes('circle('))) {
                  updateBlockShape(block.id, {
                    type: 'clip-path',
                    value: result,
                  });
                } else {
                  console.error('Invalid clip-path response:', result);
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
