export default function BillingPage() {
  const plans = [
    {
      name: "Base",
      price: "49€/mese",
      desc: "Per singoli progetti o piccole redazioni che lavorano bene sul setup condiviso.",
      points: ["CMS condiviso", "Storage piattaforma", "Setup rapido"],
    },
    {
      name: "Pro",
      price: "99€/mese",
      desc: "Più spazio operativo, più team e più margine per redazioni in crescita.",
      points: ["Team esteso", "Più siti e moduli", "Workflow più completi"],
    },
    {
      name: "Enterprise",
      price: "199€/mese",
      desc: "Può restare sul setup condiviso oppure attivare isolamento dedicato per cliente.",
      points: ["Shared o dedicated", "Vercel / Supabase / R2 dedicati", "Provider newsletter isolati"],
    },
  ];

  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Billing
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Il piano commerciale resta separato dall&apos;infrastruttura tecnica: solo Enterprise puo`
          attivare isolamento dedicato, ma puo` anche rimanere sul setup condiviso.
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="rounded-[2rem] border p-6"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--c-text-2)" }}>
              {plan.name}
            </p>
            <p className="mt-4 text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              {plan.price}
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
              {plan.desc}
            </p>
            <div className="mt-5 space-y-2 text-sm" style={{ color: "var(--c-text-1)" }}>
              {plan.points.map((point) => (
                <p key={point}>• {point}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
      <section className="rounded-3xl border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
          Nota infrastruttura
        </p>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Se un cliente Enterprise attiva l&apos;isolamento dal profilo sito, la Platform UI apre i
          box per Vercel, Supabase, Cloudflare R2 e provider newsletter dedicati. Se non lo attiva,
          il tenant continua a lavorare sul runtime condiviso.
        </p>
      </section>
    </div>
  );
}
