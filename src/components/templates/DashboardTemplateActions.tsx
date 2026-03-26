'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutTemplate, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { slugifyPageTitle } from '@/lib/pages/page-seo';
import type { Block } from '@/lib/types/block';
import { generateId } from '@/lib/utils/id';

interface Props {
  templateId: string;
  templateName: string;
  templateDescription: string;
  blocks: Block[];
}

function cloneTemplateBlock(block: Block): Block {
  return {
    ...block,
    id: generateId(),
    children: Array.isArray(block.children) ? block.children.map(cloneTemplateBlock) : [],
  };
}

export function DashboardTemplateActions({
  templateId,
  templateName,
  templateDescription,
  blocks,
}: Props) {
  const router = useRouter();
  const { currentTenant } = useAuthStore();
  const [creating, setCreating] = useState(false);

  const handleCreatePageFromTemplate = async () => {
    if (!currentTenant?.id) {
      toast.error('Tenant non disponibile');
      return;
    }

    const baseTitle = templateName.trim() || 'Nuova pagina template';
    const timestamp = new Date();
    const suffix = `${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}${timestamp.getSeconds().toString().padStart(2, '0')}${timestamp.getMilliseconds().toString().padStart(3, '0')}`;
    const pageTitle = `${baseTitle} ${suffix}`;
    const slug = `${slugifyPageTitle(baseTitle)}-${suffix}`;
    const pageBlocks = blocks.map(cloneTemplateBlock);

    setCreating(true);
    try {
      const response = await fetch('/api/builder/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenant.id,
          title: pageTitle,
          slug,
          page_type: 'custom',
          meta: {
            layoutLibrary: {
              appliedTemplate: {
                source: 'dashboard-template-library',
                id: templateId,
                name: templateName,
                updatedAt: new Date().toISOString(),
              },
            },
            description: templateDescription,
          },
          blocks: pageBlocks,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.page?.id) {
        throw new Error(payload?.error || 'Impossibile creare la pagina dal template');
      }

      toast.success(`Pagina creata da "${templateName}"`);
      router.push(`/dashboard/editor?page=${payload.page.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Creazione pagina non riuscita');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCreatePageFromTemplate()}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Usa questo template
      </button>
      <Link
        href="/dashboard/pagine"
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        <LayoutTemplate className="h-4 w-4" />
        Vai a Pagine
      </Link>
    </div>
  );
}
