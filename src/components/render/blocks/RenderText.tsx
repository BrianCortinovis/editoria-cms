import type { Block } from '@/lib/types/block';
import { sanitizeHtml } from '@/lib/security/html';

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderText({ block, style }: Props) {
  const content = sanitizeHtml((block.props.content as string) || '');
  const columns = Math.max(1, Number(block.props.columns || 1));
  const dropCap = block.props.dropCap === true;

  return (
    <div
      style={{
        ...style,
        columnCount: columns > 1 ? columns : undefined,
        columnGap: columns > 1 ? '2rem' : undefined,
      }}
      className={dropCap ? 'first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2' : undefined}
      data-block="text"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
