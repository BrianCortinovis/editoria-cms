'use client';

import { useState, useEffect } from 'react';
import type { Block } from '@/lib/types/block';

interface BannerItem {
  id: string;
  imageUrl: string;
  link: string;
  altText: string;
  duration: number;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderBannerModule({ block, style }: Props) {
  const {
    layout = 'single',
    banners = [],
    carouselEnabled = false,
    carouselSpeed = 5,
    carouselAutoPlay = true,
    aspectRatio = '1/1',
    showControls = true,
  } = block.props as Record<string, unknown>;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play carousel with per-banner duration
  useEffect(() => {
    if (!carouselEnabled || !carouselAutoPlay || (banners as BannerItem[]).length <= 1) return;

    const current = (banners as BannerItem[])[currentIndex];
    // Se il banner ha duration personalizzata, usarla; altrimenti usare carouselSpeed globale
    const duration = (current?.duration && current.duration > 0) ? current.duration : (carouselSpeed as number);

    const timeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % (banners as BannerItem[]).length);
    }, duration * 1000);

    return () => clearTimeout(timeout);
  }, [currentIndex, carouselEnabled, carouselAutoPlay, carouselSpeed, banners]);

  if (!banners || (banners as BannerItem[]).length === 0) {
    return <div style={style} className="bg-gray-200 rounded flex items-center justify-center min-h-[200px]">Nessun banner</div>;
  }

  const getGridClass = () => {
    switch (layout) {
      case 'column-single':
        return 'flex flex-col';
      case 'column-double':
        return 'grid grid-cols-2 gap-3';
      case 'column-triple':
        return 'grid grid-cols-3 gap-3';
      case 'row':
        return 'flex flex-row overflow-x-auto gap-3 pb-2';
      case 'grid-2x2':
        return 'grid grid-cols-2 gap-3';
      case 'carousel':
        return 'w-full';
      case 'single':
      default:
        return 'w-full';
    }
  };

  const BannerImage = ({ banner }: { banner: BannerItem }) => (
    <div style={{ aspectRatio: aspectRatio as React.CSSProperties['aspectRatio'] }} className="overflow-hidden rounded bg-gray-100 flex-shrink-0">
      {banner.imageUrl ? (
        <a href={banner.link || '#'} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          <img
            src={banner.imageUrl}
            alt={banner.altText}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer"
          />
        </a>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          {banner.altText}
        </div>
      )}
    </div>
  );

  // Carousel view
  if (layout === 'carousel') {
    const current = (banners as BannerItem[])[currentIndex];
    return (
      <div style={style} className="relative w-full">
        <div style={{ aspectRatio: aspectRatio as React.CSSProperties['aspectRatio'] }} className="w-full">
          <BannerImage banner={current} />
        </div>
        {(showControls as boolean) && (banners as BannerItem[]).length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
            {(banners as BannerItem[]).map((_, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid/Row/Column views
  return (
    <div style={style} className={getGridClass()}>
      {(banners as BannerItem[]).map((banner) => (
        <BannerImage key={banner.id} banner={banner} />
      ))}
    </div>
  );
}
