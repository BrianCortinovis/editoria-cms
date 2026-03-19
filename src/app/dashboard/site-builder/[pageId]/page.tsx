'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { BuilderShell } from '@/components/builder/BuilderShell';

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTenant } = useAuthStore();
  const pageId = params.pageId as string;

  const [pageTitle, setPageTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;
    fetch(`/api/builder/pages/${pageId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.page) {
          setPageTitle(data.page.title);
        } else {
          router.push('/dashboard/site-builder');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/dashboard/site-builder');
      });
  }, [pageId, router]);

  if (loading || !currentTenant) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-zinc-400 animate-pulse">Caricamento builder...</div>
      </div>
    );
  }

  return (
    <BuilderShell
      pageId={pageId}
      pageTitle={pageTitle}
      tenantId={currentTenant.id}
    />
  );
}
