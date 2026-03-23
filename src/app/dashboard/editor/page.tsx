'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuilderShell } from '@/components/builder/BuilderShell';
import { useAuthStore } from '@/lib/store';

interface EditorPageRecord {
  id: string;
  title: string;
  slug: string;
}

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant } = useAuthStore();
  const pageId = searchParams.get('page');
  const [pages, setPages] = useState<EditorPageRecord[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    if (!currentTenant?.id) {
      setPages([]);
      setLoadingPages(false);
      return;
    }

    let cancelled = false;
    setLoadingPages(true);

    const loadPages = async () => {
      try {
        const response = await fetch(`/api/builder/pages?tenant_id=${currentTenant.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load pages');
        }

        const nextPages = Array.isArray(data.pages) ? data.pages : [];

        if (!cancelled) {
          setPages(nextPages);
        }

        if (!pageId && nextPages.length > 0 && !cancelled) {
          router.replace(`/dashboard/editor?page=${nextPages[0].id}`);
        }
      } catch (error) {
        console.error('Failed to load pages for editor:', error);
        if (!cancelled) {
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
        }
      }
    };

    void loadPages();

    return () => {
      cancelled = true;
    };
  }, [currentTenant?.id, pageId, router]);

  const currentPage = useMemo(
    () => pages.find((page) => page.id === pageId) ?? null,
    [pages, pageId]
  );

  const pageTitle = currentPage?.title || 'Editor CMS';

  if (!pageId) {
    return (
      <div className="w-full h-full flex items-center justify-center px-6" style={{ background: 'var(--c-bg-0)' }}>
        <div
          className="max-w-md w-full rounded-2xl border p-6 text-center"
          style={{ background: 'var(--c-bg-1)', borderColor: 'var(--c-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--c-text-3)' }}>
            Editor CMS
          </p>
          <h2 className="mt-3 text-xl font-semibold" style={{ color: 'var(--c-text-0)' }}>
            {loadingPages ? 'Sto caricando le pagine del CMS…' : 'Seleziona una pagina da modificare'}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--c-text-2)' }}>
            {loadingPages
              ? 'Recupero l’elenco delle pagine del tenant attivo e apro automaticamente la prima disponibile.'
              : 'Usa il menu a tendina nella topbar per aprire la pagina che vuoi modificare nel builder.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--c-bg-0)' }}>
      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <BuilderShell
          projectId={pageId}
          projectName={pageTitle}
          pageId={pageId}
        />
      </div>
    </div>
  );
}
