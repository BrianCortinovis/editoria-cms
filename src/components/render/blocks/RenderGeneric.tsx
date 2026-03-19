import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
  children?: React.ReactNode;
}

export function RenderGeneric({ block, style, children }: Props) {
  return (
    <div style={style} data-block={block.type} data-block-id={block.id}>
      {children}
    </div>
  );
}
