"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { Check, Plus } from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface RedirectRow {
  id: string;
  source_path: string;
  target_path: string;
  status_code: number;
  is_active: boolean;
}

export default function RedirectPage() {
  const { currentTenant } = useAuthStore();
  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [moduleReady, setModuleReady] = useState(true);
  const [sourcePath, setSourcePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);
  const [isActive, setIsActive] = useState(true);

  const loadRedirects = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("redirects")
      .select("id, source_path, target_path, status_code, is_active")
      .eq("tenant_id", currentTenant.id)
      .order("source_path");

    if (error) {
      if (error.message.toLowerCase().includes("redirects")) {
        setModuleReady(false);
      } else {
        toast.error(error.message);
      }
      setRedirects([]);
      return;
    }

    setModuleReady(true);
    setRedirects((data || []) as RedirectRow[]);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRedirects();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRedirects]);

  const handleSave = async () => {
    if (!currentTenant || !sourcePath.trim() || !targetPath.trim()) {
      toast.error("Source e target obbligatori");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("redirects").upsert({
      tenant_id: currentTenant.id,
      source_path: sourcePath.startsWith("/") ? sourcePath : `/${sourcePath}`,
      target_path: targetPath.startsWith("/") ? targetPath : `/${targetPath}`,
      status_code: statusCode,
      is_active: isActive,
    }, { onConflict: "tenant_id,source_path" });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Redirect salvato");
    setSourcePath("");
    setTargetPath("");
    setStatusCode(301);
    setIsActive(true);
    loadRedirects();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Redirect</h2>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Gestione permalink legacy e migrazioni WordPress SEO-safe.</p>
        </div>
        <AIButton
          compact
          actions={[
            {
              id: "redirect-plan",
              label: "Piano redirect",
              prompt: "Analizza i redirect attuali del tenant e suggerisci una strategia SEO-safe per migrazioni WordPress, permalink legacy e categorie/articoli: {context}",
            },
            {
              id: "redirect-rules",
              label: "Regole consigliate",
              prompt: "Proponi regole pratiche e controlli per gestire redirect 301/302 in un CMS editoriale multi-tenant: {context}",
            },
          ]}
          contextData={JSON.stringify({
            tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
            redirects,
            draft: { sourcePath, targetPath, statusCode, isActive },
            moduleReady,
          }, null, 2)}
        />
      </div>

      {!moduleReady ? (
        <div className="rounded-lg p-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-1)" }}>Il modulo redirect è pronto nel codice ma la tabella non è ancora applicata al database dev.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
          <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Nuovo redirect</h3>
            </div>
            <input value={sourcePath} onChange={(event) => setSourcePath(event.target.value)} placeholder="/vecchio-permalink" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <input value={targetPath} onChange={(event) => setTargetPath(event.target.value)} placeholder="/nuovo-permalink" className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }} />
            <select value={statusCode} onChange={(event) => setStatusCode(Number(event.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--c-border)" }}>
              <option value={301}>301 Permanente</option>
              <option value={302}>302 Temporaneo</option>
            </select>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              Redirect attivo
            </label>
            <button onClick={handleSave} className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: "var(--c-accent)" }}>
              <Check className="w-4 h-4" /> Salva redirect
            </button>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            {redirects.length === 0 ? (
              <div className="p-5 text-sm" style={{ color: "var(--c-text-2)" }}>Nessun redirect configurato.</div>
            ) : (
              redirects.map((item) => (
                <div key={item.id} className="px-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{item.source_path}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--c-text-3)" }}>{item.status_code} → {item.target_path}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: item.is_active ? "var(--c-accent-soft)" : "var(--c-bg-2)", color: item.is_active ? "var(--c-accent)" : "var(--c-text-2)" }}>
                      {item.is_active ? "Attivo" : "Off"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
