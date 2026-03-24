'use client';

import { useState } from 'react';
import type { Block } from '@/lib/types/block';
import { sanitizeHtml } from '@/lib/security/html';

interface AccordionItem {
  title: string;
  content: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderAccordion({ block, style }: Props) {
  const items = (block.props.items as AccordionItem[]) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div style={style} data-block="accordion">
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            borderBottom: '1px solid var(--e-color-border, #dee2e6)',
          }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--e-font-heading)',
              fontWeight: '600',
              fontSize: '1.1rem',
              color: 'var(--e-color-text)',
              textAlign: 'left',
            }}
          >
            {item.title}
            <span style={{ fontSize: '1.5rem', lineHeight: 1, transition: 'transform 0.2s', transform: openIndex === i ? 'rotate(45deg)' : 'none' }}>
              +
            </span>
          </button>
          {openIndex === i && (
            <div
              style={{
                padding: '0 0 1rem 0',
                color: 'var(--e-color-textSecondary)',
                lineHeight: '1.7',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
