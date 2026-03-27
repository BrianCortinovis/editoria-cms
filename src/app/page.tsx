const pillars = [
  {
    label: "Platform",
    title: "Accesso, siti, domini e team prima del CMS.",
    copy:
      "ALPSite gestisce account, onboarding, siti, domini e permessi in un punto unico, con ingresso al CMS gia` filtrato per membership e tenant corretto.",
  },
  {
    label: "CMS",
    title: "Contenuti, SEO, analytics e pubblicazione controllata.",
    copy:
      "Ogni sito entra nel proprio CMS con contesto gia` risolto, workflow redazionale separato e publish governato senza mischiare editor desktop e piattaforma online.",
  },
  {
    label: "Infra",
    title: "Shared, dedicated, VPS cliente e controllo operativo.",
    copy:
      "La piattaforma resta unica, ma puoi governare storage, domini, deploy target, cron, sicurezza tenant e publish state dal control plane.",
  },
];

const metrics = [
  { value: "1", label: "platform app" },
  { value: "1", label: "cloud cms" },
  { value: "N", label: "siti isolati" },
  { value: "24/7", label: "accesso governato" },
];

export default function Home() {
  return (
    <main
      className="min-h-screen px-6 py-8 md:px-8 md:py-10"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(92, 124, 250, 0.1), transparent 30%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.08), transparent 28%), var(--c-bg-0)",
      }}
    >
      <section className="mx-auto max-w-6xl border border-transparent">
        <div
          className="grid gap-10 border-b pb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:gap-14"
          style={{ borderColor: "var(--c-border)" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <img src="/alpsite-logo.svg" alt="ALPSite" className="h-14 w-14 shrink-0 rounded-2xl" />
              <div>
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: "var(--c-text-2)" }}
                >
                  Alpine Publishing Platform
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-[-0.04em]" style={{ color: "var(--c-text-0)" }}>
                  ALPSite
                </div>
              </div>
            </div>

            <h1
              className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] md:text-6xl"
              style={{ color: "var(--c-text-0)" }}
            >
              La piattaforma che governa account, siti, domini e accesso sicuro prima di entrare nel CMS.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-9" style={{ color: "var(--c-text-1)" }}>
              ALPSite unifica Platform App, Cloud CMS e control plane operativo in una struttura pulita: identita`,
              tenant, domini, sicurezza, routing verso il CMS e gestione multi-sito senza sovrapporre il builder desktop.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/register"
                className="inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-white transition"
                style={{ background: "var(--c-accent)" }}
              >
                Inizia ora
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center rounded-full border px-5 py-3 text-sm font-semibold transition"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              >
                Vedi pricing
              </a>
            </div>

            <div
              className="mt-10 grid gap-0 border-y py-4 sm:grid-cols-4"
              style={{ borderColor: "var(--c-border)" }}
            >
              {metrics.map((item, index) => (
                <div
                  key={item.label}
                  className={`px-0 py-3 sm:px-4 ${index > 0 ? "sm:border-l" : ""}`}
                  style={index > 0 ? { borderColor: "var(--c-border)" } : undefined}
                >
                  <div className="text-2xl font-semibold tracking-[-0.04em]" style={{ color: "var(--c-text-0)" }}>
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="border-l pl-0 lg:pl-8"
            style={{ borderColor: "var(--c-border)" }}
          >
            <div className="space-y-0 border-y" style={{ borderColor: "var(--c-border)" }}>
              {pillars.map((item, index) => (
                <article
                  key={item.title}
                  className={`py-5 ${index > 0 ? "border-t" : ""}`}
                  style={index > 0 ? { borderColor: "var(--c-border)" } : undefined}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-text-2)" }}>
                    {item.label}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold leading-8" style={{ color: "var(--c-text-0)" }}>
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
