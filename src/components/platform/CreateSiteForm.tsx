"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { buildDefaultHostname } from "@/lib/platform/constants";

const templates = [
  { key: "newsroom", label: "Newsroom" },
  { key: "magazine", label: "Magazine" },
  { key: "business", label: "Business" },
];

export function CreateSiteForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    languageCode: "it",
    templateKey: "newsroom",
    category: "",
  });
  const [loading, setLoading] = useState(false);

  const previewSlug = form.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/platform/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile creare il sito");
      }

      toast.success("Sito creato con successo");
      router.push(`/app/sites/${payload.siteId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-5"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
            Nome sito
          </label>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Il Giornale di Bergamo"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
            Slug iniziale
          </label>
          <input
            required
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            placeholder="giornale-bergamo"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
            Template
          </label>
          <select
            value={form.templateKey}
            onChange={(event) => setForm((current) => ({ ...current, templateKey: event.target.value }))}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          >
            {templates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
            Lingua
          </label>
          <select
            value={form.languageCode}
            onChange={(event) => setForm((current) => ({ ...current, languageCode: event.target.value }))}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--c-text-1)" }}>
            Categoria
          </label>
          <input
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            placeholder="News locale"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
            style={{ background: "var(--c-bg-2)", borderColor: "var(--c-border)", color: "var(--c-text-0)" }}
          />
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", background: "rgba(124,138,170,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Globe className="h-4 w-4" style={{ color: "var(--c-accent-hover)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>
              Dominio di default
            </p>
            <p className="text-xs" style={{ color: "var(--c-text-2)" }}>
              {previewSlug ? buildDefaultHostname(previewSlug) : "editoria.localhost"}
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #8e9bba 0%, #6b7a9d 100%)" }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {loading ? "Creazione in corso..." : "Crea sito"}
      </button>
    </form>
  );
}
