'use client';

import { useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import type { Block } from '@/lib/types/block';

interface BannerItem {
  id: string;
  imageUrl: string;
  link: string;
  altText: string;
  duration: number;
}

interface BannerModuleEditorProps {
  block: Block;
  onClose: () => void;
}

export function BannerModuleEditor({ block, onClose }: BannerModuleEditorProps) {
  const { updateBlockProps } = usePageStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  const banners = (block.props?.banners as BannerItem[]) || [];
  const carouselSpeed = (block.props?.carouselSpeed as number) || 5;

  const updateBanner = (id: string, updates: Partial<BannerItem>) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    updateBlockProps(block.id, { banners: updated });
  };

  const addBanner = () => {
    const newBanner: BannerItem = {
      id: `banner-${Date.now()}`,
      imageUrl: '',
      link: '',
      altText: `Banner ${banners.length + 1}`,
      duration: carouselSpeed,
    };
    updateBlockProps(block.id, { banners: [...banners, newBanner] });
  };

  const removeBanner = (id: string) => {
    updateBlockProps(block.id, { banners: banners.filter((b) => b.id !== id) });
  };

  const duplicateBanner = (banner: BannerItem) => {
    const dup: BannerItem = {
      ...banner,
      id: `banner-${Date.now()}`,
    };
    updateBlockProps(block.id, { banners: [...banners, dup] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Gestisci Banner</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Chiudi
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {banners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nessun banner aggiunto</p>
            </div>
          ) : (
            banners.map((banner, idx) => (
              <div
                key={banner.id}
                className="border rounded-lg p-4 bg-gray-50 space-y-3"
              >
                {/* Banner Index */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Banner {idx + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateBanner(banner)}
                      className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                      title="Duplica"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => removeBanner(banner.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    URL Immagine
                  </label>
                  <input
                    type="text"
                    value={banner.imageUrl}
                    onChange={(e) => updateBanner(banner.id, { imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Link (URL)
                  </label>
                  <input
                    type="text"
                    value={banner.link}
                    onChange={(e) => updateBanner(banner.id, { link: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Testo Alternativo
                  </label>
                  <input
                    type="text"
                    value={banner.altText}
                    onChange={(e) => updateBanner(banner.id, { altText: e.target.value })}
                    placeholder="Descrizione banner"
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 flex items-center gap-2">
                    <Clock size={14} />
                    Durata Visualizzazione (secondi)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={banner.duration}
                      onChange={(e) =>
                        updateBanner(banner.id, { duration: Math.max(1, parseInt(e.target.value) || carouselSpeed) })
                      }
                      className="w-20 px-3 py-2 border rounded text-sm"
                    />
                    <span className="text-xs text-gray-600">
                      {banner.duration}s
                      {banner.duration !== carouselSpeed && ` (default: ${carouselSpeed}s)`}
                    </span>
                    {banner.duration !== carouselSpeed && (
                      <button
                        onClick={() => updateBanner(banner.id, { duration: carouselSpeed })}
                        className="text-xs px-2 py-1 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-2">
          <button
            onClick={addBanner}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Aggiungi Banner
          </button>
        </div>
      </div>
    </div>
  );
}
