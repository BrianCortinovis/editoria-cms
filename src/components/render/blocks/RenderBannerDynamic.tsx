'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Block } from '@/lib/types';

interface BannerItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  url?: string;
  buttonText?: string;
  animation?: string;
  duration?: number;
  delay?: number;
}

interface RenderBannerDynamicProps {
  block: Block;
  data?: BannerItem[];
}

export function RenderBannerDynamic({ block, data }: RenderBannerDynamicProps) {
  const props = block.props as {
    banners?: BannerItem[];
    autoplay?: boolean;
    autoplayInterval?: number;
    transitionDuration?: number;
    transitionType?: string;
    height?: number;
    overlayOpacity?: number;
    overlayColor?: string;
    showDots?: boolean;
    showArrows?: boolean;
    loop?: boolean;
    [key: string]: unknown;
  };
  const banners: BannerItem[] = data || props.banners || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const autoplay = props.autoplay ?? true;
  const autoplayInterval = props.autoplayInterval ?? 5000;
  const transitionDuration = props.transitionDuration ?? 600;
  const transitionType = props.transitionType ?? 'fade';
  const height = props.height ?? 400;
  const overlayOpacity = props.overlayOpacity ?? 0.3;
  const overlayColor = props.overlayColor ?? '#000000';
  const showDots = props.showDots ?? true;
  const showArrows = props.showArrows ?? true;
  const loop = props.loop ?? true;

  if (banners.length === 0) {
    return (
      <div style={{
        height: `${height}px`,
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        Nessun banner configurato
      </div>
    );
  }

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), transitionDuration);
  };

  const nextSlide = () => {
    const next = activeIndex + 1;
    if (next >= banners.length) {
      if (loop) goToSlide(0);
    } else {
      goToSlide(next);
    }
  };

  const prevSlide = () => {
    const prev = activeIndex - 1;
    if (prev < 0) {
      if (loop) goToSlide(banners.length - 1);
    } else {
      goToSlide(prev);
    }
  };

  // Autoplay
  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(nextSlide, autoplayInterval);
    return () => clearInterval(interval);
  }, [activeIndex, autoplay, autoplayInterval]);

  const activeBanner = banners[activeIndex];

  // Transizione CSS
  const getTransitionClass = () => {
    if (!isTransitioning) return '';
    if (transitionType === 'fade') return 'fade-transition';
    if (transitionType === 'slideLeft') return 'slide-left-transition';
    if (transitionType === 'slideRight') return 'slide-right-transition';
    if (transitionType === 'slideUp') return 'slide-up-transition';
    return 'fade-transition';
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes rotateIn {
          from { transform: rotate(-5deg); opacity: 0; }
          to { transform: rotate(0); opacity: 1; }
        }

        .fade-transition {
          animation: fadeIn ${transitionDuration}ms ease-in-out;
        }
        .slide-left-transition {
          animation: slideInLeft ${transitionDuration}ms ease-in-out;
        }
        .slide-right-transition {
          animation: slideInRight ${transitionDuration}ms ease-in-out;
        }
        .slide-up-transition {
          animation: slideInUp ${transitionDuration}ms ease-in-out;
        }

        .banner-container {
          position: relative;
          height: ${height}px;
          overflow: hidden;
          background: #000;
        }

        .banner-slide {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, ${overlayOpacity});
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: white;
          padding: 40px 20px;
          z-index: 2;
        }

        .banner-content {
          max-width: 600px;
          animation: slideInUp 0.8s ease-out;
        }

        .banner-title {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 16px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .banner-description {
          font-size: 18px;
          margin-bottom: 24px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
          opacity: 0.95;
        }

        .banner-button {
          display: inline-block;
          padding: 14px 32px;
          background: white;
          color: #000;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .banner-button:hover {
          background: #f0f0f0;
          transform: scale(1.05);
        }

        .banner-nav {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .banner-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .banner-dot.active {
          background: white;
          width: 32px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .banner-dot:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .banner-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .banner-arrow:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        .banner-arrow-left {
          left: 24px;
        }

        .banner-arrow-right {
          right: 24px;
        }
      `}</style>

      <div className="banner-container">
        {/* Slide */}
        <div
          key={activeBanner.id}
          className={`banner-slide ${getTransitionClass()}`}
          style={{
            backgroundImage: activeBanner.image ? `url(${activeBanner.image})` : undefined,
          }}
        />

        {/* Overlay con contenuto */}
        <div className="banner-overlay">
          <div className="banner-content">
            {activeBanner.title && (
              <h2 className="banner-title">{activeBanner.title}</h2>
            )}
            {activeBanner.description && (
              <p className="banner-description">{activeBanner.description}</p>
            )}
            {activeBanner.url && activeBanner.buttonText && (
              <a href={activeBanner.url} className="banner-button">
                {activeBanner.buttonText}
              </a>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {showArrows && banners.length > 1 && (
          <>
            <button
              className="banner-arrow banner-arrow-left"
              onClick={prevSlide}
              aria-label="Banner precedente"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="banner-arrow banner-arrow-right"
              onClick={nextSlide}
              aria-label="Banner successivo"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Navigation Dots */}
        {showDots && banners.length > 1 && (
          <div className="banner-nav">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`banner-dot ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Vai al banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
