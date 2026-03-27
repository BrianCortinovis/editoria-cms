export default function BillingPage() {
  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Billing
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          La piattaforma e` pronta per collegare Stripe o un provider equivalente. Intanto il layer dati tiene traccia di piano attuale, limiti e trial.
        </p>
      </section>
      <section className="border-y" style={{ borderColor: "var(--c-border)" }}>
        <div className="grid gap-0 md:grid-cols-2">
          {[
            { label: "Piano", value: "Free Trial" },
            { label: "Siti inclusi", value: "1" },
            { label: "Storage", value: "1 GB" },
            { label: "Team", value: "3 membri" },
          ].map((item) => (
            <div key={item.label} className="border-b px-4 py-3 md:border-r even:md:border-r-0 [&:nth-last-child(-n+2)]:md:border-b-0" style={{ borderColor: "var(--c-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
