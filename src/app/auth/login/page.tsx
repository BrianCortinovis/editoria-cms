"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, Newspaper, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--c-bg-0)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4"
            style={{ background: "var(--c-accent)" }}
          >
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--c-text-0)" }}>
            Editoria CMS
          </h1>
          <p className="mt-2" style={{ color: "var(--c-text-2)" }}>
            Accedi alla redazione
          </p>
        </div>

        <div className="rounded-xl p-8" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>
                Controlla la tua email
              </h2>
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
                Abbiamo inviato un link di accesso a{" "}
                <strong style={{ color: "var(--c-text-1)" }}>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm hover:underline"
                style={{ color: "var(--c-accent)" }}
              >
                Usa un&apos;altra email
              </button>
            </div>
          ) : mode === "password" ? (
            <form onSubmit={handlePasswordLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--c-text-2)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="redattore@testata.it"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", boxShadow: "var(--c-accent) 0 0 0 0px" }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 2px`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 0px`}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--c-text-2)" }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", boxShadow: "var(--c-accent) 0 0 0 0px" }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 2px`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 0px`}
                />
              </div>

              {error && (
                <p className="mb-3 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                style={{ background: "var(--c-accent)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {loading ? "Accesso in corso..." : "Accedi"}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setError(""); }}
                  className="text-sm transition"
                  style={{ color: "var(--c-text-2)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-accent)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-2)"}
                >
                  Accedi con Magic Link
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleMagicLink}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--c-text-2)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="redattore@testata.it"
                required
                className="w-full px-4 py-3 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)", boxShadow: "var(--c-accent) 0 0 0 0px" }}
                onFocus={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 2px`}
                onBlur={(e) => e.currentTarget.style.boxShadow = `var(--c-accent) 0 0 0 0px`}
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 px-4 py-3 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                style={{ background: "var(--c-accent)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {loading ? "Invio in corso..." : "Invia Magic Link"}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode("password"); setError(""); }}
                  className="text-sm transition"
                  style={{ color: "var(--c-text-2)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-accent)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-2)"}
                >
                  Accedi con password
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--c-text-3)" }}>
          Editoria CMS — Sistema editoriale multi-testata
        </p>
      </div>
    </div>
  );
}
