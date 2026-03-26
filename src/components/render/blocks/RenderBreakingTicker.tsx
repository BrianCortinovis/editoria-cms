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

  const { speed = 50, label = 'ULTIMA ORA', direction = 'left' } = block.props as Record<string, unknown>;
  const duration = Math.max(15, 100 - (speed as number));

  const getAnimationKeyframes = () => {
    switch (direction) {
      case 'right':
        return `@keyframes ticker-scroll-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }`;
      case 'up':
        return `@keyframes ticker-scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }`;
      case 'down':
        return `@keyframes ticker-scroll-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }`;
      case 'left':
      default:
        return `@keyframes ticker-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }`;
    }
  };

  const getAnimationName = () => {
    const directionMap: Record<string, string> = {
      'left': 'ticker-scroll-left',
      'right': 'ticker-scroll-right',
      'up': 'ticker-scroll-up',
      'down': 'ticker-scroll-down',
    };
    return directionMap[direction as string] || 'ticker-scroll-left';
  };

  const isVertical = direction === 'up' || direction === 'down';
  const containerClass = isVertical
    ? 'flex flex-col items-center overflow-hidden relative'
    : 'flex items-center overflow-hidden relative';
  const contentClass = isVertical
    ? 'flex flex-col gap-4 whitespace-normal'
    : 'flex gap-12 whitespace-nowrap';

  return (
    <>
      <style>{`${getAnimationKeyframes()}`}</style>
      <div style={style} data-block="breaking-ticker" className={containerClass}>
        <span className="shrink-0 font-bold text-sm px-3 py-1 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginRight: isVertical ? '0' : '12px', marginBottom: isVertical ? '8px' : '0' }}>
          {label as string}
        </span>
        <div className="overflow-hidden flex-1 w-full">
          <div
            className={contentClass}
            style={{ animation: `${getAnimationName()} ${duration}s linear infinite` }}
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
            {/* Duplicate per loop continuo */}
            {items.map((item) => (
              <span key={`dup-${item.id}`}>
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
    </>
  );
}
