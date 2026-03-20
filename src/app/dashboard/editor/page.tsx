'use client';

import BuilderShell from '@/components/builder/BuilderShell';

/**
 * Editor Grafico Unificato - TAB EDITOR nel CMS
 * Integrazione completa del site-builder come editor principale
 */
export default function EditorPage() {
  // TODO: Integrare con il contesto CMS per caricare/salvare su Supabase
  return (
    <div className="h-screen w-full">
      <BuilderShell projectId="cms" projectName="Editor CMS" pageId="home" />
    </div>
  );
}
