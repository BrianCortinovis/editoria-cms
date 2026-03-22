import type { Block } from '@/lib/types/block';
import { NewsletterSignupModule } from './NewsletterSignupModule';

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
  tenantSlug?: string;
}

export function RenderNewsletterSignup({ block, data, style, tenantSlug }: Props) {
  return <NewsletterSignupModule block={block} data={data} style={style} tenantSlug={tenantSlug} compactDefault={Boolean(block.props.compact)} />;
}
