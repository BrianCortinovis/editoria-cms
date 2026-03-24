"use client";

import type { Block } from "@/lib/types";

interface BuilderLayoutWireframeProps {
  blocks: Block[];
}

function resolveColumns(block: Block) {
  const widths = Array.isArray(block.props.columnWidths)
    ? (block.props.columnWidths as string[])
    : [];
  const count = Number(block.props.columnCount || widths.length || block.children.length || 2);

  return Array.from({ length: Math.max(count, 1) }).map((_, index) => ({
    width: widths[index] || `${Math.round(100 / Math.max(count, 1))}%`,
    child: block.children[index] || null,
  }));
}

function LeafPreview({ block }: { block: Block }) {
  return (
    <div
      className="rounded-lg border border-dashed px-2 py-2"
      style={{
        borderColor: "rgba(59, 130, 246, 0.55)",
        background: "rgba(59, 130, 246, 0.05)",
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--c-accent)" }}>
        {block.label || block.type}
      </div>
      <div className="mt-1 flex flex-col gap-1">
        <div className="h-2 w-2/3 rounded-full" style={{ background: "rgba(59, 130, 246, 0.22)" }} />
        <div className="h-2 w-1/2 rounded-full" style={{ background: "rgba(59, 130, 246, 0.16)" }} />
      </div>
    </div>
  );
}

function BlockNode({ block, depth = 0 }: { block: Block; depth?: number }) {
  const isColumns = block.type === "columns";
  const hasChildren = block.children.length > 0;

  return (
    <div
      className="rounded-xl border border-dashed"
      style={{
        borderColor: depth === 0 ? "rgba(37, 99, 235, 0.95)" : "rgba(59, 130, 246, 0.65)",
        background: depth === 0 ? "rgba(239, 246, 255, 0.95)" : "rgba(248, 250, 252, 0.94)",
        padding: depth === 0 ? "14px" : "10px",
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--c-accent)" }}>
          {block.label || block.type}
        </div>
        <div className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>
          {block.type}
        </div>
      </div>

      {isColumns ? (
        <div className="flex gap-3 flex-wrap md:flex-nowrap">
          {resolveColumns(block).map(({ width, child }, index) => (
            <div
              key={`${block.id}-col-${index}`}
              className="rounded-lg border border-dashed p-2 min-w-0"
              style={{
                width,
                flexBasis: width,
                borderColor: "rgba(96, 165, 250, 0.7)",
                background: "rgba(219, 234, 254, 0.42)",
              }}
            >
              <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--c-text-2)" }}>
                Colonna {index + 1}
              </div>
              {child ? <BlockNode block={child} depth={depth + 1} /> : <LeafPreview block={{ ...block, id: `${block.id}-placeholder-${index}`, label: "Zona vuota", type: "container", children: [], props: {}, style: block.style, shape: null, responsive: {}, animation: null, locked: false, hidden: false }} />}
            </div>
          ))}
        </div>
      ) : hasChildren ? (
        <div className="space-y-3">
          {block.children.map((child) => (
            <BlockNode key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      ) : (
        <LeafPreview block={block} />
      )}
    </div>
  );
}

export default function BuilderLayoutWireframe({ blocks }: BuilderLayoutWireframeProps) {
  if (blocks.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed px-6 py-10 text-center"
        style={{ borderColor: "var(--c-border)", background: "var(--c-bg-0)" }}
      >
        <div className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>
          Nessun blocco builder presente.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "2px solid var(--c-border)", background: "var(--c-bg-0)" }}
    >
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "var(--c-bg-2)", borderBottom: "1px solid var(--c-border)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--c-accent)" }}>
          Blocchi Pagina
        </div>
        <div className="text-[10px] font-mono" style={{ color: "var(--c-text-3)" }}>
          {blocks.length} blocchi top-level
        </div>
      </div>
      <div className="p-4 space-y-4">
        {blocks.map((block) => (
          <BlockNode key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
