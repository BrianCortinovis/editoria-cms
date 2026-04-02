import { PlatformAISettings } from "@/components/platform/PlatformAISettings";

export default function PlatformProfileAiPage() {
  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Profilo Platform
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          IA e API
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Provider, modelli e chiavi API restano qui, separati dal CMS operativo.
        </p>
      </section>
      <PlatformAISettings />
    </div>
  );
}
