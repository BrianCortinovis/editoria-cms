import type { Block } from '@/lib/types/block';

interface Banner {
  id: string;
  name: string;
  image_url: string | null;
  html_content: string | null;
  link_url: string | null;
  type: string;
}

interface Props {
  block: Block;
  data: unknown[];
  style: React.CSSProperties;
}

export function RenderBannerZone({ block, data, style }: Props) {
  const banners = data as Banner[];
  if (banners.length === 0) {
    const { fallbackHtml } = block.props as Record<string, unknown>;
    if (fallbackHtml) {
      return <div style={style} dangerouslySetInnerHTML={{ __html: fallbackHtml as string }} />;
    }
    return null;
  }

  // Pick one banner (weighted random handled by API, here just use first)
  const banner = banners[0];

  return (
    <div style={style} data-block="banner-zone">
      {banner.type === 'html' && banner.html_content ? (
        <div dangerouslySetInnerHTML={{ __html: banner.html_content }} />
      ) : banner.image_url ? (
        banner.link_url ? (
          <a href={banner.link_url} target="_blank" rel="noopener sponsored">
            <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto" loading="lazy" />
          </a>
        ) : (
          <img src={banner.image_url} alt={banner.name} className="max-w-full h-auto" loading="lazy" />
        )
      ) : null}
    </div>
  );
}
