export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "radial-gradient(circle at top left, rgba(124,138,170,0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(124,138,170,0.12), transparent 28%), var(--c-bg-0)" }}>
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--c-text-2)" }}>
              Multi-tenant Platform
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02]" style={{ color: "var(--c-text-0)" }}>
              L&apos;infrastruttura che viene prima del CMS: account, siti, domini, permessi e accesso sicuro.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8" style={{ color: "var(--c-text-1)" }}>
              Costruita per orchestrare la piattaforma editoriale completa: registrazione utente, creazione tenant, domini custom, billing-ready e bridge controllato verso il CMS del singolo sito.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/register" className="rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                Inizia ora
              </a>
              <a href="/pricing" className="rounded-full border px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}>
                Vedi pricing
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: "Platform App",
                copy: "Onboarding utenti, my sites, domini, profilo, security e billing placeholder.",
              },
              {
                title: "CMS Bridge",
                copy: "Ingresso controllato al CMS con membership validata lato server e tenant context corretto.",
              },
              {
                title: "Domain Resolution",
                copy: "Host -> site_id -> tenant_id con unicita` globale del dominio e fallback legacy.",
              },
            ].map((card) => (
              <article key={card.title} className="rounded-[2rem] border p-6" style={{ borderColor: "var(--c-border)", background: "rgba(28,28,31,0.9)" }}>
                <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>{card.title}</h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>{card.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
