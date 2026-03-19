import type { Block } from '@/lib/types/block';

interface TimelineItem {
  date: string;
  title: string;
  content: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderTimeline({ block, style }: Props) {
  const items = (block.props.items as TimelineItem[]) || [];

  return (
    <div style={{ ...style, position: 'relative', paddingLeft: '2rem' }} data-block="timeline">
      {/* Line */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: 'var(--e-color-border, #dee2e6)',
        }}
      />
      {items.map((item, i) => (
        <div key={i} style={{ position: 'relative', marginBottom: '2rem' }}>
          {/* Dot */}
          <div
            style={{
              position: 'absolute',
              left: '-2rem',
              top: '0.25rem',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--e-color-primary, #8B0000)',
              border: '3px solid var(--e-color-background, #fff)',
            }}
          />
          <time style={{ fontSize: '0.8rem', color: 'var(--e-color-primary, #8B0000)', fontWeight: '600' }}>
            {item.date}
          </time>
          <h3
            style={{
              fontFamily: 'var(--e-font-heading)',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              color: 'var(--e-color-text)',
              margin: '0.25rem 0 0.5rem',
            }}
          >
            {item.title}
          </h3>
          <p style={{ color: 'var(--e-color-textSecondary)', lineHeight: '1.7', margin: 0 }}>
            {item.content}
          </p>
        </div>
      ))}
    </div>
  );
}
