export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--c-bg-0)" }}>
      <div className="mx-auto max-w-2xl rounded-[2rem] border p-8" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Verifica la tua email
        </h1>
        <p className="mt-4 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
          Abbiamo inviato un link di conferma a {email || "il tuo indirizzo email"}. Dopo la verifica verrai riportato alla Platform App e potrai iniziare l&apos;onboarding del primo sito.
        </p>
      </div>
    </main>
  );
}
