"use client";

import Link from "next/link";
import { FileText, Calendar, Zap, Megaphone, Image as ImageIcon } from "lucide-react";

interface SlotZone {
  id: string;
  slot_key: string;
  label: string;
  content_type: string;
  max_items: number;
  category_name?: string | null;
  category_color?: string | null;
  layout_tag: string;
  layout_display: string;
  layout_width: string;
  layout_height: string;
  layout_grid_cols: number;
}

interface ZoneRendererProps {
  slots: SlotZone[];
  onSlotClick?: (slot: SlotZone) => void;
}

const contentIcons: Record<string, typeof FileText> = {
  articles: FileText,
  events: Calendar,
  breaking_news: Zap,
  banners: Megaphone,
  media: ImageIcon,
};

const widthToPercent: Record<string, number> = {
  full: 100, "1/2": 50, "1/3": 33.33, "2/3": 66.66, "1/4": 25, "3/4": 75,
};

const heightToPixels: Record<string, number> = {
  hero: 180, large: 140, medium: 100, small: 50, auto: 80,
};

export default function ZoneRenderer({ slots, onSlotClick }: ZoneRendererProps) {
  if (slots.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 rounded-xl" style={{ border: "2px dashed var(--c-border)" }}>
        <p className="text-sm" style={{ color: "var(--c-text-3)" }}>
          Nessuno slot rilevato. Importa il sito o crea slot manualmente.
        </p>
      </div>
    );
  }

  // Group slots into rows based on width
  const rows: SlotZone[][] = [];
  let currentRow: SlotZone[] = [];
  let currentRowWidth = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = [...slots].sort((a, b) => ((a as any).sort_index ?? 0) - ((b as any).sort_index ?? 0));

  for (const slot of sorted) {
    const w = widthToPercent[slot.layout_width] ?? 100;
    if (currentRowWidth + w > 100 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [slot];
      currentRowWidth = w;
    } else {
      currentRow.push(slot);
      currentRowWidth += w;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div className="space-y-2">
      {/* Page frame */}
      <div className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--c-border)", background: "var(--c-bg-0)" }}>
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
          </div>
          <div className="flex-1 rounded-md px-3 py-0.5 text-[10px] font-mono text-center" style={{ background: "var(--c-bg-3)", color: "var(--c-text-3)" }}>
            homepage
          </div>
        </div>

        {/* Page content */}
        <div className="p-3 space-y-2">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-2" style={{ minHeight: 40 }}>
              {row.map(slot => {
                const Icon = contentIcons[slot.content_type] || FileText;
                const w = widthToPercent[slot.layout_width] ?? 100;
                const h = heightToPixels[slot.layout_height] ?? 80;
                const isGrid = slot.layout_display === "grid" && slot.layout_grid_cols > 1;

                return (
                  <div
                    key={slot.id}
                    className="rounded-lg cursor-pointer transition-all group relative overflow-hidden"
                    style={{
                      width: `${w}%`,
                      minHeight: h,
                      background: "var(--c-bg-1)",
                      border: "1px solid var(--c-border)",
                    }}
                    onClick={() => onSlotClick?.(slot)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.boxShadow = "0 0 0 1px var(--c-accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* Category color bar */}
                    {slot.category_color && (
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: slot.category_color }} />
                    )}

                    {/* Slot content */}
                    <div className="p-2.5 h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="w-3 h-3 shrink-0" style={{ color: "var(--c-accent)" }} />
                        <span className="text-[10px] font-semibold truncate" style={{ color: "var(--c-text-0)" }}>
                          {slot.label}
                        </span>
                        <span className="text-[8px] font-mono ml-auto shrink-0" style={{ color: "var(--c-text-3)" }}>
                          {slot.layout_width}
                        </span>
                      </div>

                      {/* Grid preview */}
                      {isGrid ? (
                        <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${slot.layout_grid_cols}, 1fr)` }}>
                          {Array.from({ length: Math.min(slot.max_items, slot.layout_grid_cols * 2) }).map((_, i) => (
                            <div key={i} className="rounded" style={{ background: "var(--c-bg-2)", minHeight: 20 }} />
                          ))}
                        </div>
                      ) : slot.layout_height === "hero" ? (
                        <div className="flex-1 rounded flex items-center justify-center" style={{ background: "var(--c-bg-2)" }}>
                          <div className="text-center">
                            <div className="w-12 h-1.5 rounded-full mx-auto mb-1" style={{ background: "var(--c-text-3)" }} />
                            <div className="w-20 h-1 rounded-full mx-auto" style={{ background: "var(--c-border)" }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-1">
                          {Array.from({ length: Math.min(slot.max_items, 4) }).map((_, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div className="w-6 h-4 rounded shrink-0" style={{ background: "var(--c-bg-2)" }} />
                              <div className="flex-1">
                                <div className="h-1 rounded-full mb-0.5" style={{ background: "var(--c-text-3)", width: `${70 - i * 10}%` }} />
                                <div className="h-0.5 rounded-full" style={{ background: "var(--c-border)", width: `${50 - i * 5}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer info */}
                      <div className="flex items-center justify-between mt-1.5 pt-1" style={{ borderTop: "1px solid var(--c-border)" }}>
                        <span className="text-[8px]" style={{ color: "var(--c-text-3)" }}>
                          {slot.content_type} · {slot.max_items} items
                        </span>
                        {slot.category_name && (
                          <span className="text-[8px] px-1 rounded" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                            {slot.category_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      style={{ background: "color-mix(in srgb, var(--c-accent) 10%, transparent)" }}>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md" style={{ background: "var(--c-accent)", color: "#fff" }}>
                        Gestisci
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
