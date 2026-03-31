"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export function PlatformR2Config() {
  const [config, setConfig] = useState<R2Config>({
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    bucketName: "",
    publicUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/platform-r2", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) {
          console.error("Platform R2 config load failed:", res.status);
          setLoaded(true);
          return;
        }
        const data = await res.json();
        if (data?.config) setConfig(data.config);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Platform R2 config fetch error:", err);
        setLoaded(true);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/platform-r2", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Configurazione R2 piattaforma salvata");
    } else {
      const payload = await res.json().catch(() => null);
      toast.error(payload?.error || `Errore salvataggio (${res.status})`);
    }
  };

  if (!loaded) return <div className="text-sm py-4" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>;

  const inputStyle = { borderColor: "var(--c-border)", background: "transparent" };

  return (
    <div className="border rounded-xl p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm">
          <span style={{ color: "var(--c-text-2)" }}>Account ID</span>
          <input
            value={config.accountId}
            onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
            placeholder="es: a1b2c3d4e5f6..."
            className="mt-1 w-full border-b px-0 py-2"
            style={inputStyle}
          />
        </label>
        <label className="text-sm">
          <span style={{ color: "var(--c-text-2)" }}>Access Key ID</span>
          <input
            value={config.accessKeyId}
            onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
            placeholder="R2 API Token key ID"
            className="mt-1 w-full border-b px-0 py-2"
            style={inputStyle}
          />
        </label>
        <label className="text-sm">
          <span style={{ color: "var(--c-text-2)" }}>Secret Access Key</span>
          <input
            type="password"
            value={config.secretAccessKey}
            onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
            placeholder="R2 API Token secret"
            className="mt-1 w-full border-b px-0 py-2"
            style={inputStyle}
          />
        </label>
        <label className="text-sm">
          <span style={{ color: "var(--c-text-2)" }}>Bucket Name</span>
          <input
            value={config.bucketName}
            onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
            placeholder="es: editoria-media"
            className="mt-1 w-full border-b px-0 py-2"
            style={inputStyle}
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span style={{ color: "var(--c-text-2)" }}>URL pubblico (custom domain o R2.dev)</span>
          <input
            value={config.publicUrl}
            onChange={(e) => setConfig({ ...config, publicUrl: e.target.value })}
            placeholder="es: https://media.editoria.app o https://bucket.r2.dev"
            className="mt-1 w-full border-b px-0 py-2"
            style={inputStyle}
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--c-accent)" }}
        >
          {saving ? "Salvataggio..." : "Salva configurazione R2"}
        </button>
      </div>
    </div>
  );
}
