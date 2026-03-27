"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function loginWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "radial-gradient(circle at top left, rgba(124,138,170,0.18), transparent 35%), var(--c-bg-0)" }}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em]" style={{ borderColor: "var(--c-border)", color: "var(--c-text-2)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Platform Login
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.05]" style={{ color: "var(--c-text-0)" }}>
            Accedi alla piattaforma che crea, protegge e orchestra i tuoi CMS multi-tenant.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8" style={{ color: "var(--c-text-1)" }}>
            Gestisci siti, domini, permessi e billing da un&apos;unica dashboard, poi entra nel CMS giusto con contesto tenant sicuro lato server.
          </p>
        </section>

        <section className="rounded-[2rem] border p-7" style={{ borderColor: "var(--c-border)", background: "rgba(28,28,31,0.92)", boxShadow: "0 40px 120px rgba(0,0,0,0.28)" }}>
          {sent ? (
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
                Controlla la tua email
              </h2>
              <p className="text-sm leading-7" style={{ color: "var(--c-text-1)" }}>
                Ti abbiamo inviato un link di accesso a {email}. Aprilo per entrare direttamente nella Platform App.
              </p>
            </div>
          ) : mode === "password" ? (
            <form className="space-y-4" onSubmit={loginWithPassword}>
              <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>Accedi</h2>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              />
              {error ? <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p> : null}
              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Entra nella dashboard
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setMode("magic")} style={{ color: "var(--c-text-2)" }}>
                  Usa magic link
                </button>
                <Link href="/forgot-password" style={{ color: "var(--c-accent-hover)" }}>
                  Password dimenticata?
                </Link>
              </div>
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
                Non hai un account? <Link href="/register" style={{ color: "var(--c-accent-hover)" }}>Registrati</Link>
              </p>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={sendMagicLink}>
              <h2 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>Magic Link</h2>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
              />
              {error ? <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p> : null}
              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white" style={{ background: "var(--c-accent)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Invia link
              </button>
              <button type="button" onClick={() => setMode("password")} className="text-sm" style={{ color: "var(--c-text-2)" }}>
                Torna alla password
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
