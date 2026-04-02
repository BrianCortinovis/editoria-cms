import { PlatformTeamSettings } from "@/components/platform/PlatformTeamSettings";

export default function PlatformProfileTeamPage() {
  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Profilo Platform
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Team
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Gestisci membri, ruoli e accessi del tenant attivo da una sezione dedicata.
        </p>
      </section>
      <PlatformTeamSettings />
    </div>
  );
}
