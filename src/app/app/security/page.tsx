import { SecuritySettings } from "@/components/platform/SecuritySettings";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <section className="border-b pb-4" style={{ borderColor: "var(--c-border)" }}>
        <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Sicurezza
        </h2>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
          Qui gestisci password e sessioni. La struttura dati supporta anche audit logs e session tracking esteso, quindi possiamo evolvere facilmente verso 2FA e session inventory completa.
        </p>
      </section>
      <section className="border-y py-4" style={{ borderColor: "var(--c-border)" }}>
        <SecuritySettings />
      </section>
    </div>
  );
}
