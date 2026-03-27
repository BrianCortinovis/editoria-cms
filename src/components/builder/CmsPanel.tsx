'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Database,
  FileText,
  LayoutTemplate,
  Loader2,
  ScanLine,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface CmsPanelProps {
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

interface CmsCompanionState {
  pageCount: number;
  templateCount: number;
  slotCount: number;
}

const quickLinks = [
  { href: '/dashboard/pagine', label: 'Pagine CMS', icon: FileText, description: 'Contenuti e metadata pubblicati.' },
  { href: '/dashboard/layout', label: 'Layout', icon: LayoutTemplate, description: 'Struttura e wireframe degli slot.' },
  { href: '/dashboard/layout/content', label: 'Regole Slot', icon: ScanLine, description: 'Categorie, ordinamento e assignment mode.' },
  { href: '/dashboard/seo', label: 'SEO', icon: Settings2, description: 'Ottimizzazione e analisi lato CMS.' },
];

function CmsPanelContent({ onClose }: { onClose?: () => void }) {
  const { currentTenant } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<CmsCompanionState | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!currentTenant?.id) {
        if (!cancelled) {
          setState(null);
        }
        return;
      }

      setLoading(true);
      const supabase = createClient();
      const [{ count: pageCount }, { data: templates }, { count: slotCount }] = await Promise.all([
        supabase
          .from('site_pages')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id),
        supabase
          .from('layout_templates')
          .select('id')
          .eq('tenant_id', currentTenant.id),
        supabase
          .from('layout_slots')
          .select('id, layout_templates!inner(tenant_id)', { count: 'exact', head: true })
          .eq('layout_templates.tenant_id', currentTenant.id),
      ]);

      if (!cancelled) {
        setState({
          pageCount: pageCount || 0,
          templateCount: templates?.length || 0,
          slotCount: slotCount || 0,
        });
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [currentTenant, refreshNonce]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--c-bg-0)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database size={16} style={{ color: 'var(--c-accent)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                CMS Companion
              </h3>
            </div>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
              Il builder non gestisce piu` categorie, assegnazioni editoriali o SEO. Qui trovi solo i collegamenti rapidi verso il CMS che controlla contenuti e publishing.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded"
              style={{ color: 'var(--c-text-2)', background: 'var(--c-bg-2)' }}
            >
              Chiudi
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-b space-y-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}>
        <div className="rounded-lg border px-3 py-3" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
          <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--c-text-2)' }}>
            Tenant attivo
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: 'var(--c-text-0)' }}>
            {currentTenant ? `${currentTenant.name} (${currentTenant.slug})` : 'Nessun tenant selezionato'}
          </div>
          <div className="mt-2 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
            Il builder resta focalizzato su blocchi, layout e runtime. Le regole contenuto vengono lette dal CMS e non vengono piu` configurate qui.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Pagine</div>
            <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
              {loading ? '…' : state?.pageCount ?? 0}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Template</div>
            <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
              {loading ? '…' : state?.templateCount ?? 0}
            </div>
          </div>
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-0)' }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--c-text-2)' }}>Slot</div>
            <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--c-text-0)' }}>
              {loading ? '…' : state?.slotCount ?? 0}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRefreshNonce((current) => current + 1)} disabled={!currentTenant?.id || loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl border p-4 transition-colors"
              style={{ borderColor: 'var(--c-border)', background: 'var(--c-bg-1)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--c-accent-soft)', color: 'var(--c-accent)' }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--c-text-0)' }}>
                    {link.label}
                  </div>
                  <div className="mt-1 text-xs leading-5" style={{ color: 'var(--c-text-2)' }}>
                    {link.description}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CmsPanel({ open = true, onClose, inline = false }: CmsPanelProps) {
  if (!inline && !open) {
    return null;
  }

  if (inline) {
    return <CmsPanelContent />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-[92vw] max-w-3xl h-[72vh] overflow-hidden rounded-2xl border shadow-2xl'
        )}
        style={{ background: 'var(--c-bg-0)', borderColor: 'var(--c-border)' }}
      >
        <CmsPanelContent onClose={onClose} />
      </div>
    </div>
  );
}
