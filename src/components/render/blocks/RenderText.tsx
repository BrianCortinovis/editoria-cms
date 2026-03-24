import type { Block } from '@/lib/types/block';
import { sanitizeHtml } from '@/lib/security/html';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderText({ block, style }: Props) {
  const content = sanitizeHtml((block.props.content as string) || '');

  return (
    <div
      style={style}
      data-block="text"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
