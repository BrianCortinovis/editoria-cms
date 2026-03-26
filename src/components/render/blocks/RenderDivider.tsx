import type { Block } from '@/lib/types/block';
import { generateDividerSvg } from '@/lib/shapes/dividers';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderDivider({ block, style }: Props) {
  const shape = String(block.props.shape || 'wave') as Parameters<typeof generateDividerSvg>[0];
  const height = Number(block.props.height || 80);
  const color = String(block.props.color || '#ffffff');
  const backgroundColor = String(block.props.backgroundColor || 'transparent');
  const flip = block.props.flip === true;
  const invert = block.props.invert === true;

  return (
    <div
      style={{ ...style, overflow: 'hidden', background: backgroundColor }}
      data-block="divider"
      dangerouslySetInnerHTML={{
        __html: generateDividerSvg(shape, 1440, height, color, flip, invert),
      }}
    >
    </div>
  );
}
