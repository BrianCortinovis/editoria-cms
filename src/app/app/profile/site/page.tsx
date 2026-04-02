import { PlatformSiteSettings } from "@/components/platform/PlatformSiteSettings";

export default function PlatformProfileSitePage() {
  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
          Profilo Platform
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: "var(--c-text-0)" }}>
          Sito, identità, SEO e analytics
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Qui gestisci i parametri strutturali del tenant attivo, separati dal CMS operativo.
        </p>
      </section>
      <PlatformSiteSettings />
    </div>
  );
}
