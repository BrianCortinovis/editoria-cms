'use client';

import type { Block } from '@/lib/types/block';

export function ShapeEditor({ block }: { block: Block }) {
  return <div className="p-3 text-xs text-zinc-500">Shape editor per {block.label}</div>;
}

export function ResponsiveEditor({ block }: { block: Block }) {
  return <div className="p-3 text-xs text-zinc-500">Responsive editor per {block.label}</div>;
}

export function AnimationEditor({ block }: { block: Block }) {
  return <div className="p-3 text-xs text-zinc-500">Animation editor per {block.label}</div>;
}

export function PositionEditor({ block }: { block: Block }) {
  return <div className="p-3 text-xs text-zinc-500">Position editor per {block.label}</div>;
}

export function ToolsPanel() {
  return <div className="p-3 text-xs text-zinc-500">Strumenti avanzati</div>;
}
