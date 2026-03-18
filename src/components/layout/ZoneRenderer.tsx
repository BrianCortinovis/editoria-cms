"use client";

import { FileText, Calendar, Zap, Megaphone, Image as ImageIcon, MousePointer } from "lucide-react";

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
}

interface ZoneRendererProps {
  slots: SlotZone[];
  onSlotClick?: (slot: SlotZone) => void;
}

const contentIcons: Record<string, typeof FileText> = {
  articles: FileText, events: Calendar, breaking_news: Zap, banners: Megaphone, media: ImageIcon,
};

// Convert slot width to flex percentage
function widthToFlex(w: string): string {
  const map: Record<string, string> = {
    full: "100%", "3/4": "74.5%", "2/3": "66%", "1/2": "49.5%", "1/3": "33%", "1/4": "24.5%",
  };
  return map[w] || "100%";
}

// Convert height hint to px
function heightToPx(h: string): number {
  const map: Record<string, number> = { hero: 200, large: 150, medium: 110, small: 55, auto: 90 };
  return map[h] || 90;
}

export default function ZoneRenderer({ slots, onSlotClick }: ZoneRendererProps) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-xl"
        style={{ border: "2px dashed var(--c-border)" }}>
        <MousePointer className="w-8 h-8 mb-3" style={{ color: "var(--c-text-3)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>Nessuno slot configurato</p>
        <p className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>Importa il sito o crea slot manualmente</p>
      </div>
    );
  }

  // Build rows: accumulate slots into rows based on total width
  const sorted = [...slots].sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  const rows: SlotZone[][] = [];
  let currentRow: SlotZone[] = [];
  let currentPct = 0;

  const pctMap: Record<string, number> = {
    full: 100, "3/4": 75, "2/3": 66.6, "1/2": 50, "1/3": 33.3, "1/4": 25,
  };

  for (const slot of sorted) {
    const w = pctMap[slot.layout_width] ?? 100;
    if (currentPct + w > 101 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [slot];
      currentPct = w;
    } else {
      currentRow.push(slot);
      currentPct += w;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid var(--c-border)", background: "var(--c-bg-0)" }}>
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#eab308" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="flex-1 mx-8 rounded-lg px-4 py-1 text-[11px] font-mono text-center"
          style={{ background: "var(--c-bg-3)", color: "var(--c-text-3)" }}>
          www.testata.it
        </div>
      </div>

      {/* Page layout */}
      <div className="p-4" style={{ background: "var(--c-bg-0)" }}>
        <div className="space-y-3">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-3" style={{ alignItems: "stretch" }}>
              {row.map(slot => (
                <SlotBlock key={slot.id} slot={slot} onClick={() => onSlotClick?.(slot)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotBlock({ slot, onClick }: { slot: SlotZone; onClick: () => void }) {
  const Icon = contentIcons[slot.content_type] || FileText;
  const w = widthToFlex(slot.layout_width);
  const h = heightToPx(slot.layout_height);
  const isGrid = slot.layout_grid_cols > 1;
  const isHero = slot.layout_height === "hero";

  return (
    <div
      className="rounded-xl cursor-pointer transition-all relative overflow-hidden group"
      style={{
        width: w,
        minHeight: h,
        background: "var(--c-bg-1)",
        border: "1.5px solid var(--c-border)",
        flexShrink: 0,
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--c-accent)";
        e.currentTarget.style.transform = "scale(1.01)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--c-border)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Top color bar for category */}
      {slot.category_color && (
        <div className="h-1.5 w-full" style={{ background: slot.category_color }} />
      )}

      <div className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "var(--c-accent-soft)" }}>
            <Icon className="w-3 h-3" style={{ color: "var(--c-accent)" }} />
          </div>
          <span className="text-[11px] font-bold truncate" style={{ color: "var(--c-text-0)" }}>
            {slot.label}
          </span>
        </div>

        {/* Content preview area */}
        <div className="flex-1 min-h-0">
          {isHero ? (
            /* Hero: big image placeholder with text overlay */
            <div className="w-full h-full rounded-lg flex flex-col items-center justify-center relative"
              style={{ background: "var(--c-bg-2)", minHeight: 100 }}>
              <div className="absolute inset-0 rounded-lg" style={{
                background: "linear-gradient(135deg, var(--c-bg-2) 0%, var(--c-bg-3) 100%)"
              }} />
              <div className="relative text-center px-4">
                <div className="w-24 h-2 rounded-full mx-auto mb-2" style={{ background: "var(--c-text-3)" }} />
                <div className="w-32 h-1.5 rounded-full mx-auto mb-1" style={{ background: "var(--c-border)" }} />
                <div className="w-20 h-1 rounded-full mx-auto" style={{ background: "var(--c-border)" }} />
              </div>
            </div>
          ) : isGrid ? (
            /* Grid: cards in columns */
            <div className="grid gap-2 h-full"
              style={{ gridTemplateColumns: `repeat(${Math.min(slot.layout_grid_cols, 4)}, 1fr)` }}>
              {Array.from({ length: Math.min(slot.max_items, slot.layout_grid_cols * 2) }).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-2)" }}>
                  <div className="w-full" style={{ height: 28, background: "var(--c-bg-3)" }} />
                  <div className="p-1.5">
                    <div className="h-1 rounded-full mb-1" style={{ background: "var(--c-text-3)", width: "80%" }} />
                    <div className="h-0.5 rounded-full" style={{ background: "var(--c-border)", width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : slot.content_type === "banners" ? (
            /* Banner: horizontal ad placeholder */
            <div className="w-full h-full rounded-lg flex items-center justify-center"
              style={{ background: "var(--c-bg-2)", border: "1px dashed var(--c-border)", minHeight: 40 }}>
              <span className="text-[9px] font-medium" style={{ color: "var(--c-text-3)" }}>AD</span>
            </div>
          ) : slot.content_type === "breaking_news" ? (
            /* Breaking: ticker bar */
            <div className="w-full rounded-lg px-3 py-2 flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.08)", minHeight: 30 }}>
              <Zap className="w-3 h-3 text-red-400 shrink-0" />
              <div className="flex-1">
                <div className="h-1 rounded-full" style={{ background: "var(--c-text-3)", width: "70%" }} />
              </div>
            </div>
          ) : (
            /* Default: article list */
            <div className="space-y-2">
              {Array.from({ length: Math.min(slot.max_items, 4) }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-10 h-7 rounded shrink-0" style={{ background: "var(--c-bg-2)" }} />
                  <div className="flex-1 pt-0.5">
                    <div className="h-1.5 rounded-full mb-1" style={{ background: "var(--c-text-3)", width: `${85 - i * 12}%` }} />
                    <div className="h-1 rounded-full" style={{ background: "var(--c-border)", width: `${65 - i * 8}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--c-border)" }}>
          <span className="text-[9px] font-mono" style={{ color: "var(--c-text-3)" }}>
            {slot.slot_key}
          </span>
          <div className="flex items-center gap-1.5">
            {slot.category_name && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full"
                style={{ background: slot.category_color ? `${slot.category_color}20` : "var(--c-bg-2)", color: slot.category_color || "var(--c-text-2)" }}>
                {slot.category_name}
              </span>
            )}
            <span className="text-[8px]" style={{ color: "var(--c-text-3)" }}>
              {slot.max_items}x
            </span>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl"
        style={{ background: "color-mix(in srgb, var(--c-bg-0) 70%, transparent)", backdropFilter: "blur(2px)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5"
            style={{ background: "var(--c-accent)" }}>
            <MousePointer className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--c-text-0)" }}>
            Gestisci
          </span>
        </div>
      </div>
    </div>
  );
}
