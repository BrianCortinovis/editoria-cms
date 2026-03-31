"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { SuperadminSiteRow } from "@/lib/superadmin/service";

function formatBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function bytesFromGbString(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 1024 * 1024 * 1024);
}

function gbStringFromBytes(value: number | null) {
  if (!value || value <= 0) return "";
  return (value / 1024 / 1024 / 1024).toFixed(2);
}

type DraftMap = Record<string, {
  mediaProvider: string;
  publishedMediaProvider: string;
  softLimitGb: string;
  hardLimitGb: string;
  monthlyEgressLimitGb: string;
  uploadBlocked: boolean;
  publishBlocked: boolean;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicUrl: string;
}>;

export function StorageControlTable({ sites }: { sites: SuperadminSiteRow[] }) {
  const [savingSiteId, setSavingSiteId] = useState<string | null>(null);
  const [refreshingSiteId, setRefreshingSiteId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>(() =>
    Object.fromEntries(
      sites.map((site) => [
        site.siteId,
        {
          mediaProvider: site.mediaProvider || "supabase",
          publishedMediaProvider: site.publishedMediaProvider || "supabase",
          softLimitGb: gbStringFromBytes(site.storageSoftLimitBytes),
          hardLimitGb: gbStringFromBytes(site.storageHardLimitBytes),
          monthlyEgressLimitGb: gbStringFromBytes(site.monthlyEgressLimitBytes),
          uploadBlocked: site.uploadBlocked,
          publishBlocked: site.publishBlocked,
          r2AccountId: (site.config as Record<string, string>)?.r2_account_id || "",
          r2AccessKeyId: (site.config as Record<string, string>)?.r2_access_key_id || "",
          r2SecretAccessKey: (site.config as Record<string, string>)?.r2_secret_access_key ? "••••••••" : "",
          r2BucketName: (site.config as Record<string, string>)?.r2_bucket_name || "",
          r2PublicUrl: (site.config as Record<string, string>)?.r2_public_url || "",
        },
      ]),
    ),
  );

  const sortedSites = useMemo(
    () => [...sites].sort((left, right) => (right.storageUsedBytes || 0) - (left.storageUsedBytes || 0)),
    [sites],
  );

  const updateDraft = (siteId: string, patch: Partial<DraftMap[string]>) => {
    setDrafts((current) => ({
      ...current,
      [siteId]: {
        ...current[siteId],
        ...patch,
      },
    }));
  };

  const saveSite = async (siteId: string) => {
    const draft = drafts[siteId];
    setSavingSiteId(siteId);
    const response = await fetch(`/api/admin/storage/sites/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        mediaProvider: draft.mediaProvider,
        publishedMediaProvider: draft.publishedMediaProvider,
        softLimitBytes: bytesFromGbString(draft.softLimitGb),
        hardLimitBytes: bytesFromGbString(draft.hardLimitGb),
        monthlyEgressLimitBytes: bytesFromGbString(draft.monthlyEgressLimitGb),
        uploadBlocked: draft.uploadBlocked,
        publishBlocked: draft.publishBlocked,
        r2Config: (draft.mediaProvider === "cloudflare_r2" || draft.publishedMediaProvider === "cloudflare_r2") ? {
          r2_account_id: draft.r2AccountId,
          r2_access_key_id: draft.r2AccessKeyId,
          r2_secret_access_key: draft.r2SecretAccessKey === "••••••••" ? undefined : draft.r2SecretAccessKey,
          r2_bucket_name: draft.r2BucketName,
          r2_public_url: draft.r2PublicUrl,
        } : undefined,
      }),
    });

    setSavingSiteId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(typeof payload?.error === "string" ? payload.error : "Impossibile salvare la policy storage");
      return;
    }

    toast.success("Policy storage aggiornata");
    window.location.reload();
  };

  const refreshUsage = async (siteId: string) => {
    setRefreshingSiteId(siteId);
    const response = await fetch(`/api/admin/storage/sites/${siteId}`, {
      method: "POST",
      credentials: "same-origin",
    });
    setRefreshingSiteId(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(typeof payload?.error === "string" ? payload.error : "Impossibile aggiornare l'usage");
      return;
    }

    toast.success("Usage ricalcolato");
    window.location.reload();
  };

  return (
    <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
      {sortedSites.map((site) => {
        const draft = drafts[site.siteId];
        return (
          <article key={site.siteId} className="border-b px-4 py-4 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{site.name}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                  {site.slug} · {site.stackKind || "n/d"} · {site.deployTargetKind || "n/d"} · {site.primaryDomain || "nessun dominio"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p style={{ color: "var(--c-text-0)" }}>{formatBytes(site.storageUsedBytes)} usati</p>
                <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                  {site.mediaObjectCount} media · {site.storageUsagePercent !== null ? `${site.storageUsagePercent}% hard limit` : "nessun hard limit"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <label className="text-sm">
                <span style={{ color: "var(--c-text-2)" }}>Provider media master</span>
                <select
                  value={draft.mediaProvider}
                  onChange={(event) => updateDraft(site.siteId, { mediaProvider: event.target.value })}
                  className="mt-1 w-full border-b px-0 py-2"
                  style={{ borderColor: "var(--c-border)", background: "transparent" }}
                >
                  <option value="supabase">Supabase</option>
                  <option value="cloudflare_r2">Cloudflare R2</option>
                  <option value="customer_vps_local">Customer VPS local</option>
                </select>
              </label>

              <label className="text-sm">
                <span style={{ color: "var(--c-text-2)" }}>Provider media pubblicati</span>
                <select
                  value={draft.publishedMediaProvider}
                  onChange={(event) => updateDraft(site.siteId, { publishedMediaProvider: event.target.value })}
                  className="mt-1 w-full border-b px-0 py-2"
                  style={{ borderColor: "var(--c-border)", background: "transparent" }}
                >
                  <option value="supabase">Supabase</option>
                  <option value="cloudflare_r2">Cloudflare R2</option>
                  <option value="customer_vps_local">Customer VPS local</option>
                </select>
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Soft GB</span>
                  <input
                    value={draft.softLimitGb}
                    onChange={(event) => updateDraft(site.siteId, { softLimitGb: event.target.value })}
                    className="mt-1 w-full border-b px-0 py-2"
                    style={{ borderColor: "var(--c-border)", background: "transparent" }}
                  />
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Hard GB</span>
                  <input
                    value={draft.hardLimitGb}
                    onChange={(event) => updateDraft(site.siteId, { hardLimitGb: event.target.value })}
                    className="mt-1 w-full border-b px-0 py-2"
                    style={{ borderColor: "var(--c-border)", background: "transparent" }}
                  />
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Egress GB/mese</span>
                  <input
                    value={draft.monthlyEgressLimitGb}
                    onChange={(event) => updateDraft(site.siteId, { monthlyEgressLimitGb: event.target.value })}
                    className="mt-1 w-full border-b px-0 py-2"
                    style={{ borderColor: "var(--c-border)", background: "transparent" }}
                  />
                </label>
              </div>
            </div>

            {/* R2 config fields — visible when provider is cloudflare_r2 */}
            {(draft.mediaProvider === "cloudflare_r2" || draft.publishedMediaProvider === "cloudflare_r2") && (
              <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--c-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--c-text-2)" }}>
                  R2 dedicato (enterprise) — lascia vuoto per usare R2 piattaforma
                </p>
                <div className="grid gap-3 xl:grid-cols-3">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Account ID</span>
                    <input
                      value={draft.r2AccountId}
                      onChange={(event) => updateDraft(site.siteId, { r2AccountId: event.target.value })}
                      placeholder="Cloudflare Account ID"
                      className="mt-1 w-full border-b px-0 py-2"
                      style={{ borderColor: "var(--c-border)", background: "transparent" }}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Access Key ID</span>
                    <input
                      value={draft.r2AccessKeyId}
                      onChange={(event) => updateDraft(site.siteId, { r2AccessKeyId: event.target.value })}
                      placeholder="R2 API Token key"
                      className="mt-1 w-full border-b px-0 py-2"
                      style={{ borderColor: "var(--c-border)", background: "transparent" }}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Secret Access Key</span>
                    <input
                      type="password"
                      value={draft.r2SecretAccessKey}
                      onChange={(event) => updateDraft(site.siteId, { r2SecretAccessKey: event.target.value })}
                      placeholder="R2 API Token secret"
                      className="mt-1 w-full border-b px-0 py-2"
                      style={{ borderColor: "var(--c-border)", background: "transparent" }}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Bucket Name</span>
                    <input
                      value={draft.r2BucketName}
                      onChange={(event) => updateDraft(site.siteId, { r2BucketName: event.target.value })}
                      placeholder="es: cliente-media"
                      className="mt-1 w-full border-b px-0 py-2"
                      style={{ borderColor: "var(--c-border)", background: "transparent" }}
                    />
                  </label>
                  <label className="text-sm xl:col-span-2">
                    <span style={{ color: "var(--c-text-2)" }}>URL pubblico</span>
                    <input
                      value={draft.r2PublicUrl}
                      onChange={(event) => updateDraft(site.siteId, { r2PublicUrl: event.target.value })}
                      placeholder="es: https://media.cliente.it"
                      className="mt-1 w-full border-b px-0 py-2"
                      style={{ borderColor: "var(--c-border)", background: "transparent" }}
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                <input
                  type="checkbox"
                  checked={draft.uploadBlocked}
                  onChange={(event) => updateDraft(site.siteId, { uploadBlocked: event.target.checked })}
                />
                Blocca upload
              </label>
              <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-1)" }}>
                <input
                  type="checkbox"
                  checked={draft.publishBlocked}
                  onChange={(event) => updateDraft(site.siteId, { publishBlocked: event.target.checked })}
                />
                Blocca publish
              </label>
              <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
                Ultimo rilievo: {site.lastUsageMeasuredAt ? new Date(site.lastUsageMeasuredAt).toLocaleString("it-IT") : "mai"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => refreshUsage(site.siteId)}
                disabled={refreshingSiteId === site.siteId}
                className="rounded-full border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)", background: "var(--c-bg-0)" }}
              >
                {refreshingSiteId === site.siteId ? "Aggiorno usage..." : "Ricalcola usage"}
              </button>
              <button
                onClick={() => saveSite(site.siteId)}
                disabled={savingSiteId === site.siteId}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--c-danger)" }}
              >
                {savingSiteId === site.siteId ? "Salvataggio..." : "Salva policy"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
