"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Errore dashboard:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold">
        Errore nel caricamento della dashboard
      </h2>
      <p className="text-muted-foreground text-sm">
        {error.digest
          ? `Codice errore: ${error.digest}`
          : "Errore imprevisto durante il caricamento."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Riprova
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
