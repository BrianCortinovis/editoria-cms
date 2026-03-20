'use client';

import { usePageStore } from '@/lib/stores/page-store';
import type { Block } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import {
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, GripVertical
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { getBlockDefinition } from '@/lib/blocks/registry';
import '@/lib/blocks/init';
import { useState } from 'react';

function LayerItem({ block, depth = 0 }: { block: Block; depth?: number }) {
  const { selectedBlockId, selectBlock, updateBlock, hoveredBlockId, hoverBlock } = usePageStore();
  const [expanded, setExpanded] = useState(true);

  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id;
  const hasChildren = block.children.length > 0;

  const definition = getBlockDefinition(block.type);
  const IconComponent = definition?.icon
    ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[definition.icon] || Icons.Box
    : Icons.Box;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors rounded-md mx-1',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          isSelected && 'bg-blue-50 dark:bg-blue-950 text-blue-600',
          isHovered && !isSelected && 'bg-zinc-50 dark:bg-zinc-850',
          block.hidden && 'opacity-40'
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => selectBlock(block.id)}
        onMouseEnter={() => hoverBlock(block.id)}
        onMouseLeave={() => hoverBlock(null)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 shrink-0"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <IconComponent size={12} />
        <span className="text-xs truncate flex-1">{block.label || block.type}</span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { hidden: !block.hidden }); }}
            className="p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            {block.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { locked: !block.locked }); }}
            className="p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            {block.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {block.children.map((child) => (
            <LayerItem key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LayerTree() {
  const { blocks } = usePageStore();

  return (
    <div className="py-2">
      {blocks.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-8">
          Nessun blocco nella pagina
        </p>
      ) : (
        blocks.map((block) => (
          <LayerItem key={block.id} block={block} />
        ))
      )}
    </div>
  );
}
