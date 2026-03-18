"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface SlotChild {
  key: string;
  label: string;
  type: "text" | "image" | "link" | "html" | "list";
}

interface SlotZone {
  id: string;
  slot_key: string;
  label: string;
  content_type: string;
  max_items: number;
  category_name?: string | null;
  category_color?: string | null;
  layout_width: string;
  layout_height: string;
  layout_grid_cols: number;
  layout_display: string;
  sort_index?: number;
  children?: SlotChild[];
}

interface ZoneRendererProps {
  slots: SlotZone[];
  onSlotClick?: (slot: SlotZone) => void;
  onChildClick?: (slot: SlotZone, child: SlotChild) => void;
}

function widthPct(w: string): number {
  const m: Record<string, number> = { full: 100, "3/4": 75, "2/3": 66.6, "1/2": 50, "1/3": 33.3, "1/4": 25 };
  return m[w] ?? 100;
}

function heightPx(h: string): number {
  const m: Record<string, number> = { hero: 140, large: 90, medium: 70, small: 38, auto: 55 };
  return m[h] ?? 55;
}

// Auto-generate children based on content_type
function getDefaultChildren(slot: SlotZone): SlotChild[] {
  if (slot.children && slot.children.length > 0) return slot.children;

  switch (slot.content_type) {
    case "articles":
      return [
        { key: "title", label: "Titolo", type: "text" },
        { key: "image", label: "Immagine", type: "image" },
        { key: "summary", label: "Sommario", type: "text" },
        { key: "category", label: "Categoria", type: "text" },
      ];
    case "events":
      return [
        { key: "title", label: "Titolo evento", type: "text" },
        { key: "date", label: "Data", type: "text" },
        { key: "location", label: "Luogo", type: "text" },
      ];
    case "breaking_news":
      return [
        { key: "text", label: "Testo ticker", type: "text" },
        { key: "link", label: "Link", type: "link" },
      ];
    case "banners":
      return [
        { key: "image", label: "Immagine banner", type: "image" },
        { key: "link", label: "Link destinazione", type: "link" },
      ];
    default:
      return [{ key: "content", label: "Contenuto", type: "html" }];
  }
}

