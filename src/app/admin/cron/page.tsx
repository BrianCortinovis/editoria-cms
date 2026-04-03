"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, ShieldCheck, TimerReset } from "lucide-react";

interface PlatformCronSettings {
  publishMaintenanceEnabled: boolean;
  seoAnalysisEnabled: boolean;
  complianceSyncEnabled: boolean;
}

export default function AdminCronPage() {
  const [settings, setSettings] = useState<PlatformCronSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/cron-settings", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setSettings(payload.settings);
      } else {
        setResponseText(payload.error || "Impossibile caricare i cron globali");
      }
      setLoading(false);
    }

    void load();
  }, []);

  const save = async (next: PlatformCronSettings) => {
    setSaving(true);
    setResponseText("");
    const response = await fetch("/api/admin/cron-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const payload = await response.json();
    if (response.ok) {
      setSettings(payload.settings);
      setResponseText("Impostazioni cron globali aggiornate.");
    } else {
      setResponseText(payload.error || "Impossibile aggiornare i cron globali");
    }
    setSaving(false);
  };

  const runNow = async (job: "publish-maintenance" | "seo-analysis" | "compliance-sync") => {
    setRunningJob(job);
    setResponseText("");
    const response = await fetch("/api/admin/cron-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    const payload = await response.json();
    setResponseText(JSON.stringify(payload, null, 2));
    setRunningJob(null);
  };

  if (loading) {
    return (
      <div className="border-y px-4 py-3 text-sm" style={{ borderColor: "var(--c-border)" }}>
        Caricamento impostazioni cron...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Global Cron Control
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Cron
        </h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="border-y" style={{ borderColor: "var(--c-border)" }}>
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Switch globali</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>Publish maintenance</p>
              </div>
              <button
                type="button"
                disabled={!settings || saving}
                onClick={() =>
                  settings &&
                  void save({
                    ...settings,
                    publishMaintenanceEnabled: !settings.publishMaintenanceEnabled,
                  })
                }
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                style={{
                  background: settings?.publishMaintenanceEnabled ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                  color: settings?.publishMaintenanceEnabled ? "var(--c-accent)" : "var(--c-text-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {settings?.publishMaintenanceEnabled ? "Attivo" : "Disattivato"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>SEO analysis</p>
              </div>
              <button
                type="button"
                disabled={!settings || saving}
                onClick={() =>
                  settings &&
                  void save({
                    ...settings,
                    seoAnalysisEnabled: !settings.seoAnalysisEnabled,
                  })
                }
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                style={{
                  background: settings?.seoAnalysisEnabled ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                  color: settings?.seoAnalysisEnabled ? "var(--c-accent)" : "var(--c-text-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {settings?.seoAnalysisEnabled ? "Attivo" : "Disattivato"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-semibold" style={{ color: "var(--c-text-0)" }}>Compliance sync</p>
              </div>
              <button
                type="button"
                disabled={!settings || saving}
                onClick={() =>
                  settings &&
                  void save({
                    ...settings,
                    complianceSyncEnabled: !settings.complianceSyncEnabled,
                  })
                }
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                style={{
                  background: settings?.complianceSyncEnabled ? "var(--c-accent-soft)" : "var(--c-bg-1)",
                  color: settings?.complianceSyncEnabled ? "var(--c-accent)" : "var(--c-text-2)",
                  border: "1px solid var(--c-border)",
                }}
              >
                {settings?.complianceSyncEnabled ? "Attivo" : "Disattivato"}
              </button>
            </div>
          </div>
        </section>

        <section className="border-y" style={{ borderColor: "var(--c-border)" }}>
          <div className="border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
            <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Run manuale</h3>
          </div>
          <div className="space-y-3 px-4 py-4">
            <button
              type="button"
              disabled={runningJob !== null}
              onClick={() => void runNow("publish-maintenance")}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: "var(--c-danger)" }}
            >
              {runningJob === "publish-maintenance" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TimerReset className="h-4 w-4" />}
              Esegui publish maintenance ora
            </button>

            <button
              type="button"
              disabled={runningJob !== null}
              onClick={() => void runNow("seo-analysis")}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
              style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
            >
              {runningJob === "seo-analysis" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Esegui SEO analysis ora
            </button>

            <button
              type="button"
              disabled={runningJob !== null}
              onClick={() => void runNow("compliance-sync")}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
              style={{ background: "var(--c-bg-0)", color: "var(--c-text-1)", border: "1px solid var(--c-border)" }}
            >
              {runningJob === "compliance-sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Esegui compliance sync ora
            </button>
          </div>
        </section>
      </div>

      <section className="border-y" style={{ borderColor: "var(--c-border)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>Risposta</h3>
        </div>
        <pre
          className="overflow-auto px-4 py-4 text-xs"
          style={{ color: "var(--c-text-1)" }}
        >
          {responseText || "Nessuna azione eseguita ancora."}
        </pre>
      </section>
    </div>
  );
}
