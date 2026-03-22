'use client';

import { useSearchParams } from 'next/navigation';
import { BuilderShell } from '@/components/builder/BuilderShell';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('page');
  const pageTitle = pageId ? `Pagina ${pageId}` : 'Editor CMS';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--c-bg-0)' }}>
      {/* Builder */}
      <div className="flex-1 overflow-hidden">
        <BuilderShell
          projectId={pageId || 'cms'}
          projectName={pageTitle}
          pageId={pageId || 'home'}
        />
      </div>
    </div>
  );
}
