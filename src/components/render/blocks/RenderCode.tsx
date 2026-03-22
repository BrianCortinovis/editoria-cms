'use client';

import { useState } from 'react';
import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderCode({ block, style }: Props) {
  const code = String(block.props.code || '');
  const language = String(block.props.language || 'text');
  const filename = String(block.props.filename || '');
  const showLineNumbers = block.props.showLineNumbers !== false;
  const highlightLines = Array.isArray(block.props.highlightLines)
    ? (block.props.highlightLines as Array<number | string>).map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];
  const theme = String(block.props.theme || 'dark');
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      style={{
        ...style,
        background: theme === 'light' ? '#f8fafc' : '#0f172a',
        color: theme === 'light' ? '#0f172a' : '#e2e8f0',
        borderRadius: style.borderRadius || '14px',
        overflow: 'hidden',
      }}
      data-block="code"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          borderBottom: `1px solid ${theme === 'light' ? '#dbe2ea' : '#1e293b'}`,
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {filename && <strong>{filename}</strong>}
          <span style={{ opacity: 0.7 }}>{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            border: 'none',
            background: theme === 'light' ? '#e2e8f0' : '#1e293b',
            color: 'inherit',
            padding: '0.45rem 0.8rem',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {copied ? 'Copiato' : 'Copia'}
        </button>
      </div>

      <pre style={{ margin: 0, padding: '1rem', overflowX: 'auto', fontSize: '0.92rem', lineHeight: 1.65 }}>
        <code>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const highlighted = highlightLines.includes(lineNumber);

            return (
              <span
                key={lineNumber}
                style={{
                  display: 'grid',
                  gridTemplateColumns: showLineNumbers ? '44px 1fr' : '1fr',
                  gap: '1rem',
                  background: highlighted ? (theme === 'light' ? 'rgba(59,130,246,0.12)' : 'rgba(56,189,248,0.12)') : 'transparent',
                  padding: '0 0.35rem',
                  borderRadius: '6px',
                }}
              >
                {showLineNumbers && (
                  <span style={{ opacity: 0.5, userSelect: 'none', textAlign: 'right' }}>{lineNumber}</span>
                )}
                <span>{line || ' '}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
