"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Building2, Cloud, Database, Mail, Rocket, ShieldCheck } from "lucide-react";
import type { PlatformSiteInfrastructure } from "@/lib/platform/infrastructure-service";
import type { DeploymentTargetKind } from "@/types/database";

function formatPlanLabel(planCode: string | null | undefined) {
  switch (planCode) {
    case "base":
      return "Base";
    case "medium":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    case "free":
    default:
      return "Free";
  }
}

function formatPlanPrice(planCode: string | null | undefined) {
  switch (planCode) {
    case "base":
      return "49€/mese";
    case "medium":
      return "99€/mese";
    case "enterprise":
      return "199€/mese";
    default:
      return "Trial";
  }
}

function inputClassName() {
  return "mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";
}

function inputStyle() {
  return {
    background: "var(--c-bg-2)",
    borderColor: "var(--c-border)",
    color: "var(--c-text-0)",
  };
}

export function SiteInfrastructureSettings({
  siteId,
  infrastructure,
  planCode,
  canManage,
}: {
  siteId: string;
  infrastructure: PlatformSiteInfrastructure;
  planCode: string | null | undefined;
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(infrastructure);
  const [saving, setSaving] = useState(false);

  const isEnterprise = planCode === "enterprise";
  const dedicatedEnabled = form.stackKind === "dedicated";
  const canEditDedicated = canManage && isEnterprise;

  const update = <K extends keyof PlatformSiteInfrastructure>(
    key: K,
    value: PlatformSiteInfrastructure[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function save() {
    if (!canManage) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/platform/sites/${siteId}/infrastructure`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stackKind: form.stackKind,
          deployTargetKind: form.deployTargetKind,
          deployTargetLabel: form.deployTargetLabel,
          publicBaseUrl: form.publicBaseUrl,
          mediaStorageLabel: form.mediaStorageLabel,
          publishStrategy: form.publishStrategy,
          supabaseProjectRef: form.supabaseProjectRef,
          supabaseUrl: form.supabaseUrl,
          supabaseAnonKey: form.supabaseAnonKey,
          supabaseServiceRoleKey: form.supabaseServiceRoleKey,
          vercel: form.vercel,
          r2: form.r2,
          newsletter: form.newsletter,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile salvare la configurazione");
      }

      setForm(payload.infrastructure as PlatformSiteInfrastructure);
      toast.success("Configurazione piattaforma aggiornata");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="rounded-3xl border p-5"
      style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--c-text-2)" }}
          >
            Piano e infrastruttura
          </p>
          <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--c-text-0)" }}>
            Setup cliente condiviso o isolato
          </h3>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
            Il piano commerciale resta separato dall&apos;isolamento tecnico: un cliente Enterprise
            puo` restare sul setup condiviso oppure attivare stack dedicato con Vercel,
            Supabase, Cloudflare R2 e provider newsletter propri.
          </p>
        </div>

        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--c-border)" }}>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
            Piano corrente
          </p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            {formatPlanLabel(planCode)}
          </p>
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
            {formatPlanPrice(planCode)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5" style={{ color: "var(--c-accent)" }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                    Isolamento cliente
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
                    {dedicatedEnabled
                      ? "Attivo: il sito usa configurazioni dedicate quando valorizzate."
                      : "Disattivo: il sito resta sul setup condiviso della piattaforma."}
                  </p>
                </div>

                <label className="inline-flex items-center gap-3">
                  <span className="text-sm" style={{ color: "var(--c-text-1)" }}>
                    Dedicato
                  </span>
                  <button
                    type="button"
                    disabled={!canEditDedicated}
                    onClick={() =>
                      update("stackKind", dedicatedEnabled ? "shared" : "dedicated")
                    }
                    className="relative h-7 w-12 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: dedicatedEnabled ? "var(--c-accent)" : "var(--c-border)",
                    }}
                    aria-pressed={dedicatedEnabled}
                  >
                    <span
                      className="absolute top-1 h-5 w-5 rounded-full bg-white transition"
                      style={{ left: dedicatedEnabled ? "1.55rem" : "0.25rem" }}
                    />
                  </button>
                </label>
              </div>

              {!isEnterprise ? (
                <div
                  className="mt-4 rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)", color: "var(--c-text-1)" }}
                >
                  L&apos;isolamento dedicato si abilita solo su piano Enterprise. Puoi lasciare il sito
                  in shared oppure passare prima a Enterprise dal billing.
                  <Link href="/app/billing" className="ml-2 font-semibold" style={{ color: "var(--c-accent)" }}>
                    Apri billing
                  </Link>
                </div>
              ) : null}

              {!canManage ? (
                <div
                  className="mt-4 rounded-2xl border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)", color: "var(--c-text-2)" }}
                >
                  Solo owner e admin possono aggiornare questa configurazione.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
            Runtime attuale
          </p>
          <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--c-text-1)" }}>
            <p>Stack: <strong>{form.stackKind}</strong></p>
            <p>Deploy: <strong>{form.deployTargetKind}</strong></p>
            <p>Publish strategy: <strong>{form.publishStrategy || "published-static-json"}</strong></p>
            <p>Public URL: <strong>{form.publicBaseUrl || "non impostata"}</strong></p>
          </div>
        </div>
      </div>

      {dedicatedEnabled ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2">
                <Rocket className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                  Deploy / Vercel
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Target deploy</span>
                  <select
                    value={form.deployTargetKind}
                    onChange={(event) =>
                      update("deployTargetKind", event.target.value as DeploymentTargetKind)
                    }
                    disabled={!canEditDedicated}
                    className={inputClassName()}
                    style={inputStyle()}
                  >
                    <option value="vercel_managed">Vercel</option>
                    <option value="customer_vps">Customer VPS</option>
                    <option value="static_bundle">Static bundle</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Label target</span>
                  <input
                    value={form.deployTargetLabel}
                    onChange={(event) => update("deployTargetLabel", event.target.value)}
                    disabled={!canEditDedicated}
                    placeholder="es: Vercel dedicato cliente"
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Public base URL</span>
                  <input
                    value={form.publicBaseUrl}
                    onChange={(event) => update("publicBaseUrl", event.target.value)}
                    disabled={!canEditDedicated}
                    placeholder="https://www.cliente.it"
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Project ID</span>
                    <input
                      value={form.vercel.projectId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vercel: { ...current.vercel, projectId: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Team ID</span>
                    <input
                      value={form.vercel.teamId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vercel: { ...current.vercel, teamId: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Vercel token</span>
                    <input
                      type="password"
                      value={form.vercel.token}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vercel: { ...current.vercel, token: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Production domain</span>
                    <input
                      value={form.vercel.productionDomain}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          vercel: {
                            ...current.vercel,
                            productionDomain: event.target.value,
                          },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                  Supabase dedicato
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Project ref</span>
                  <input
                    value={form.supabaseProjectRef}
                    onChange={(event) => update("supabaseProjectRef", event.target.value)}
                    disabled={!canEditDedicated}
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Supabase URL</span>
                  <input
                    value={form.supabaseUrl}
                    onChange={(event) => update("supabaseUrl", event.target.value)}
                    disabled={!canEditDedicated}
                    placeholder="https://xxxx.supabase.co"
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Anon key</span>
                    <input
                      type="password"
                      value={form.supabaseAnonKey}
                      onChange={(event) => update("supabaseAnonKey", event.target.value)}
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Service role key</span>
                    <input
                      type="password"
                      value={form.supabaseServiceRoleKey}
                      onChange={(event) =>
                        update("supabaseServiceRoleKey", event.target.value)
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2">
                <Cloud className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                  Cloudflare R2
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Account ID</span>
                    <input
                      value={form.r2.accountId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          r2: { ...current.r2, accountId: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Bucket</span>
                    <input
                      value={form.r2.bucketName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          r2: { ...current.r2, bucketName: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Access key ID</span>
                    <input
                      value={form.r2.accessKeyId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          r2: { ...current.r2, accessKeyId: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Secret access key</span>
                    <input
                      type="password"
                      value={form.r2.secretAccessKey}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          r2: { ...current.r2, secretAccessKey: event.target.value },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Public URL</span>
                  <input
                    value={form.r2.publicUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        r2: { ...current.r2, publicUrl: event.target.value },
                      }))
                    }
                    disabled={!canEditDedicated}
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Storage label</span>
                  <input
                    value={form.mediaStorageLabel}
                    onChange={(event) => update("mediaStorageLabel", event.target.value)}
                    disabled={!canEditDedicated}
                    placeholder="es: alpsitecms-storage"
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-2">
                <Mail className="h-4.5 w-4.5" style={{ color: "var(--c-accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
                  Newsletter / provider dedicato
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Provider</span>
                  <select
                    value={form.newsletter.provider}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        newsletter: {
                          ...current.newsletter,
                          provider: event.target.value as PlatformSiteInfrastructure["newsletter"]["provider"],
                        },
                      }))
                    }
                    disabled={!canEditDedicated}
                    className={inputClassName()}
                    style={inputStyle()}
                  >
                    <option value="custom">Custom</option>
                    <option value="mailchimp">Mailchimp</option>
                    <option value="brevo">Brevo</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="convertkit">ConvertKit</option>
                  </select>
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>API key</span>
                    <input
                      type="password"
                      value={form.newsletter.apiKey}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          newsletter: {
                            ...current.newsletter,
                            apiKey: event.target.value,
                          },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>API base URL</span>
                    <input
                      value={form.newsletter.apiBaseUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          newsletter: {
                            ...current.newsletter,
                            apiBaseUrl: event.target.value,
                          },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>List / audience ID</span>
                    <input
                      value={form.newsletter.listId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          newsletter: {
                            ...current.newsletter,
                            listId: event.target.value,
                          },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                  <label className="text-sm">
                    <span style={{ color: "var(--c-text-2)" }}>Sender email</span>
                    <input
                      value={form.newsletter.senderEmail}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          newsletter: {
                            ...current.newsletter,
                            senderEmail: event.target.value,
                          },
                        }))
                      }
                      disabled={!canEditDedicated}
                      className={inputClassName()}
                      style={inputStyle()}
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span style={{ color: "var(--c-text-2)" }}>Webhook / form endpoint</span>
                  <input
                    value={form.newsletter.webhookUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        newsletter: {
                          ...current.newsletter,
                          webhookUrl: event.target.value,
                        },
                      }))
                    }
                    disabled={!canEditDedicated}
                    className={inputClassName()}
                    style={inputStyle()}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="mt-5 rounded-2xl border px-4 py-4 text-sm"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
        >
          Il sito sta usando il setup condiviso della piattaforma. Quando attivi l&apos;isolamento,
          compariranno qui i box di configurazione dedicata per deploy, database, storage e provider newsletter.
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
          I segreti gia` presenti restano mascherati. Se lasci il campo con puntini, il valore
          attuale viene mantenuto.
        </p>
        <button
          type="button"
          disabled={!canManage || saving}
          onClick={() => void save()}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--c-accent)" }}
        >
          <Building2 className="h-4 w-4" />
          {saving ? "Salvataggio..." : "Salva infrastruttura"}
        </button>
      </div>
    </section>
  );
}
