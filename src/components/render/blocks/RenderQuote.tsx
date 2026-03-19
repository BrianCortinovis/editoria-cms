import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderQuote({ block, style }: Props) {
  const text = (block.props.text as string) || '';
  const author = (block.props.author as string) || '';
  const source = (block.props.source as string) || '';

  return (
    <blockquote
      style={{
        ...style,
        borderLeft: `4px solid var(--e-color-primary, #8B0000)`,
        padding: style.padding || '1.5rem 2rem',
        margin: style.margin || '2rem 0',
        fontStyle: 'italic',
        position: 'relative',
      }}
      data-block="quote"
    >
      <p
        style={{
          fontSize: '1.25rem',
          lineHeight: '1.8',
          color: 'var(--e-color-text)',
          fontFamily: 'var(--e-font-heading)',
          margin: 0,
        }}
      >
        &ldquo;{text}&rdquo;
      </p>
      {(author || source) && (
        <footer style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--e-color-textSecondary)' }}>
          {author && <strong>{author}</strong>}
          {author && source && ' — '}
          {source && <cite>{source}</cite>}
        </footer>
      )}
    </blockquote>
  );
}
