"use client";

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

function widthPct(w: string): number {
  const map: Record<string, number> = { full: 100, "3/4": 75, "2/3": 66.6, "1/2": 50, "1/3": 33.3, "1/4": 25 };
  return map[w] ?? 100;
}

function heightPx(h: string): number {
  const map: Record<string, number> = { hero: 120, large: 80, medium: 64, small: 36, auto: 52 };
  return map[h] ?? 52;
}

export default function ZoneRenderer({ slots, onSlotClick }: ZoneRendererProps) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl"
        style={{ border: "2px dashed var(--c-border)" }}>
        <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuno slot. Importa o crea manualmente.</p>
      </div>
    );
  }

  // Build rows
  const sorted = [...slots].sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  const rows: SlotZone[][] = [];
  let row: SlotZone[] = [];
  let rowPct = 0;

  for (const slot of sorted) {
    const w = widthPct(slot.layout_width);
    if (rowPct + w > 101 && row.length > 0) {
      rows.push(row);
      row = [slot];
      rowPct = w;
    } else {
      row.push(slot);
      rowPct += w;
    }
  }
  if (row.length > 0) rows.push(row);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid var(--c-border)" }}>
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <div className="flex-1 mx-6 rounded-md px-3 py-0.5 text-[10px] font-mono text-center"
          style={{ background: "var(--c-bg-3)", color: "var(--c-text-3)" }}>
          www.testata.it
        </div>
      </div>

      {/* Layout */}
      <div className="p-3 space-y-2" style={{ background: "var(--c-bg-0)" }}>
        {rows.map((r, ri) => (
          <div key={ri} className="flex gap-2">
            {r.map(slot => (
              <div
                key={slot.id}
                onClick={() => onSlotClick?.(slot)}
                className="rounded-lg cursor-pointer transition-all flex items-center justify-center text-center px-3"
                style={{
                  width: `${widthPct(slot.layout_width)}%`,
                  minHeight: heightPx(slot.layout_height),
                  border: "1.5px solid var(--c-border)",
                  background: "var(--c-bg-1)",
                  borderTopColor: slot.category_color || "var(--c-border)",
                  borderTopWidth: slot.category_color ? 3 : 1.5,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--c-accent)";
                  e.currentTarget.style.background = "var(--c-accent-soft)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--c-border)";
                  e.currentTarget.style.background = "var(--c-bg-1)";
                  if (slot.category_color) e.currentTarget.style.borderTopColor = slot.category_color;
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: "var(--c-text-1)" }}>
                  {slot.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
