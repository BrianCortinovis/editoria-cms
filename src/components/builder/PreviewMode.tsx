'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageStore } from '@/lib/stores/page-store';
import { useUiStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/store';
import { DEVICE_WIDTHS, type DeviceMode } from '@/lib/config/breakpoints';
import { cn } from '@/lib/utils/cn';
import {
  X, Monitor, Tablet, Smartphone, RotateCcw,
  ZoomIn, ZoomOut, ExternalLink, Loader2
} from 'lucide-react';

interface PreviewModeProps {
  pageId: string;
}

export function PreviewMode({ pageId }: PreviewModeProps) {
  const { blocks, pageMeta } = usePageStore();
  const { togglePreviewMode } = useUiStore();
  const { currentTenant } = useAuthStore();
  const desktopFrameRef = useRef<HTMLIFrameElement | null>(null);
  const deviceFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [previewDevice, setPreviewDevice] = useState<DeviceMode>('desktop');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const width = DEVICE_WIDTHS[previewDevice];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const saveResponse = await fetch(`/api/builder/pages/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks,
            meta: pageMeta,
          }),
        });

        const savePayload = await saveResponse.json().catch(() => null);
        if (!saveResponse.ok) {
          throw new Error(savePayload?.error || 'Salvataggio preview non riuscito');
        }

        const savedPage = savePayload?.page as {
          slug?: string;
          page_type?: string;
          is_published?: boolean;
        } | undefined;

        const isHomepage =
          savedPage?.page_type === 'homepage' ||
          savedPage?.slug === 'homepage' ||
          savedPage?.slug === '/';

        const tenantSlug = currentTenant?.slug || '';
        const canUseRealRoute = Boolean(tenantSlug && savedPage?.slug && savedPage?.is_published !== false);

        if (canUseRealRoute) {
          const publicPath = isHomepage
            ? `/site/${tenantSlug}`
            : `/site/${tenantSlug}/${savedPage?.slug}`;

          if (!cancelled) {
            setPreviewUrl(`${publicPath}?preview=${Date.now()}`);
          }
        } else {
          const exportResponse = await fetch(`/api/export/${pageId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          const exportPayload = await exportResponse.json().catch(() => null);
          if (!exportResponse.ok) {
            throw new Error(exportPayload?.error || 'Preview non disponibile');
          }

          const body = typeof exportPayload?.html === 'string'
            ? exportPayload.html
            : '<div style="padding:40px;font:14px system-ui,sans-serif;color:#64748b">Nessun contenuto da mostrare.</div>';

          const documentHtml = `<!DOCTYPE html>
            <html lang="it">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                  :root {
                    --c-accent: #2563eb;
                    --c-accent-soft: rgba(37,99,235,0.12);
                    --c-bg-0: #ffffff;
                    --c-bg-1: #f8fafc;
                    --c-bg-2: #eef2f7;
                    --c-text-0: #0f172a;
                    --c-text-1: #334155;
                    --c-text-2: #64748b;
                    --c-text-3: #94a3b8;
                    --c-border: #dbe2ea;
                  }
                  * { box-sizing: border-box; }
                  html, body { margin: 0; padding: 0; background: #fff; }
                  body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; }
                  img { max-width: 100%; display: block; }
                  a { color: inherit; }
                </style>
              </head>
              <body>${body}</body>
            </html>`;

          if (!cancelled) {
            const blob = new Blob([documentHtml], { type: 'text/html' });
            setPreviewUrl(URL.createObjectURL(blob));
          }
        }
      } catch (previewError) {
        if (!cancelled) {
          setPreviewUrl('');
          setLoading(false);
          setError(previewError instanceof Error ? previewError.message : 'Errore preview');
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [blocks, currentTenant?.slug, pageId, pageMeta]);

  const devices: { mode: DeviceMode; icon: typeof Monitor; label: string }[] = [
    { mode: 'desktop', icon: Monitor, label: 'Desktop' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet' },
    { mode: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  const openInNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, '_blank');
  };

  const waitForFrameReady = useCallback(async (frame: HTMLIFrameElement | null) => {
    if (!frame) {
      setLoading(false);
      return;
    }

    try {
      const doc = frame.contentDocument;
      if (!doc) {
        setLoading(false);
        return;
      }

      if (doc.readyState !== 'complete') {
        await new Promise<void>((resolve) => {
          const onReady = () => {
            frame.removeEventListener('load', onReady);
            resolve();
          };
          frame.addEventListener('load', onReady, { once: true });
        });
      }

      const finalDoc = frame.contentDocument;
      const win = frame.contentWindow;
      if (finalDoc && 'fonts' in finalDoc) {
        await finalDoc.fonts.ready.catch(() => undefined);
      }

      const images = finalDoc
        ? Array.from(finalDoc.images).filter((img) => !img.complete)
        : [];

      if (images.length > 0) {
        await Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              })
          )
        );
      }

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      if (win) {
        win.dispatchEvent(new Event('scroll'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col">
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-semibold text-zinc-200">Anteprima</span>

        <div className="w-px h-6 bg-zinc-700" />

        {devices.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setPreviewDevice(mode)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              previewDevice === mode
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}

        <div className="w-px h-6 bg-zinc-700" />

        <button onClick={() => setPreviewZoom(Math.max(0.25, previewZoom - 0.1))} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-mono text-zinc-400 min-w-[40px] text-center">
          {Math.round(previewZoom * 100)}%
        </span>
        <button onClick={() => setPreviewZoom(Math.min(2, previewZoom + 0.1))} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setPreviewZoom(1)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800" title="Reset zoom">
          <RotateCcw size={14} />
        </button>

        <div className="w-px h-6 bg-zinc-700" />
        <span className="text-xs font-mono text-zinc-500">{width}px</span>

        <div className="flex-1" />

        <button
          onClick={openInNewTab}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          title="Apri in nuova scheda"
        >
          <ExternalLink size={16} />
        </button>

        <button
          onClick={togglePreviewMode}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          title="Chiudi anteprima (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-auto flex justify-center" style={{ padding: 24 }}>
        <div
          className="shrink-0"
          style={{
            width,
            transform: `scale(${previewZoom})`,
            transformOrigin: 'top center',
          }}
        >
          {previewDevice !== 'desktop' && (
            <div
              className="mx-auto rounded-[2rem] border-4 border-zinc-700 overflow-hidden shadow-2xl"
              style={{ width: width + 8, background: '#18181b' }}
            >
              <div className="flex justify-center py-2">
                <div className="w-24 h-1.5 bg-zinc-600 rounded-full" />
              </div>
              <div
                className="sb-preview-frame bg-white overflow-auto relative"
                style={{
                  width,
                  minHeight: previewDevice === 'mobile' ? 667 : 1024,
                  maxHeight: previewDevice === 'mobile' ? 667 : 1024,
                }}
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/85 z-10">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rendering reale della pagina...
                    </div>
                  </div>
                )}
                {error ? (
                  <div className="p-8 text-sm text-center text-red-600">{error}</div>
                ) : (
                  <iframe
                    key={previewUrl}
                    ref={deviceFrameRef}
                    title="Preview pagina"
                    src={previewUrl || 'about:blank'}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    onLoad={() => void waitForFrameReady(deviceFrameRef.current)}
                    style={{ width: '100%', minHeight: '100%', height: '100%', border: 'none', background: '#fff' }}
                  />
                )}
              </div>
              <div className="flex justify-center py-2">
                <div className="w-16 h-1 bg-zinc-600 rounded-full" />
              </div>
            </div>
          )}

          {previewDevice === 'desktop' && (
            <div className="sb-preview-frame bg-white shadow-2xl rounded-lg overflow-hidden relative" style={{ width, minHeight: 800 }}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/85 z-10">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering reale della pagina...
                  </div>
                </div>
              )}
              {error ? (
                <div className="p-8 text-sm text-center text-red-600">{error}</div>
              ) : (
                <iframe
                  key={previewUrl}
                  ref={desktopFrameRef}
                  title="Preview pagina"
                  src={previewUrl || 'about:blank'}
                  sandbox="allow-same-origin allow-scripts allow-forms"
                  onLoad={() => void waitForFrameReady(desktopFrameRef.current)}
                  style={{ width: '100%', minHeight: 800, border: 'none', background: '#fff' }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-600">
        Premi <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd> per tornare all&apos;editor
      </div>
    </div>
  );
}
