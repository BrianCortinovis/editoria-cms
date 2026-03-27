"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { Tables } from "@/types/database";

export function ProfileSettingsForm({ profile }: { profile: Tables<"profiles"> | null }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    locale: profile?.locale || "it",
    timezone: profile?.timezone || "Europe/Rome",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/platform/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile salvare il profilo");
      }

      toast.success("Profilo aggiornato");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={form.first_name}
          onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
          placeholder="Nome"
          className="border-b px-0 py-3 text-sm outline-none"
          style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
        />
        <input
          value={form.last_name}
          onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
          placeholder="Cognome"
          className="border-b px-0 py-3 text-sm outline-none"
          style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
        />
      </div>
      <input
        value={form.full_name}
        onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
        placeholder="Nome completo pubblico"
        className="w-full border-b px-0 py-3 text-sm outline-none"
        style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={form.locale}
          onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
          className="border-b px-0 py-3 text-sm outline-none"
          style={{ background: "transparent", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
        >
          <option value="it">Italiano</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <input
          value={form.timezone}
          onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
          placeholder="Europe/Rome"
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
        {loading ? "Salvataggio..." : "Salva profilo"}
      </button>
    </form>
  );
}
