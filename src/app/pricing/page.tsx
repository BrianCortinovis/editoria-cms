import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--c-bg-0)" }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold" style={{ color: "var(--c-text-0)" }}>
            Piani pronti per partire ora, con struttura dati gia` compatibile con billing reale.
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { name: "Base", price: "€49", desc: "Setup condiviso, bootstrap rapido, domini custom e gestione editoriale completa." },
            { name: "Pro", price: "€99", desc: "Più margine operativo per redazioni in crescita, più team e più spazio di lavoro." },
            { name: "Enterprise", price: "€199", desc: "Può restare shared oppure attivare isolamento dedicato con Vercel, Supabase, R2 e servizi propri." },
          ].map((plan) => (
            <article key={plan.name} className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>{plan.name}</p>
              <p className="mt-4 text-4xl font-semibold" style={{ color: "var(--c-text-0)" }}>{plan.price}</p>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>{plan.desc}</p>
              <Link href="/register" className="mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                Inizia
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
