import type { Block } from '@/lib/types/block';

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  content?: string;
  icon?: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderTimeline({ block, style }: Props) {
  const items = ((block.props.events as TimelineItem[]) || (block.props.items as TimelineItem[]) || []).filter((item) => item?.title);
  const lineColor = String(block.props.lineColor || 'var(--e-color-primary, #8B0000)');
  const layout = String(block.props.layout || 'stacked');

  return (
    <div style={{ ...style, position: 'relative', paddingLeft: layout === 'alternating' ? '0' : '2rem' }} data-block="timeline">
      {/* Line */}
      <div
        style={{
          position: 'absolute',
          left: layout === 'alternating' ? '50%' : '8px',
          top: 0,
          bottom: 0,
          width: '2px',
          transform: layout === 'alternating' ? 'translateX(-50%)' : undefined,
          backgroundColor: lineColor,
        }}
      />
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            marginBottom: '2rem',
            width: layout === 'alternating' ? 'calc(50% - 28px)' : '100%',
            marginLeft: layout === 'alternating' && i % 2 === 1 ? 'calc(50% + 28px)' : undefined,
          }}
        >
          {/* Dot */}
          <div
            style={{
              position: 'absolute',
              left: layout === 'alternating' ? (i % 2 === 0 ? 'calc(100% + 20px)' : '-36px') : '-2rem',
              top: '0.25rem',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: lineColor,
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
            {item.description || item.content}
          </p>
        </div>
      ))}
    </div>
  );
}
