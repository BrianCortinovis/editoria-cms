'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BuilderShell } from '@/components/builder/BuilderShell';
import { Save, Undo2, Redo2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('page');
  const { currentTenant } = useAuthStore();
  const [pageTitle, setPageTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const { undo, redo, canUndo, canRedo } = usePageStore();
  const { deviceMode, setDeviceMode } = useUiStore();

  useEffect(() => {
    if (!pageId || !currentTenant) {
      setLoading(false);
      return;
    }

    loadPageTitle();
  }, [pageId, currentTenant]);

  const loadPageTitle = async () => {
    if (!pageId || !currentTenant) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_pages')
      .select('title')
      .eq('id', pageId)
      .eq('tenant_id', currentTenant.id)
      .single();

    if (!error && data) {
      setPageTitle(data.title);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--c-bg-0)' }}>
        <div style={{ color: 'var(--c-text-2)' }}>Caricamento pagina...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--c-bg-0)' }}>
      {/* Editor Toolbar */}
      <div className="h-12 flex items-center px-3 gap-2 border-b shrink-0" style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}>
        <button
          onClick={() => undo()}
          disabled={!canUndo()}
          className="p-2 rounded-lg transition disabled:opacity-50"
          style={{ color: "var(--c-text-2)" }}
          title="Annulla"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo()}
          className="p-2 rounded-lg transition disabled:opacity-50"
          style={{ color: "var(--c-text-2)" }}
          title="Ripristina"
        >
          <Redo2 size={16} />
        </button>
        <div className="w-px h-6" style={{ background: "var(--c-border)" }} />
        {['desktop', 'tablet', 'mobile'].map((mode) => (
          <button
            key={mode}
            onClick={() => setDeviceMode(mode as any)}
            className="p-2 rounded-lg transition"
            style={{
              background: deviceMode === mode ? 'var(--c-accent-soft)' : 'transparent',
              color: deviceMode === mode ? 'var(--c-accent)' : 'var(--c-text-2)',
            }}
            title={mode.charAt(0).toUpperCase() + mode.slice(1)}
          >
            {mode === 'desktop' && <Monitor size={16} />}
            {mode === 'tablet' && <Tablet size={16} />}
            {mode === 'mobile' && <Smartphone size={16} />}
          </button>
        ))}
      </div>

      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <BuilderShell
          projectId={pageId || 'cms'}
          projectName={pageTitle || 'Editor CMS'}
          pageId={pageId || 'home'}
        />
      </div>
    </div>
  );
}