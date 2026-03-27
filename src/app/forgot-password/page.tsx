"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/app/security`,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--c-bg-0)" }}>
      <div className="mx-auto max-w-lg rounded-[2rem] border p-8" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Reimposta password
        </h1>
        <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
          Ti invieremo un link sicuro per impostare una nuova password.
        </p>
        {sent ? (
          <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-2)" }}>
            <p className="text-sm" style={{ color: "var(--c-text-0)" }}>
              Email inviata a {email}. Apri il link e verrai riportato nella sezione sicurezza della Platform App.
            </p>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
            />
            {error ? <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p> : null}
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
              <Mail className="h-4 w-4" />
              Invia link di reset
            </button>
          </form>
        )}
        <p className="mt-5 text-sm" style={{ color: "var(--c-text-2)" }}>
          <Link href="/login" style={{ color: "var(--c-accent-hover)" }}>Torna al login</Link>
        </p>
      </div>
    </main>
  );
}
