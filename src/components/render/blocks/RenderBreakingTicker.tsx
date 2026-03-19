'use client';

import type { Block } from '@/lib/types/block';

interface BreakingItem {
  id: string;
  text: string;
  link_url: string | null;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

export function RenderBreakingTicker({ block, data, style }: Props) {
  const items = data as BreakingItem[];
  if (items.length === 0) return null;

  const { speed = 50, label = 'ULTIMA ORA' } = block.props as Record<string, unknown>;

  return (
    <div style={style} data-block="breaking-ticker" className="flex items-center overflow-hidden">
      <span className="shrink-0 font-bold text-sm px-3 py-1 mr-3 rounded"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
        {label as string}
      </span>
      <div className="overflow-hidden flex-1">
        <div
          className="flex gap-12 whitespace-nowrap animate-marquee"
          style={{ animationDuration: `${(items.length * 10000) / (speed as number)}ms` }}
        >
          {items.map((item) => (
            <span key={item.id}>
              {item.link_url ? (
                <a href={item.link_url} className="hover:underline">{item.text}</a>
              ) : (
                item.text
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
