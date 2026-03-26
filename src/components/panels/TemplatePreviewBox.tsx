'use client';

import React from 'react';

interface TemplatePreviewBoxProps {
  layout: string;
  previewData?: Record<string, unknown>;
}

export function TemplatePreviewBox({ layout, previewData }: TemplatePreviewBoxProps) {
  const renderPreview = () => {
    switch (layout) {
      // BANNER LAYOUTS
      case 'banner-single-square':
        return (
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
              1:1 Banner
            </div>
          </div>
        );
      case 'banner-single-rect-wide':
        return (
          <div className="w-full" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center text-white text-xs font-bold">
              16:9 Banner
            </div>
          </div>
        );
      case 'banner-single-rect-tall':
        return (
          <div className="w-full" style={{ aspectRatio: '3/4' }}>
            <div className="w-full h-full bg-gradient-to-b from-indigo-400 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold text-center px-1">
              3:4 Banner
            </div>
          </div>
        );
      case 'banner-column-single':
        return (
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full flex flex-col gap-1">
              <div className="flex-1 bg-gradient-to-r from-blue-300 to-blue-500 rounded" />
              <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded" />
              <div className="flex-1 bg-gradient-to-r from-blue-300 to-blue-500 rounded" />
            </div>
          </div>
        );
      case 'banner-column-double':
        return (
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full grid grid-cols-2 gap-1">
              <div className="bg-gradient-to-r from-blue-300 to-blue-500 rounded" />
              <div className="bg-gradient-to-r from-cyan-300 to-cyan-500 rounded" />
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded" />
              <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 rounded" />
            </div>
          </div>
        );
      case 'banner-column-triple':
        return (
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={i % 2 === 0 ? 'bg-gradient-to-br from-blue-300 to-blue-500 rounded' : 'bg-gradient-to-br from-cyan-300 to-cyan-500 rounded'}
                />
              ))}
            </div>
          </div>
        );
      case 'banner-row':
        return (
          <div className="w-full" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full flex gap-1 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded" />
              ))}
            </div>
          </div>
        );
      case 'banner-grid-2x2':
        return (
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <div className="w-full h-full grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={i % 2 === 0 ? 'bg-gradient-to-br from-blue-300 to-blue-500 rounded' : 'bg-gradient-to-br from-cyan-300 to-cyan-500 rounded'}
                />
              ))}
            </div>
          </div>
        );
      case 'banner-carousel-auto':
        return (
          <div className="w-full relative" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full bg-gradient-to-r from-red-400 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
              Carosello Auto
            </div>
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        );
      case 'banner-carousel-fast':
        return (
          <div className="w-full relative" style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
              Carosello Veloce
            </div>
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        );
      // NAVIGATION LAYOUTS
      case 'nav-minimal-underline':
        return (
          <div className="w-full space-y-1">
            <div className="flex gap-3">
              {['Home', 'Chi Siamo', 'Contatti'].map((item, i) => (
                <div key={i} className="text-[10px] font-medium pb-1 border-b-2 border-blue-500">
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      case 'nav-buttons-rect':
        return (
          <div className="w-full flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-2 py-1 bg-gray-300 rounded text-[9px] font-medium">
                Link {i + 1}
              </div>
            ))}
          </div>
        );
      case 'nav-tabs-simple':
        return (
          <div className="w-full flex gap-1 border-b border-gray-300">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`px-3 py-1 text-[9px] font-medium ${i === 0 ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              >
                Tab {i + 1}
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="w-full h-12 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs">
            Preview
          </div>
        );
    }
  };

  return <div className="w-full">{renderPreview()}</div>;
}
