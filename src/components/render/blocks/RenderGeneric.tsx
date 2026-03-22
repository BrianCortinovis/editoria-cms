import React from 'react';
import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
  children?: React.ReactNode;
}

export function RenderGeneric({ block, style, children }: Props) {
  const tagName = typeof block.props.tag === 'string' ? block.props.tag : 'div';
  const Tag = tagName as React.ElementType;
  const childArray = React.Children.toArray(children);

  if (block.type === 'columns') {
    const widths = Array.isArray(block.props.columnWidths) ? (block.props.columnWidths as string[]) : [];
    const childCount = childArray.length || Number(block.props.columnCount || widths.length || 2);

    return (
      <>
        {Boolean(block.props.stackOnMobile) && (
          <style dangerouslySetInnerHTML={{ __html: `@media (max-width: 768px) { [data-block-id="${block.id}"] { flex-direction: column !important; } [data-block-id="${block.id}"] > .sb-col-child { width: 100% !important; flex-basis: 100% !important; } }` }} />
        )}
        <Tag style={style} data-block={block.type} data-block-id={block.id}>
          {Array.from({ length: childCount }).map((_, index) => {
            const child = childArray[index];
            const width = widths[index] || `${Math.round(100 / Math.max(childCount, 1))}%`;
            return (
              <div key={`col-${index}`} className="sb-col-child" style={{ width, flexBasis: width, minWidth: 0 }}>
                {child || null}
              </div>
            );
          })}
        </Tag>
      </>
    );
  }

  return (
    <Tag style={style} data-block={block.type} data-block-id={block.id}>
      {children}
    </Tag>
  );
}
