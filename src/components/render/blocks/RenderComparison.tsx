'use client';

import { useState } from 'react';
import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderComparison({ block, style }: Props) {
  const [position, setPosition] = useState(Number(block.props.initialPosition || 50));
  const beforeImage = String(block.props.beforeImage || '');
  const afterImage = String(block.props.afterImage || '');
  const beforeLabel = String(block.props.beforeLabel || 'Prima');
  const afterLabel = String(block.props.afterLabel || 'Dopo');

  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden' }} data-block="comparison">
      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 'inherit', overflow: 'hidden', background: 'var(--e-color-surface, #f8fafc)' }}>
        {afterImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={afterImage} alt={afterLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, width: `${position}%`, overflow: 'hidden' }}>
          {beforeImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={beforeImage} alt={beforeLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a, #334155)' }} />
          )}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${position}%`, width: '2px', background: '#fff', boxShadow: '0 0 0 1px rgba(15,23,42,0.18)' }} />
        <div style={{ position: 'absolute', left: '1rem', bottom: '1rem', padding: '0.35rem 0.7rem', borderRadius: '999px', background: 'rgba(15,23,42,0.72)', color: '#fff', fontSize: '0.78rem' }}>
          {beforeLabel}
        </div>
        <div style={{ position: 'absolute', right: '1rem', bottom: '1rem', padding: '0.35rem 0.7rem', borderRadius: '999px', background: 'rgba(15,23,42,0.72)', color: '#fff', fontSize: '0.78rem' }}>
          {afterLabel}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        style={{ width: '100%', marginTop: '0.85rem' }}
      />
    </div>
  );
}
