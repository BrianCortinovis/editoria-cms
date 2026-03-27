"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export function SecuritySettings() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("La password deve avere almeno 8 caratteri");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setPassword("");
      setConfirmPassword("");
      toast.success("Password aggiornata");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }

  async function logoutOtherDevices() {
    setSigningOutOthers(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast.success("Altri dispositivi disconnessi");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setSigningOutOthers(false);
    }
  }

  async function logoutCurrentDevice() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={updatePassword} className="space-y-4 border-b pb-5" style={{ borderColor: "var(--c-border)" }}>
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text-0)" }}>
            Aggiorna password
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
            La tua password viene aggiornata direttamente tramite Supabase Auth.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nuova password"
            className="border-b px-0 py-3 text-sm outline-none"
            style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Conferma password"
            className="border-b px-0 py-3 text-sm outline-none"
            style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "var(--c-accent)" }}
        >
          {loading ? "Aggiornamento..." : "Aggiorna password"}
        </button>
      </form>

      <div className="divide-y border-y" style={{ borderColor: "var(--c-border)" }}>
        <button
          type="button"
          onClick={logoutOtherDevices}
          disabled={signingOutOthers}
          className="px-0 py-4 text-left transition disabled:opacity-60"
          style={{ color: "var(--c-text-0)" }}
        >
          <span className="block text-sm font-semibold">Logout altri dispositivi</span>
          <span className="mt-1 block text-sm" style={{ color: "var(--c-text-2)" }}>
            {signingOutOthers ? "Chiusura sessioni..." : "Mantieni attiva solo questa sessione"}
          </span>
        </button>
        <button
          type="button"
          onClick={logoutCurrentDevice}
          className="px-0 py-4 text-left transition"
          style={{ color: "var(--c-danger)" }}
        >
          <span className="block text-sm font-semibold">Logout</span>
          <span className="mt-1 block text-sm" style={{ color: "var(--c-text-2)" }}>
            Disconnetti la sessione corrente
          </span>
        </button>
      </div>
    </div>
  );
}
