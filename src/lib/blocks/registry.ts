import type { BlockDefinition, BlockType } from '@/lib/types/block';

const registry = new Map<BlockType, BlockDefinition>();

export function registerBlock(definition: BlockDefinition): void {
  registry.set(definition.type, definition);
}

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return registry.get(type);
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  return Array.from(registry.values());
}

export function getBlocksByCategory(category: string): BlockDefinition[] {
  return getAllBlockDefinitions().filter((d) => d.category === category);
}

export const BLOCK_CATEGORIES = [
  { id: 'layout', label: 'Layout', icon: 'LayoutGrid' },
  { id: 'content', label: 'Contenuto', icon: 'Type' },
  { id: 'media', label: 'Media', icon: 'Image' },
  { id: 'editorial', label: 'Editoriale', icon: 'Newspaper' },
  { id: 'interactive', label: 'Interattivo', icon: 'MousePointer' },
  { id: 'monetization', label: 'Monetizzazione', icon: 'DollarSign' },
] as const;
