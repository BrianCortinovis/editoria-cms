'use client';

import { useState } from 'react';
import { HelpCircle, X, Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
}

const KNOWLEDGE_BASE: Article[] = [
  {
    id: '1',
    title: 'Getting Started with the Builder',
    category: 'Getting Started',
    tags: ['builder', 'basics', 'tutorial'],
    content: 'Learn the basics of using the visual builder interface. Drag blocks onto the canvas, customize their properties, and build your pages quickly.',
  },
  {
    id: '2',
    title: 'Using Blocks and Components',
    category: 'Blocks',
    tags: ['blocks', 'components', 'layout'],
    content: 'Understand how to use different block types. Each block represents a content element that you can customize and arrange on your page.',
  },
  {
    id: '3',
    title: 'Styling and Theme Customization',
    category: 'Styling',
    tags: ['styling', 'theme', 'css', 'design'],
    content: 'Customize the appearance of your blocks using the style editor. Change colors, fonts, spacing, and apply advanced CSS effects.',
  },
  {
    id: '4',
    title: 'WordPress Migration Guide',
    category: 'Migration',
    tags: ['wordpress', 'import', 'migration', 'data'],
    content: 'Import your WordPress content into the CMS. Supports XML and JSON exports with configurable options for categories, tags, authors, and images.',
  },
  {
    id: '5',
    title: 'System Analytics and Monitoring',
    category: 'Administration',
    tags: ['analytics', 'monitoring', 'system', 'admin'],
    content: 'Monitor your system health with the analytics dashboard. Check CPU, memory, storage, API usage, and deployment status.',
  },
];

export function HelpCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = KNOWLEDGE_BASE.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all z-30',
          'flex items-center justify-center font-semibold'
        )}
        style={{
          background: isOpen ? 'var(--c-accent)' : 'var(--c-accent-hover)',
          color: 'white',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
        }}
        title="Help Center"
      >
        {isOpen ? <X size={20} /> : <HelpCircle size={20} />}
      </button>

      {/* Help Panel */}
      {isOpen && (
        <>
          {/* Mobile: Full-screen modal */}
          <div className="md:hidden fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--c-bg-0)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--c-text-0)' }}>Help Center</h2>
              <button onClick={() => setIsOpen(false)}>
                <X size={20} style={{ color: 'var(--c-text-1)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedArticle ? (
                <>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-sm mb-2 transition-colors"
                    style={{ color: 'var(--c-accent)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-accent)')}
                  >
                    ← Back to articles
                  </button>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>
                      {selectedArticle.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--c-text-1)', lineHeight: '1.6' }}>
                      {selectedArticle.content}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-1)' }} />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)', borderColor: 'var(--c-border)' }}
                    />
                  </div>

                  {filteredArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left p-3 rounded-lg transition-colors"
                      style={{ background: 'var(--c-bg-1)' }}
                    >
                      <div className="flex items-start gap-2">
                        <BookOpen size={14} style={{ color: 'var(--c-text-1)', flexShrink: 0, marginTop: '2px' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: 'var(--c-text-0)' }}>
                            {article.title}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--c-text-1)' }}>
                            {article.category}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {filteredArticles.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--c-text-1)' }}>
                      No articles found
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop: Sidebar panel */}
          <div
            className="hidden md:block fixed bottom-20 right-4 w-72 max-h-96 rounded-lg shadow-lg z-40 overflow-hidden flex flex-col"
            style={{ background: 'var(--c-bg-0)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>Help Center</h3>
              <button onClick={() => setIsOpen(false)}>
                <X size={16} style={{ color: 'var(--c-text-1)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedArticle ? (
                <>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-xs mb-2 transition-colors"
                    style={{ color: 'var(--c-accent)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-accent)')}
                  >
                    ← Back
                  </button>
                  <div>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-0)' }}>
                      {selectedArticle.title}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--c-text-1)', lineHeight: '1.5' }}>
                      {selectedArticle.content}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-1)' }} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 rounded text-xs"
                      style={{ background: 'var(--c-bg-1)', color: 'var(--c-text-0)' }}
                    />
                  </div>

                  {filteredArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left p-2 rounded text-xs transition-colors"
                      style={{ background: 'var(--c-bg-1)' }}
                    >
                      <p style={{ color: 'var(--c-text-0)', fontWeight: 500 }}>{article.title}</p>
                      <p style={{ color: 'var(--c-text-1)', fontSize: '10px', marginTop: '2px' }}>
                        {article.category}
                      </p>
                    </button>
                  ))}

                  {filteredArticles.length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--c-text-1)' }}>
                      No results
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
