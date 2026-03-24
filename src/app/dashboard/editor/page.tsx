'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuilderShell } from '@/components/builder/BuilderShell';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

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
  const [creatingInitialPage, setCreatingInitialPage] = useState(false);
  const initialPageCreationAttempted = useRef(false);

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
        } else if (!pageId && nextPages.length === 0 && !cancelled && !initialPageCreationAttempted.current) {
          initialPageCreationAttempted.current = true;
          setCreatingInitialPage(true);

          const createResponse = await fetch('/api/builder/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: currentTenant.id,
              title: 'Homepage',
              slug: 'homepage',
              page_type: 'homepage',
              meta: {},
              blocks: [],
            }),
          });

          const createPayload = await createResponse.json().catch(() => null);

          if (!createResponse.ok || !createPayload?.page?.id) {
            throw new Error(createPayload?.error || 'Failed to create initial homepage');
          }

          if (!cancelled) {
            const createdPage = {
              id: createPayload.page.id as string,
              title: createPayload.page.title as string,
              slug: createPayload.page.slug as string,
            };
            setPages([createdPage]);
            toast.success('Homepage draft creata automaticamente');
            router.replace(`/dashboard/editor?page=${createdPage.id}`);
          }
        }
      } catch (error) {
        console.error('Failed to load pages for editor:', error);
        if (!cancelled) {
          setPages([]);
          toast.error(error instanceof Error ? error.message : 'Errore caricamento editor');
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
          setCreatingInitialPage(false);
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
            {loadingPages || creatingInitialPage ? 'Sto preparando l’editor…' : 'Seleziona una pagina da modificare'}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--c-text-2)' }}>
            {loadingPages || creatingInitialPage
              ? 'Recupero l’elenco delle pagine del tenant attivo e, se il CMS è vuoto, creo automaticamente una homepage draft per iniziare subito.'
              : 'Usa il menu a tendina nella topbar per aprire la pagina che vuoi modificare nel builder.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-w-0 flex flex-col overflow-hidden" style={{ background: 'var(--c-bg-0)' }}>
      {/* Builder */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <BuilderShell
          projectId={pageId}
          projectName={pageTitle}
          pageId={pageId}
        />
      </div>
    </div>
  );
}
