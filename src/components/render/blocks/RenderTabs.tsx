'use client';

import { useEffect, useState } from 'react';
import type { Block } from '@/lib/types/block';
import { sanitizeHtml } from '@/lib/security/html';

interface TabItem {
  id: string;
  title: string;
  content: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderTabs({ block, style }: Props) {
  const tabs = ((block.props.tabs as TabItem[]) || []).filter((tab) => tab?.id && tab?.title);
  const initialTabId = String(block.props.activeTab || tabs[0]?.id || '');
  const [activeTab, setActiveTab] = useState(initialTabId);
  const alignment = String(block.props.alignment || 'left');
  const variant = String(block.props.style || 'default');
  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  useEffect(() => {
    setActiveTab(initialTabId);
  }, [initialTabId]);

  return (
    <div style={style} data-block="tabs">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          borderBottom: variant === 'underline' ? '1px solid var(--e-color-border, #dfe3e8)' : undefined,
          paddingBottom: '0.75rem',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab?.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: variant === 'pills' ? '0.65rem 1rem' : '0.45rem 0',
                border: 'none',
                borderBottom: variant === 'underline' && isActive ? '2px solid var(--e-color-primary, #8B0000)' : '2px solid transparent',
                borderRadius: variant === 'pills' ? '999px' : 0,
                background: variant === 'pills' && isActive ? 'var(--e-color-primary, #8B0000)' : 'transparent',
                color: variant === 'pills' && isActive ? '#fff' : 'var(--e-color-text, #1f2937)',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      <div
        style={{ marginTop: '1.25rem', color: 'var(--e-color-textSecondary, #475569)', lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentTab?.content || '<p>Nessun contenuto disponibile.</p>') }}
      />
    </div>
  );
}
