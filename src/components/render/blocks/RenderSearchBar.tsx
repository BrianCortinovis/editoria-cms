'use client';

import { useState } from 'react';
import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
  tenantSlug?: string;
}

export function RenderSearchBar({ block, style, tenantSlug }: Props) {
  const placeholder = (block.props.placeholder as string) || 'Cerca articoli...';
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/site/${tenantSlug || ''}/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        ...style,
        display: 'flex',
        gap: '0.5rem',
        maxWidth: '600px',
      }}
      data-block="search-bar"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          border: '1px solid var(--e-color-border, #dee2e6)',
          borderRadius: 'var(--e-border-radius, 8px)',
          fontSize: '1rem',
          outline: 'none',
          backgroundColor: 'var(--e-color-surface, #fff)',
          color: 'var(--e-color-text)',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: 'var(--e-color-primary, #8B0000)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--e-border-radius, 8px)',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        Cerca
      </button>
    </form>
  );
}
