"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        data: {
          full_name: form.fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/app/onboarding");
      router.refresh();
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "radial-gradient(circle at top right, rgba(124,138,170,0.16), transparent 30%), var(--c-bg-0)" }}>
      <div className="mx-auto max-w-xl rounded-[2rem] border p-8" style={{ borderColor: "var(--c-border)", background: "rgba(28,28,31,0.92)" }}>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Crea il tuo account platform
        </h1>
        <p className="mt-2 text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
          Da qui controllerai onboarding, siti, domini, accessi e il bridge sicuro verso il CMS.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            required
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            placeholder="Nome e cognome"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@company.com"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Password di almeno 8 caratteri"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
          {error ? <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p> : null}
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Crea account
          </button>
        </form>

        <p className="mt-5 text-sm" style={{ color: "var(--c-text-2)" }}>
          Hai gia` un account? <Link href="/login" style={{ color: "var(--c-accent-hover)" }}>Accedi</Link>
        </p>
      </div>
    </main>
  );
}
