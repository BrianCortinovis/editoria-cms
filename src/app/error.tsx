"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Errore applicazione:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold">Si è verificato un errore</h2>
      <p className="text-muted-foreground text-sm">
        {error.digest
          ? `Codice errore: ${error.digest}`
          : "Si è verificato un errore imprevisto. Riprova più tardi."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        Riprova
      </button>
    </div>
  );
}
