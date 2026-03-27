"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Shield, Star, Trash2 } from "lucide-react";
import type { Tables } from "@/types/database";

export function DomainManager({
  siteId,
  domains,
}: {
  siteId: string;
  domains: Tables<"site_domains">[];
}) {
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshAfter(request: Promise<Response>, successMessage: string) {
    setLoading(true);
    try {
      const response = await request;
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Operazione non riuscita");
      }

      toast.success(successMessage);
      setHostname("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
            Collega un dominio esistente
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
            Il dominio verra` verificato via DNS e potra` diventare il primary domain del sito.
          </p>
        </div>

        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void refreshAfter(
              fetch(`/api/platform/sites/${siteId}/domains`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ hostname, isPrimary: false }),
              }),
              "Dominio aggiunto"
            );
          }}
        >
          <input
            required
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
            placeholder="www.miosito.it"
            className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "var(--c-accent)" }}
          >
            {loading ? "Attendo..." : "Aggiungi dominio"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="rounded-3xl border p-5"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>
                    {domain.hostname}
                  </h4>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "rgba(124,138,170,0.1)", color: "var(--c-accent-hover)" }}>
                    {domain.kind === "platform_subdomain" ? "Default" : domain.status}
                  </span>
                  {domain.is_primary ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(78,202,106,0.12)", color: "var(--c-success)" }}>
                      <Star className="h-3 w-3" />
                      Primary
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  {Array.isArray(domain.dns_records) && domain.dns_records.length > 0 ? (
                    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                        DNS richiesto
                      </p>
                      <div className="space-y-2 text-xs" style={{ color: "var(--c-text-1)" }}>
                        {domain.dns_records.map((record, index) => {
                          const entry = record as Record<string, string>;
                          return (
                            <div key={`${domain.id}-${index}`} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--c-border)" }}>
                              <span className="font-semibold">{entry.type}</span> {entry.name} {"->"} {entry.value}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <p className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--c-text-2)" }}>
                    <Shield className="h-4 w-4" />
                    SSL: {domain.ssl_status}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    void refreshAfter(
                      fetch(`/api/platform/sites/${siteId}/domains/${domain.id}/verify`, { method: "POST" }),
                      "Verifica avviata"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verifica
                </button>
                {!domain.is_primary ? (
                  <button
                    type="button"
                    disabled={loading || domain.status !== "active"}
                    onClick={() =>
                      void refreshAfter(
                        fetch(`/api/platform/sites/${siteId}/domains/${domain.id}/primary`, { method: "POST" }),
                        "Dominio primario aggiornato"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50"
                    style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
                  >
                    <Star className="h-4 w-4" />
                    Rendi primario
                  </button>
                ) : null}
                {domain.kind !== "platform_subdomain" ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void refreshAfter(
                        fetch(`/api/platform/sites/${siteId}/domains/${domain.id}`, { method: "DELETE" }),
                        "Dominio rimosso"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition"
                    style={{ borderColor: "rgba(224,82,82,0.25)", color: "var(--c-danger)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Rimuovi
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
