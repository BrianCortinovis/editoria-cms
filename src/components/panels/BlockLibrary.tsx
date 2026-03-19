'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { usePageStore } from '@/lib/stores/page-store';
import { getAllBlockDefinitions, BLOCK_CATEGORIES, getBlockDefinition } from '@/lib/blocks/registry';
import { createBlock, createDefaultStyle, type BlockDefinition, type BlockType } from '@/lib/types/block';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils/cn';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';

// Import block definitions to register them
import '@/lib/blocks/init';

function DraggableBlockItem({ definition }: { definition: BlockDefinition }) {
  const { addBlock } = usePageStore();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${definition.type}`,
    data: { type: 'library-block', blockType: definition.type, definition },
  });

  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[definition.icon] || Icons.Box;

  const handleClick = () => {
    const block = createBlock(
      definition.type,
      definition.label,
      definition.defaultProps,
      definition.defaultStyle
    );
    block.id = generateId();
    addBlock(block);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all',
        'hover:bg-zinc-100 dark:hover:bg-zinc-800',
        'text-zinc-700 dark:text-zinc-300',
        isDragging && 'opacity-50 scale-95'
      )}
      title={definition.description}
    >
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <IconComponent size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{definition.label}</div>
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{definition.description}</div>
      </div>
    </div>
  );
}

export function BlockLibrary() {
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('layout');

  const allBlocks = useMemo(() => getAllBlockDefinitions(), []);

  const filteredBlocks = useMemo(() => {
    if (!search) return allBlocks;
    const q = search.toLowerCase();
    return allBlocks.filter(
      (b) => b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    );
  }, [allBlocks, search]);

  return (
    <div className="p-2">
      {/* Search */}
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca blocco..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Categorized list */}
      {search ? (
        <div className="space-y-0.5">
          {filteredBlocks.map((def) => (
            <DraggableBlockItem key={def.type} definition={def} />
          ))}
          {filteredBlocks.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-4">Nessun blocco trovato</p>
          )}
        </div>
      ) : (
        BLOCK_CATEGORIES.map(({ id, label, icon }) => {
          const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon] || Icons.Box;
          const categoryBlocks = filteredBlocks.filter((b) => b.category === id);
          if (categoryBlocks.length === 0) return null;

          const isOpen = openCategory === id;

          return (
            <div key={id} className="mb-1">
              <button
                onClick={() => setOpenCategory(isOpen ? null : id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 uppercase tracking-wider"
              >
                <IconComponent size={12} />
                {label}
                <span className="ml-auto text-[10px] font-normal">{categoryBlocks.length}</span>
              </button>
              {isOpen && (
                <div className="space-y-0.5 ml-1">
                  {categoryBlocks.map((def) => (
                    <DraggableBlockItem key={def.type} definition={def} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
