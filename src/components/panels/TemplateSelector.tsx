'use client';

import { useState } from 'react';
import { getTemplatesByCategory, BlockTemplate } from '@/lib/templates/block-templates';
import { usePageStore } from '@/lib/stores/page-store';
import { generateId } from '@/lib/utils/id';
import { createBlock, type BlockType } from '@/lib/types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TemplatePreviewBox } from './TemplatePreviewBox';

interface TemplateSelectorProps {
  category: 'banner' | 'slideshow' | 'gallery' | 'video' | 'carousel';
  onClose: () => void;
}

export function TemplateSelector({ category, onClose }: TemplateSelectorProps) {
  const templates = getTemplatesByCategory(category);
  const { addBlock } = usePageStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelectTemplate = (template: BlockTemplate) => {
    const block = createBlock(
      category as BlockType,
      template.name,
      template.defaultBlock
    );
    block.id = generateId();
    addBlock(block);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold capitalize">Select {category} Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Template Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                hoveredId === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {/* Preview Box */}
              <div className="w-full p-2 rounded border border-gray-300 overflow-hidden bg-white">
                <TemplatePreviewBox layout={template.id} />
              </div>

              {/* Name */}
              <span className="text-xs font-medium text-center text-gray-700 line-clamp-2">
                {template.name}
              </span>

              {/* Select Button */}
              <button
                className={cn(
                  'text-xs px-2 py-1 rounded transition-all w-full',
                  hoveredId === template.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Choose
              </button>
            </button>
          ))}
        </div>

        {/* Info Footer */}
        <div className="p-4 bg-gray-50 text-xs text-gray-600 text-center border-t">
          {templates.length} templates available - Click any to add with pre-configured settings
        </div>
      </div>
    </div>
  );
}
