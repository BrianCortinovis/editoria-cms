'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Block, BlockStyle, BlockShape } from '@/lib/types/block';
import { generateId } from '@/lib/utils/id';

interface PageState {
  // Current page context
  pageId: string | null;
  tenantId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  blocks: Block[];
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  editingBlockId: string | null;

  // History for undo/redo
  history: Block[][];
  historyIndex: number;

  // Context
  setContext: (pageId: string, tenantId: string) => void;

  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, parentId?: string | null, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateBlockStyle: (id: string, style: Partial<BlockStyle>) => void;
  updateBlockResponsive: (id: string, device: 'tablet' | 'mobile', style: Partial<BlockStyle>) => void;
  updateBlockShape: (id: string, shape: BlockShape | null) => void;
  moveBlock: (id: string, newParentId: string | null, newIndex: number) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;
  setEditingBlock: (id: string | null) => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Helpers
  getBlock: (id: string) => Block | null;
  getSelectedBlock: () => Block | null;
}

function findBlock(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    const found = findBlock(block.children, id);
    if (found) return found;
  }
  return null;
}

function removeBlockFromTree(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => ({
      ...b,
      children: removeBlockFromTree(b.children, id),
    }));
}

function updateBlockInTree(blocks: Block[], id: string, updater: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    if (b.id === id) return updater(b);
    return { ...b, children: updateBlockInTree(b.children, id, updater) };
  });
}

function deepCloneBlock(block: Block): Block {
  return {
    ...block,
    id: generateId(),
    children: block.children.map(deepCloneBlock),
  };
}

function pushHistory(state: PageState): Partial<PageState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state.blocks)));
  if (newHistory.length > 100) newHistory.shift();
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

export const usePageStore = create<PageState>()((set, get) => ({
  pageId: null,
  tenantId: null,
  isDirty: false,
  isSaving: false,
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  editingBlockId: null,
  history: [[]],
  historyIndex: 0,

  setContext: (pageId, tenantId) => set({ pageId, tenantId }),

  setBlocks: (blocks) =>
    set((state) => ({
      blocks,
      ...pushHistory({ ...state, blocks }),
      isDirty: false,
    })),

  addBlock: (block, parentId = null, index) =>
    set((state) => {
      const newBlock = { ...block, id: block.id || generateId() };
      let newBlocks: Block[];

      if (parentId) {
        newBlocks = produce(state.blocks, (draft) => {
          const parent = findBlock(draft, parentId);
          if (parent) {
            if (index !== undefined) {
              parent.children.splice(index, 0, newBlock);
            } else {
              parent.children.push(newBlock);
            }
          }
        });
      } else {
        newBlocks = [...state.blocks];
        if (index !== undefined) {
          newBlocks.splice(index, 0, newBlock);
        } else {
          newBlocks.push(newBlock);
        }
      }

      return {
        blocks: newBlocks,
        selectedBlockId: newBlock.id,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  removeBlock: (id) =>
    set((state) => {
      const newBlocks = removeBlockFromTree(state.blocks, id);
      return {
        blocks: newBlocks,
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        editingBlockId: state.editingBlockId === id ? null : state.editingBlockId,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlock: (id, updates) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({ ...b, ...updates }));
      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlockProps: (id, props) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({
        ...b,
        props: { ...b.props, ...props },
      }));
      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlockStyle: (id, style) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({
        ...b,
        style: {
          layout: { ...b.style.layout, ...style.layout },
          background: { ...b.style.background, ...style.background },
          typography: { ...b.style.typography, ...style.typography },
          border: { ...b.style.border, ...style.border },
          shadow: style.shadow ?? b.style.shadow,
          opacity: style.opacity ?? b.style.opacity,
          transform: style.transform ?? b.style.transform,
          transition: style.transition ?? b.style.transition,
          customCss: style.customCss ?? b.style.customCss,
        },
      }));
      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlockResponsive: (id, device, style) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({
        ...b,
        responsive: {
          ...b.responsive,
          [device]: {
            ...((b.responsive?.[device] as Partial<BlockStyle>) || {}),
            layout: { ...((b.responsive?.[device] as Partial<BlockStyle>)?.layout || {}), ...(style.layout || {}) },
            background: { ...((b.responsive?.[device] as Partial<BlockStyle>)?.background || {}), ...(style.background || {}) },
            typography: { ...((b.responsive?.[device] as Partial<BlockStyle>)?.typography || {}), ...(style.typography || {}) },
            border: { ...((b.responsive?.[device] as Partial<BlockStyle>)?.border || {}), ...(style.border || {}) },
          },
        },
      }));
      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlockShape: (id, shape) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({ ...b, shape }));
      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  moveBlock: (id, newParentId, newIndex) =>
    set((state) => {
      const block = findBlock(state.blocks, id);
      if (!block) return state;

      let newBlocks = removeBlockFromTree(state.blocks, id);

      if (newParentId) {
        newBlocks = produce(newBlocks, (draft) => {
          const parent = findBlock(draft, newParentId);
          if (parent) {
            parent.children.splice(newIndex, 0, block);
          }
        });
      } else {
        newBlocks.splice(newIndex, 0, block);
      }

      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  duplicateBlock: (id) =>
    set((state) => {
      const block = findBlock(state.blocks, id);
      if (!block) return state;

      const clone = deepCloneBlock(block);

      const insertAfter = (blocks: Block[]): Block[] => {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx !== -1) {
          const result = [...blocks];
          result.splice(idx + 1, 0, clone);
          return result;
        }
        return blocks.map((b) => ({
          ...b,
          children: insertAfter(b.children),
        }));
      };

      const newBlocks = insertAfter(state.blocks);
      return {
        blocks: newBlocks,
        selectedBlockId: clone.id,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),
  hoverBlock: (id) => set({ hoveredBlockId: id }),
  setEditingBlock: (id) => set({ editingBlockId: id }),
  markSaved: () => set({ isDirty: false }),
  setSaving: (isSaving) => set({ isSaving }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        blocks: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        blocks: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        isDirty: true,
      };
    }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  getBlock: (id) => findBlock(get().blocks, id),
  getSelectedBlock: () => {
    const { selectedBlockId, blocks } = get();
    if (!selectedBlockId) return null;
    return findBlock(blocks, selectedBlockId);
  },
}));
