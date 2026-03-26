'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import type { Block, BlockStyle, BlockShape } from '@/lib/types';
import { generateId } from '@/lib/utils/id';

interface PageState {
  blocks: Block[];
  pageMeta: Record<string, unknown>;
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  hoveredBlockId: string | null;
  editingBlockId: string | null;

  // History for undo/redo
  history: Array<{ blocks: Block[]; pageMeta: Record<string, unknown> }>;
  historyIndex: number;

  // Actions
  setBlocks: (blocks: Block[]) => void;
  setPageMeta: (meta: Record<string, unknown>) => void;
  updatePageMeta: (updater: (meta: Record<string, unknown>) => Record<string, unknown>) => void;
  loadPage: (blocks: Block[], meta?: Record<string, unknown>) => void;
  replacePage: (blocks: Block[], meta?: Record<string, unknown>) => void;
  addBlock: (block: Block, parentId?: string | null, index?: number) => void;
  removeBlock: (id: string) => void;
  removeBlocks: (ids: string[]) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateBlockStyle: (id: string, style: Partial<BlockStyle>) => void;
  updateBlockShape: (id: string, shape: BlockShape | null) => void;
  moveBlock: (id: string, newParentId: string | null, newIndex: number) => void;
  moveBlockRelative: (id: string, offset: number) => void;
  swapBlockWithSibling: (id: string, offset: number) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  toggleBlockSelection: (id: string) => void;
  selectBlocks: (ids: string[], primaryId?: string | null) => void;
  selectAllBlocks: () => void;
  clearSelection: () => void;
  hoverBlock: (id: string | null) => void;
  setEditingBlock: (id: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Helpers
  getBlock: (id: string) => Block | null;
  getSelectedBlock: () => Block | null;
  getBlockLocation: (id: string) => { parentId: string | null; index: number; siblingsCount: number } | null;
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

function findBlockLocation(
  blocks: Block[],
  id: string,
  parentId: string | null = null
): { parentId: string | null; index: number; siblingsCount: number } | null {
  const index = blocks.findIndex((block) => block.id === id);
  if (index !== -1) {
    return { parentId, index, siblingsCount: blocks.length };
  }

  for (const block of blocks) {
    const found = findBlockLocation(block.children, id, block.id);
    if (found) return found;
  }

  return null;
}

function deepCloneBlock(block: Block): Block {
  return {
    ...block,
    id: generateId(),
    children: block.children.map(deepCloneBlock),
  };
}

function flattenBlockIds(blocks: Block[]): string[] {
  return blocks.flatMap((block) => [block.id, ...flattenBlockIds(block.children)]);
}

function cloneHistoryEntry(blocks: Block[], pageMeta: Record<string, unknown>) {
  return {
    blocks: JSON.parse(JSON.stringify(blocks)),
    pageMeta: JSON.parse(JSON.stringify(pageMeta ?? {})),
  };
}

let historyCommitTimer: ReturnType<typeof setTimeout> | null = null;

function clearScheduledHistoryCommit() {
  if (historyCommitTimer) {
    clearTimeout(historyCommitTimer);
    historyCommitTimer = null;
  }
}

function pushHistory(state: PageState): Partial<PageState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(cloneHistoryEntry(state.blocks, state.pageMeta));
  if (newHistory.length > 100) newHistory.shift();
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function scheduleHistoryCommit(
  set: (partial: Partial<PageState> | ((state: PageState) => Partial<PageState> | PageState)) => void
) {
  clearScheduledHistoryCommit();
  historyCommitTimer = setTimeout(() => {
    set((state) => pushHistory(state) as Partial<PageState>);
    historyCommitTimer = null;
  }, 220);
}

// Auto-save key prefix
const AUTOSAVE_KEY = 'sitebuilder-autosave';

function getAutosaveKey(projectId?: string, pageId?: string) {
  return `${AUTOSAVE_KEY}-${projectId || 'default'}-${pageId || 'home'}`;
}

// Save blocks to localStorage with timestamp
function autosaveBlocks(blocks: Block[], projectId?: string, pageId?: string) {
  try {
    const key = getAutosaveKey(projectId, pageId);
    const data = {
      blocks,
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded or SSR */ }
}

// Load autosaved blocks
export function loadAutosave(projectId?: string, pageId?: string): { blocks: Block[]; timestamp: number } | null {
  try {
    const key = getAutosaveKey(projectId, pageId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.blocks) && data.blocks.length > 0) {
      return { blocks: data.blocks, timestamp: data.timestamp || 0 };
    }
    return null;
  } catch { return null; }
}

// Clear autosave (after successful server save)
export function clearAutosave(projectId?: string, pageId?: string) {
  try {
    const key = getAutosaveKey(projectId, pageId);
    localStorage.removeItem(key);
  } catch { /* SSR */ }
}

// Current project/page context for autosave
let _autosaveProjectId: string | undefined;
let _autosavePageId: string | undefined;

export function setAutosaveContext(projectId: string, pageId: string) {
  _autosaveProjectId = projectId;
  _autosavePageId = pageId;
}

export const usePageStore = create<PageState>()((set, get) => ({
  blocks: [],
  pageMeta: {},
  selectedBlockId: null,
  selectedBlockIds: [],
  hoveredBlockId: null,
  editingBlockId: null,
  history: [cloneHistoryEntry([], {})],
  historyIndex: 0,

  setBlocks: (blocks) =>
    set((state) => ({
      blocks,
      selectedBlockIds: [],
      ...pushHistory({ ...state, blocks }),
    })),

  setPageMeta: (pageMeta) =>
    set((state) => ({
      pageMeta,
      selectedBlockIds: state.selectedBlockIds,
      ...pushHistory({ ...state, pageMeta }),
    })),

  updatePageMeta: (updater) =>
    set((state) => {
      const nextMeta = updater(state.pageMeta);
      return {
        pageMeta: nextMeta,
        selectedBlockIds: state.selectedBlockIds,
        ...pushHistory({ ...state, pageMeta: nextMeta }),
      };
    }),

  loadPage: (blocks, pageMeta = {}) =>
    set(() => {
      clearScheduledHistoryCommit();
      return ({
      blocks,
      pageMeta,
      selectedBlockId: null,
      selectedBlockIds: [],
      hoveredBlockId: null,
      editingBlockId: null,
      history: [cloneHistoryEntry(blocks, pageMeta)],
      historyIndex: 0,
      });
    }),

  replacePage: (blocks, pageMeta = {}) =>
    set((state) => {
      clearScheduledHistoryCommit();
      return ({
      blocks,
      pageMeta,
      selectedBlockId: null,
      selectedBlockIds: [],
      hoveredBlockId: null,
      editingBlockId: null,
      ...pushHistory({ ...state, blocks, pageMeta }),
      });
    }),

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
        selectedBlockIds: [newBlock.id],
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  removeBlock: (id) =>
    set((state) => {
      const newBlocks = removeBlockFromTree(state.blocks, id);
      return {
        blocks: newBlocks,
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        selectedBlockIds: state.selectedBlockIds.filter((selectedId) => selectedId !== id),
        editingBlockId: state.editingBlockId === id ? null : state.editingBlockId,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  removeBlocks: (ids) =>
    set((state) => {
      let newBlocks = state.blocks;
      // Remove all blocks in a single pass to avoid state sync issues
      ids.forEach((id) => {
        newBlocks = removeBlockFromTree(newBlocks, id);
      });
      return {
        blocks: newBlocks,
        selectedBlockId: ids.includes(state.selectedBlockId || '') ? null : state.selectedBlockId,
        selectedBlockIds: state.selectedBlockIds.filter((selectedId) => !ids.includes(selectedId)),
        editingBlockId: ids.includes(state.editingBlockId || '') ? null : state.editingBlockId,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  updateBlock: (id, updates) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({ ...b, ...updates }));
      const nextState = {
        blocks: newBlocks,
      };
      queueMicrotask(() => scheduleHistoryCommit(set));
      return nextState;
    }),

  updateBlockProps: (id, props) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({
        ...b,
        props: { ...b.props, ...props },
      }));
      const nextState = {
        blocks: newBlocks,
      };
      queueMicrotask(() => scheduleHistoryCommit(set));
      return nextState;
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
          filter: style.filter ?? b.style.filter,
          backdropFilter: style.backdropFilter ?? b.style.backdropFilter,
          mixBlendMode: style.mixBlendMode ?? b.style.mixBlendMode,
          textShadow: style.textShadow ?? b.style.textShadow,
          effects: style.effects ?? b.style.effects,
        },
      }));
      const nextState = {
        blocks: newBlocks,
      };
      queueMicrotask(() => scheduleHistoryCommit(set));
      return nextState;
    }),

