"use client";

import { useEffect } from "react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Errore pagina pubblica:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Pagina non disponibile
      </h2>
      <p className="max-w-md text-sm text-gray-500">
        {error.digest
          ? `Codice errore: ${error.digest}`
          : "La pagina richiesta non è al momento disponibile. Riprova tra qualche istante."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-gray-800 px-5 py-2.5 text-sm text-white hover:bg-gray-700"
      >
        Riprova
      </button>
    </div>
  );
}
