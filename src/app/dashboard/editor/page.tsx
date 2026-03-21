'use client';

import { BuilderShell } from '@/components/builder/BuilderShell';

/**
 * Editor Grafico Unificato - TAB EDITOR nel CMS
 * Integrazione completa del site-builder come editor principale
 */
export default function EditorPage() {
  // TODO: Integrare con il contesto CMS per caricare/salvare su Supabase
  return (
    <div className="w-full" style={{ height: 'calc(100vh - 60px)' }}>
      <BuilderShell projectId="cms" projectName="Editor CMS" pageId="home" />
    </div>
  );
}
