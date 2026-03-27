import { CreateSiteForm } from "@/components/platform/CreateSiteForm";

export default function NewSitePage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--c-text-2)" }}>
          Create Site
        </p>
        <h2 className="mt-3 text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Nuovo sito
        </h2>
      </section>
      <section className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <CreateSiteForm />
      </section>
    </div>
  );
}
