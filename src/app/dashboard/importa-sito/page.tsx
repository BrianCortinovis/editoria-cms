"use client";

import { useState, useCallback } from "react";
import { Upload, FileJson, Check, AlertTriangle, Loader2, FileText, Download } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface ImportedPage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  blocks: unknown[];
  meta: Record<string, unknown>;
  customCss: string;
}

interface ImportedProject {
  project: { id: string; name: string };
  pages: ImportedPage[];
}

export default function ImportaSitoPage() {
  const { currentTenant } = useAuthStore();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedProject | null>(null);
  const [results, setResults] = useState<Array<{ page: string; status: "ok" | "error"; message?: string }>>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ImportedProject;

      if (!data.project || !Array.isArray(data.pages)) {
        toast.error("Formato file non valido. Esporta dal Desktop Builder.");
        return;
      }

      setPreview(data);
      setResults([]);
      toast.success(`Progetto "${data.project.name}" caricato — ${data.pages.length} pagine trovate`);
    } catch {
      toast.error("File JSON non valido");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) {
      void handleFile(file);
    } else {
      toast.error("Trascina un file .json esportato dal Desktop Builder");
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const importToTenant = useCallback(async () => {
    if (!currentTenant || !preview) return;
    setImporting(true);
    const importResults: typeof results = [];

    for (const page of preview.pages) {
      try {
        // Check if page with this slug already exists
        const supabase = createClient();
        const { data: existing } = await supabase
          .from("site_pages")
          .select("id")
          .eq("tenant_id", currentTenant.id)
          .eq("slug", page.slug)
          .maybeSingle();

        if (existing) {
          // Update existing page
          const res = await fetch(`/api/builder/pages/${existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: page.title,
              blocks: page.blocks,
              meta: page.meta,
              custom_css: page.customCss || "",
            }),
          });
          if (!res.ok) throw new Error(`Update failed: ${res.status}`);
          importResults.push({ page: page.title, status: "ok", message: "Aggiornata" });
        } else {
          // Create new page
          const res = await fetch("/api/builder/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: currentTenant.id,
              title: page.title,
              slug: page.slug,
              page_type: page.pageType || "page",
              blocks: page.blocks,
              meta: page.meta,
            }),
          });
          if (!res.ok) throw new Error(`Create failed: ${res.status}`);
          importResults.push({ page: page.title, status: "ok", message: "Creata" });
        }
      } catch (e) {
        importResults.push({
          page: page.title,
          status: "error",
          message: e instanceof Error ? e.message : "Errore sconosciuto",
        });
      }
    }

    setResults(importResults);
    setImporting(false);

    const ok = importResults.filter(r => r.status === "ok").length;
    const errors = importResults.filter(r => r.status === "error").length;
    if (errors === 0) {
      toast.success(`Importazione completata: ${ok} pagine importate`);
    } else {
      toast.error(`Importazione: ${ok} ok, ${errors} errori`);
    }
  }, [currentTenant, preview]);

  const tenantSlug = currentTenant?.slug || "tenant-slug";
  const bridgeUrl = `/api/v1/bridge/site-pack?tenant=${tenantSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Upload size={24} style={{ color: "var(--c-accent)" }} />
          <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
            Importa Sito
          </h2>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-2)" }}>
          Importa un progetto creato con il Desktop Builder. Le pagine vengono create o aggiornate nel tenant corrente.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
        style={{
          borderColor: dragOver ? "var(--c-accent)" : "var(--c-border)",
          background: dragOver ? "var(--c-accent-soft)" : "var(--c-bg-1)",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <FileJson size={40} className="mx-auto mb-3" style={{ color: "var(--c-text-2)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
          Trascina il file JSON del progetto
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>
          Esporta dal Desktop Builder con File → Esporta JSON
        </p>
        <label
          className="inline-flex items-center gap-2 mt-4 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
          style={{ background: "var(--c-accent)", color: "#fff" }}
        >
          <Upload size={16} />
          Scegli file
          <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                {preview.project.name}
              </h3>
              <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
                {preview.pages.length} pagine da importare
              </p>
            </div>
            <button
              onClick={() => void importToTenant()}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {importing ? "Importazione..." : `Importa nel tenant ${currentTenant?.name || ""}`}
            </button>
          </div>

          <div className="space-y-1">
            {preview.pages.map((page) => {
              const result = results.find(r => r.page === page.title);
              return (
                <div
                  key={page.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--c-bg-2)" }}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={14} style={{ color: "var(--c-text-2)" }} />
                    <span className="text-sm" style={{ color: "var(--c-text-0)" }}>{page.title}</span>
                    <span className="text-xs" style={{ color: "var(--c-text-2)" }}>/{page.slug}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-bg-3)", color: "var(--c-text-2)" }}>
                      {page.pageType} · {Array.isArray(page.blocks) ? page.blocks.length : 0} blocchi
                    </span>
                  </div>
                  {result && (
                    <div className="flex items-center gap-1">
                      {result.status === "ok" ? (
                        <Check size={14} style={{ color: "#22c55e" }} />
                      ) : (
                        <AlertTriangle size={14} style={{ color: "#ef4444" }} />
                      )}
                      <span className="text-xs" style={{ color: result.status === "ok" ? "#22c55e" : "#ef4444" }}>
                        {result.message}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bridge info */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
          Collegamento Desktop Builder
        </h3>
        <div className="space-y-2 text-xs" style={{ color: "var(--c-text-2)" }}>
          <p>Il Desktop Builder crea layout offline. Per importarli nel CMS:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Apri il Desktop Builder sul tuo computer</li>
            <li>Crea il layout del sito con blocchi e template</li>
            <li>File → Esporta JSON</li>
            <li>Trascina il file qui sopra</li>
          </ol>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Bridge pack:</span>
          <code className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
            {bridgeUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
