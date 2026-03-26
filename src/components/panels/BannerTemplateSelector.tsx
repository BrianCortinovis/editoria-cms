'use client';

import { useState } from 'react';
import { getBannerTemplates, type BannerTemplate } from '@/lib/templates/banner-templates';
import { usePageStore } from '@/lib/stores/page-store';
import { generateId } from '@/lib/utils/id';
import { createBlock } from '@/lib/types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TemplatePreviewBox } from './TemplatePreviewBox';

interface BannerTemplateSelectorProps {
  onClose: () => void;
}

export function BannerTemplateSelector({ onClose }: BannerTemplateSelectorProps) {
  const templates = getBannerTemplates();
  const { addBlock } = usePageStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Group templates by category
  const groupedTemplates = templates.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    },
    {} as Record<string, BannerTemplate[]>
  );

  const handleSelectTemplate = (template: BannerTemplate) => {
    const block = createBlock('banner-module', template.name, template.defaultProps, template.defaultStyle);
    block.id = generateId();
    addBlock(block);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Scegli Template Banner</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates grouped by category */}
        <div className="p-6 space-y-8">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">{category}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      'flex flex-col gap-1.5 p-2 rounded border-2 transition-all text-left cursor-pointer',
                      hoveredId === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Preview Box */}
                    <div className="w-full p-2 rounded border border-gray-300 overflow-hidden bg-white">
                      <TemplatePreviewBox layout={template.id} />
                    </div>

                    {/* Name */}
                    <span className="text-xs font-medium text-gray-700 line-clamp-1">
                      {template.name}
                    </span>

                    {/* Description */}
                    <span className="text-[9px] text-gray-600 line-clamp-2">
                      {template.description}
                    </span>

                    {/* Select Button */}
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'text-xs px-2 py-1 rounded transition-all w-full mt-auto font-medium',
                        hoveredId === template.id
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      Scegli
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="p-4 bg-gray-50 text-xs text-gray-600 text-center border-t">
          {templates.length} template disponibili - Scegli un layout per iniziare
        </div>
      </div>
    </div>
  );
}
