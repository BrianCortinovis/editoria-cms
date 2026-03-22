import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderTable({ block, style }: Props) {
  const headers = (block.props.headers as string[]) || [];
  const rows = (block.props.rows as string[][]) || [];
  const striped = Boolean(block.props.striped);
  const bordered = block.props.bordered !== false;
  const hoverable = block.props.hoverable !== false;
  const responsive = block.props.responsive !== false;
  const darkHeader = String(block.props.headerStyle || 'dark') === 'dark';

  return (
    <div style={{ ...style, overflowX: responsive ? 'auto' : style.overflowX }} data-block="table">
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '320px' }}>
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  style={{
                    padding: '0.85rem 1rem',
                    textAlign: 'left',
                    fontWeight: 700,
                    background: darkHeader ? 'var(--e-color-text, #111827)' : 'var(--e-color-surface, #f8fafc)',
                    color: darkHeader ? '#fff' : 'var(--e-color-text, #111827)',
                    border: bordered ? '1px solid var(--e-color-border, #dbe2ea)' : 'none',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              style={{
                background: striped && rowIndex % 2 === 1 ? 'var(--e-color-surface, #f8fafc)' : 'transparent',
              }}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={{
                    padding: '0.85rem 1rem',
                    border: bordered ? '1px solid var(--e-color-border, #dbe2ea)' : 'none',
                    transition: hoverable ? 'background-color 0.15s ease' : undefined,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
