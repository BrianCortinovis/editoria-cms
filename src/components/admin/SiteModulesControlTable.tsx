"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { SuperadminSiteRow } from "@/lib/superadmin/service";
import { AVAILABLE_MODULES, type ModuleId } from "@/lib/modules";

type DraftMap = Record<string, string[]>;

function sortModules(modules: string[]) {
  return [...new Set(modules)].sort((left, right) => left.localeCompare(right));
}

export function SiteModulesControlTable({ sites }: { sites: SuperadminSiteRow[] }) {
  const [savingSiteId, setSavingSiteId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftMap>(() =>
    Object.fromEntries(
      sites.map((site) => [site.siteId, sortModules(site.activeModules)]),
    ),
  );

  const sortedSites = useMemo(
    () => [...sites].sort((left, right) => left.name.localeCompare(right.name, "it")),
    [sites],
  );

  const toggleModule = (siteId: string, moduleId: ModuleId) => {
    setDrafts((current) => {
      const existing = current[siteId] || [];
      const next = existing.includes(moduleId)
        ? existing.filter((item) => item !== moduleId)
        : [...existing, moduleId];

      return {
        ...current,
        [siteId]: sortModules(next),
      };
    });
  };

  const saveSite = async (siteId: string) => {
    setSavingSiteId(siteId);
    const response = await fetch(`/api/admin/sites/${siteId}/modules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        activeModules: drafts[siteId] || [],
      }),
    });
    setSavingSiteId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(typeof payload?.error === "string" ? payload.error : "Impossibile salvare i moduli");
      return;
    }

    toast.success("Moduli tenant aggiornati");
    window.location.reload();
  };

  return (
    <div className="border-y" style={{ borderColor: "var(--c-border)" }}>
      {sortedSites.map((site) => (
        <article key={site.siteId} className="border-b px-4 py-4 last:border-b-0" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>{site.name}</h3>
              <p className="mt-1 text-xs" style={{ color: "var(--c-text-2)" }}>
                {site.slug} · {site.planCode || "free"} · {site.primaryDomain || "nessun dominio"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "var(--c-text-3)" }}>Moduli attivi</p>
              <p className="mt-1 text-sm" style={{ color: "var(--c-text-1)" }}>
                {(drafts[site.siteId] || []).length > 0 ? (drafts[site.siteId] || []).join(", ") : "nessuno"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {AVAILABLE_MODULES.map((module) => {
              const active = (drafts[site.siteId] || []).includes(module.id);
              return (
                <label
                  key={`${site.siteId}-${module.id}`}
                  className="flex items-start gap-3 border-b pb-3 text-sm"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text-1)" }}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleModule(site.siteId, module.id)}
                  />
                  <span>
                    <span className="block font-semibold" style={{ color: "var(--c-text-0)" }}>{module.name}</span>
                    <span className="mt-1 block text-xs" style={{ color: "var(--c-text-2)" }}>{module.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => saveSite(site.siteId)}
              disabled={savingSiteId === site.siteId}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--c-accent)" }}
            >
              {savingSiteId === site.siteId ? "Salvataggio..." : "Salva moduli"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