  updateBlockShape: (id, shape) =>
    set((state) => {
      const newBlocks = updateBlockInTree(state.blocks, id, (b) => ({ ...b, shape }));
      const nextState = {
        blocks: newBlocks,
      };
      queueMicrotask(() => scheduleHistoryCommit(set));
      return nextState;
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

  moveBlockRelative: (id, offset) =>
    set((state) => {
      const location = findBlockLocation(state.blocks, id);
      if (!location) return state;

      const targetIndex = Math.max(0, Math.min(location.siblingsCount - 1, location.index + offset));
      if (targetIndex === location.index) return state;

      const block = findBlock(state.blocks, id);
      if (!block) return state;

      let newBlocks = removeBlockFromTree(state.blocks, id);

      if (location.parentId) {
        newBlocks = produce(newBlocks, (draft) => {
          const parent = findBlock(draft, location.parentId!);
          if (parent) {
            parent.children.splice(targetIndex, 0, block);
          }
        });
      } else {
        newBlocks.splice(targetIndex, 0, block);
      }

      return {
        blocks: newBlocks,
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  swapBlockWithSibling: (id, offset) =>
    set((state) => {
      const location = findBlockLocation(state.blocks, id);
      if (!location) return state;

      const targetIndex = location.index + offset;
      if (targetIndex < 0 || targetIndex >= location.siblingsCount) return state;

      const swapInList = (list: Block[]) => {
        const next = [...list];
        [next[location.index], next[targetIndex]] = [next[targetIndex], next[location.index]];
        return next;
      };

      const newBlocks = location.parentId
        ? produce(state.blocks, (draft) => {
            const parent = findBlock(draft, location.parentId!);
            if (parent) {
              parent.children = swapInList(parent.children);
            }
          })
        : swapInList(state.blocks);

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

      // Find parent and index
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
        selectedBlockIds: [clone.id],
        ...pushHistory({ ...state, blocks: newBlocks }),
      };
    }),

  selectBlock: (id) => set({ selectedBlockId: id, selectedBlockIds: id ? [id] : [] }),
  toggleBlockSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedBlockIds.includes(id);
      if (isSelected) {
        const remaining = state.selectedBlockIds.filter((selectedId) => selectedId !== id);
        return {
          selectedBlockIds: remaining,
          selectedBlockId: state.selectedBlockId === id ? (remaining[remaining.length - 1] ?? null) : state.selectedBlockId,
        };
      }

      return {
        selectedBlockIds: [...state.selectedBlockIds, id],
        selectedBlockId: id,
      };
    }),
  selectBlocks: (ids, primaryId = null) =>
    set(() => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];
      return {
        selectedBlockIds: uniqueIds,
        selectedBlockId: primaryId && uniqueIds.includes(primaryId) ? primaryId : (uniqueIds[uniqueIds.length - 1] ?? null),
      };
    }),
  selectAllBlocks: () =>
    set((state) => {
      const ids = flattenBlockIds(state.blocks);
      return {
        selectedBlockIds: ids,
        selectedBlockId: ids[0] ?? null,
      };
    }),
  clearSelection: () => set({ selectedBlockId: null, selectedBlockIds: [] }),
  hoverBlock: (id) => set({ hoveredBlockId: id }),
  setEditingBlock: (id) => set({ editingBlockId: id }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const entry = state.history[newIndex];
      return {
        blocks: JSON.parse(JSON.stringify(entry.blocks)),
        pageMeta: JSON.parse(JSON.stringify(entry.pageMeta ?? {})),
        historyIndex: newIndex,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const entry = state.history[newIndex];
      return {
        blocks: JSON.parse(JSON.stringify(entry.blocks)),
        pageMeta: JSON.parse(JSON.stringify(entry.pageMeta ?? {})),
        historyIndex: newIndex,
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
  getBlockLocation: (id) => findBlockLocation(get().blocks, id),
}));

// Auto-save on every blocks change (debounced)
let _autosaveTimer: ReturnType<typeof setTimeout> | null = null;
usePageStore.subscribe((state, prevState) => {
  if (state.blocks !== prevState.blocks) {
    if (_autosaveTimer) clearTimeout(_autosaveTimer);
    _autosaveTimer = setTimeout(() => {
      if (state.blocks.length > 0) {
        autosaveBlocks(state.blocks, _autosaveProjectId, _autosavePageId);
      } else {
        clearAutosave(_autosaveProjectId, _autosavePageId);
      }
    }, 500);
  }
});