export default function ZoneRenderer({ slots, onSlotClick, onChildClick }: ZoneRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale(s => Math.min(2, Math.max(0.3, s + delta)));
  }, []);

  // Pan with middle mouse or when holding space
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = () => { setScale(0.85); setPan({ x: 0, y: 0 }); };
  const zoomIn = () => setScale(s => Math.min(2, s + 0.15));
  const zoomOut = () => setScale(s => Math.max(0.3, s - 0.15));

  // Build rows
  const sorted = [...slots].sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  const rows: SlotZone[][] = [];
  let row: SlotZone[] = [];
  let rowPct = 0;
  for (const slot of sorted) {
    const w = widthPct(slot.layout_width);
    if (rowPct + w > 101 && row.length > 0) { rows.push(row); row = [slot]; rowPct = w; }
    else { row.push(slot); rowPct += w; }
  }
  if (row.length > 0) rows.push(row);

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl" style={{ border: "2px dashed var(--c-border)" }}>
        <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuno slot. Importa o crea manualmente.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid var(--c-border)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1.5 mr-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>
            {Math.round(scale * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center rounded-md transition"
            style={{ color: "var(--c-text-2)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg-3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center rounded-md transition"
            style={{ color: "var(--c-text-2)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg-3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} className="w-7 h-7 flex items-center justify-center rounded-md transition"
            style={{ color: "var(--c-text-2)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-bg-3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] ml-2 flex items-center gap-1" style={{ color: "var(--c-text-3)" }}>
            <Move className="w-3 h-3" /> Alt+drag
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="overflow-hidden relative"
        style={{ height: "65vh", minHeight: 400, background: "var(--c-bg-0)", cursor: isPanning ? "grabbing" : "default" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "top center",
          transition: isPanning ? "none" : "transform 0.15s ease",
          width: "700px",
          margin: "24px auto 24px",
        }}>
          {/* Page frame */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-1)" }}>
            {/* Page header mockup */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <div className="h-2 w-28 rounded-full" style={{ background: "var(--c-text-3)" }} />
              <div className="flex gap-4">
                {["Nav 1", "Nav 2", "Nav 3", "Nav 4"].map(n => (
                  <div key={n} className="h-1.5 w-10 rounded-full" style={{ background: "var(--c-border)" }} />
                ))}
              </div>
            </div>

            {/* Slots */}
            <div className="p-3 space-y-2">
              {rows.map((r, ri) => (
                <div key={ri} className="flex gap-2">
                  {r.map(slot => {
                    const isExpanded = expandedSlot === slot.id;
                    const children = getDefaultChildren(slot);
                    const h = heightPx(slot.layout_height);

                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg transition-all"
                        style={{
                          width: `${widthPct(slot.layout_width)}%`,
                          border: isExpanded ? "2px solid var(--c-accent)" : "1.5px solid var(--c-border)",
                          background: "var(--c-bg-1)",
                          borderTopColor: slot.category_color || (isExpanded ? "var(--c-accent)" : "var(--c-border)"),
                          borderTopWidth: slot.category_color ? 3 : undefined,
                        }}
                      >
                        {/* Slot header — click to expand */}
                        <div
                          className="flex items-center justify-between px-3 cursor-pointer transition-all"
                          style={{
                            minHeight: isExpanded ? 32 : h,
                            borderBottom: isExpanded ? "1px solid var(--c-border)" : "none",
                          }}
                          onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "var(--c-accent-soft)"; }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                        >
                          <span className="text-[11px] font-semibold" style={{ color: isExpanded ? "var(--c-accent)" : "var(--c-text-1)" }}>
                            {slot.label}
                          </span>
                          {!isExpanded && slot.category_name && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full"
                              style={{ background: `${slot.category_color}18`, color: slot.category_color || "var(--c-text-2)" }}>
                              {slot.category_name}
                            </span>
                          )}
                          {isExpanded && (
                            <span className="text-[9px]" style={{ color: "var(--c-text-3)" }}>{slot.slot_key}</span>
                          )}
                        </div>

                        {/* Expanded: show sub-blocks */}
                        {isExpanded && (
                          <div className="p-2 space-y-1">
                            {children.map(child => (
                              <div
                                key={child.key}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-all"
                                style={{ border: "1px dashed var(--c-border)" }}
                                onClick={(e) => { e.stopPropagation(); onChildClick?.(slot, child); onSlotClick?.(slot); }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.background = "var(--c-accent-soft)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.background = "transparent"; }}
                              >
                                <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold"
                                  style={{
                                    background: "var(--c-bg-2)",
                                    color: "var(--c-text-3)",
                                  }}>
                                  {child.type === "text" ? "T" : child.type === "image" ? "I" : child.type === "link" ? "L" : "H"}
                                </div>
                                <span className="text-[10px] font-medium" style={{ color: "var(--c-text-1)" }}>
                                  {child.label}
                                </span>
                                <span className="text-[8px] ml-auto" style={{ color: "var(--c-text-3)" }}>
                                  {child.type}
                                </span>
                              </div>
                            ))}

                            {/* Quick action to manage this slot */}
                            <button
                              className="w-full text-center py-1.5 rounded-md text-[10px] font-semibold transition-all mt-1"
                              style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
                              onClick={(e) => { e.stopPropagation(); onSlotClick?.(slot); }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--c-accent)"}
                              onMouseLeave={e => { e.currentTarget.style.background = "var(--c-accent-soft)"; e.currentTarget.style.color = "var(--c-accent)"; }}
                            >
                              Gestisci contenuti →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Page footer mockup */}
            <div className="px-4 py-3 flex gap-8" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1">
                  <div className="h-1.5 w-12 rounded-full" style={{ background: "var(--c-text-3)" }} />
                  <div className="h-1 w-16 rounded-full" style={{ background: "var(--c-border)" }} />
                  <div className="h-1 w-14 rounded-full" style={{ background: "var(--c-border)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
