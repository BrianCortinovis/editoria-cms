import type { Block } from '@/lib/types/block';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderText({ block, style }: Props) {
  const content = (block.props.content as string) || '';

  return (
    <div
      style={style}
      data-block="text"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
