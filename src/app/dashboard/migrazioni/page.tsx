"use client";

import { Database, Bot, Route, ShieldCheck } from "lucide-react";
import { WordPressMigrationPanel } from "@/components/panels/WordPressMigrationPanel";

export default function MigrazioniPage() {
  return (
    <div className="max-w-6xl space-y-5">
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-2)" }}>
              Strumenti Tecnici
            </p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
              Migrazione WordPress assistita
            </h1>
            <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--c-text-1)" }}>
              Importa archivi WordPress in modo graduale e controllato. Puoi analizzare il file prima,
              lavorare per anno o per lotti, eseguire il batch reale e usare l&apos;IA per ricevere
              suggerimenti operativi, checklist tecniche e strategia di migrazione.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[280px]">
            <FeatureBadge icon={Database} title="Batch manuali" description="Offset, limite e filtri per anno." />
            <FeatureBadge icon={Bot} title="Supporto IA" description="Piano di migrazione e checklist." />
            <FeatureBadge icon={Route} title="Dry run" description="Anteprima completa prima di scrivere." />
            <FeatureBadge icon={ShieldCheck} title="Import sicuro" description="Controlli tenant e ruoli lato server." />
          </div>
        </div>
      </div>

      <div className="card" style={{ minHeight: "720px", display: "flex", flexDirection: "column" }}>
        <WordPressMigrationPanel />
      </div>
    </div>
  );
}

function FeatureBadge({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: "var(--c-bg-1)", borderColor: "var(--c-border)" }}>
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--c-accent-soft)", color: "var(--c-accent)" }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold" style={{ color: "var(--c-text-0)" }}>
            {title}
          </p>
          <p className="text-[11px] leading-5" style={{ color: "var(--c-text-2)" }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
