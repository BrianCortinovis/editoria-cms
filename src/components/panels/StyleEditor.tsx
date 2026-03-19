'use client';

import type { Block } from '@/lib/types/block';

// Style editor stub — will be completed with full style controls
export function StyleEditor({ block }: { block: Block }) {
  return (
    <div className="p-3 text-xs text-zinc-500">
      <p>Stile per: {block.label}</p>
      <p className="mt-2">Editor stili in sviluppo</p>
    </div>
  );
}

export default StyleEditor;
