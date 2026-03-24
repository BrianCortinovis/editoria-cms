'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { usePageStore } from '@/lib/stores/page-store';
import { getAllBlockDefinitions, BLOCK_CATEGORIES } from '@/lib/blocks/registry';
import { createBlock, type BlockDefinition } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { cn } from '@/lib/utils/cn';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';
import { upsertPageBackgroundMeta } from '@/lib/page-settings';

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
    if (definition.defaultDataSource) {
      block.dataSource = JSON.parse(JSON.stringify(definition.defaultDataSource));
    }
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
        isDragging && 'opacity-50 scale-95'
      )}
      style={{
        color: 'var(--c-text-0)',
        ...(!isDragging && { '--hover-bg': 'var(--c-bg-1)' } as React.CSSProperties),
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-bg-1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      title={definition.description}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--c-bg-1)' }}>
        <IconComponent size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{definition.label}</div>
        <div className="text-[10px] truncate" style={{ color: 'var(--c-text-2)' }}>{definition.description}</div>
      </div>
    </div>
  );
}

const BACKGROUND_STARTERS = [
  {
    id: 'bg-color',
    label: 'Sfondo Colore',
    description: 'Applica uno sfondo pieno alla pagina.',
    icon: 'PaintBucket',
    apply: (updatePageMeta: ReturnType<typeof usePageStore.getState>['updatePageMeta']) =>
      updatePageMeta((current) => upsertPageBackgroundMeta(current, { type: 'color', value: '#f8fafc', overlay: '' })),
  },
  {
    id: 'bg-gradient',
    label: 'Sfondo Gradiente',
    description: 'Imposta un gradiente editoriale pulito come sfondo pagina.',
    icon: 'Blend',
    apply: (updatePageMeta: ReturnType<typeof usePageStore.getState>['updatePageMeta']) =>
      updatePageMeta((current) => upsertPageBackgroundMeta(current, { type: 'gradient', value: 'linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%)', overlay: '' })),
  },
  {
    id: 'bg-image',
    label: 'Sfondo Immagine',
    description: 'Prepara la pagina per uno sfondo fotografico full-page.',
    icon: 'Image',
    apply: (updatePageMeta: ReturnType<typeof usePageStore.getState>['updatePageMeta']) =>
      updatePageMeta((current) => upsertPageBackgroundMeta(current, { type: 'image', value: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80', overlay: 'rgba(255,255,255,0.68)' })),
  },
  {
    id: 'bg-slideshow',
    label: 'Sfondo Slideshow',
    description: 'Usa più immagini in rotazione come background pagina.',
    icon: 'Images',
    apply: (updatePageMeta: ReturnType<typeof usePageStore.getState>['updatePageMeta']) =>
      updatePageMeta((current) => upsertPageBackgroundMeta(current, {
        type: 'slideshow',
        images: [
          'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80',
          'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1600&q=80',
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80',
        ],
        overlay: 'rgba(255,255,255,0.72)',
      })),
  },
  {
    id: 'bg-css',
    label: 'Sfondo CSS Custom',
    description: 'Apre uno sfondo avanzato via CSS scoped e sicuro.',
    icon: 'FileCode2',
    apply: (updatePageMeta: ReturnType<typeof usePageStore.getState>['updatePageMeta']) =>
      updatePageMeta((current) => upsertPageBackgroundMeta(current, {
        type: 'custom-css',
        customCss: ':scope { background: radial-gradient(circle at top, rgba(15,23,42,0.08), transparent 45%), linear-gradient(180deg, #ffffff 0%, #eef2ff 100%); }',
      })),
  },
] as const;

function BackgroundStarterItem({
  item,
}: {
  item: typeof BACKGROUND_STARTERS[number];
}) {
  const { updatePageMeta } = usePageStore();
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[item.icon] || Icons.Image;

  return (
    <button
      type="button"
      onClick={() => item.apply(updatePageMeta)}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full text-left transition-all"
      style={{ color: 'var(--c-text-0)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-bg-1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      title={item.description}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--c-bg-1)' }}>
        <IconComponent size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{item.label}</div>
        <div className="text-[10px] truncate" style={{ color: 'var(--c-text-2)' }}>{item.description}</div>
      </div>
    </button>
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
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-2)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca blocco..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border"
          style={{
            background: 'var(--c-bg-1)',
            borderColor: 'var(--c-border)',
            color: 'var(--c-text-0)',
          }}
        />
      </div>

      {/* Categorized list */}
      {search ? (
        <div className="space-y-0.5">
          {BACKGROUND_STARTERS.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
          ).map((item) => (
            <BackgroundStarterItem key={item.id} item={item} />
          ))}
          {filteredBlocks.map((def) => (
            <DraggableBlockItem key={def.type} definition={def} />
          ))}
          {filteredBlocks.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--c-text-2)' }}>Nessun blocco trovato</p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-1">
            <button
              onClick={() => setOpenCategory(openCategory === 'background' ? null : 'background')}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{ color: 'var(--c-text-1)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-0)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-1)')}
            >
              <Icons.Palette size={12} />
              Sfondo
              <span className="ml-auto text-[10px] font-normal">{BACKGROUND_STARTERS.length}</span>
            </button>
            {openCategory === 'background' && (
              <div className="space-y-0.5 ml-1">
                {BACKGROUND_STARTERS.map((item) => (
                  <BackgroundStarterItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
          {BLOCK_CATEGORIES.map(({ id, label, icon }) => {
          const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon] || Icons.Box;
          const categoryBlocks = filteredBlocks.filter((b) => b.category === id);
          if (categoryBlocks.length === 0) return null;

          const isOpen = openCategory === id;

          return (
            <div key={id} className="mb-1">
              <button
                onClick={() => setOpenCategory(isOpen ? null : id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{ color: 'var(--c-text-1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text-0)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-text-1)')}
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
        })}
        </>
      )}
    </div>
  );
}
