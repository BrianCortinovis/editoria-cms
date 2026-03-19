import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderDivider({ block, style }: Props) {
  const dividerStyle = (block.props.dividerStyle as string) || 'line';
  const color = (block.props.color as string) || 'var(--e-color-border, #dee2e6)';
  const thickness = (block.props.thickness as number) || 1;
  const width = (block.props.width as string) || '100%';

  if (dividerStyle === 'dots') {
    return (
      <div style={{ ...style, textAlign: 'center', padding: '1rem 0' }} data-block="divider">
        <span style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', color }}>•••</span>
      </div>
    );
  }

  if (dividerStyle === 'wave') {
    return (
      <div style={{ ...style, overflow: 'hidden' }} data-block="divider">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ width: '100%', height: '40px', display: 'block' }}>
          <path d="M0,20 Q300,0 600,20 T1200,20" fill="none" stroke={color} strokeWidth={thickness} />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'center', padding: '1rem 0' }} data-block="divider">
      <hr style={{ width, border: 'none', borderTop: `${thickness}px solid ${color}`, margin: 0 }} />
    </div>
  );
}
