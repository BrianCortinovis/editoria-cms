'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BuilderShell } from '@/components/builder/BuilderShell';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('page');
  const { currentTenant } = useAuthStore();
  const [pageTitle, setPageTitle] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="w-full h-full overflow-hidden" style={{ background: 'var(--c-bg-0)' }}>
      <BuilderShell
        projectId={pageId || 'cms'}
        projectName={pageTitle || 'Editor CMS'}
        pageId={pageId || 'home'}
      />
    </div>
  );
}