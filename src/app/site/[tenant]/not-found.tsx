import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Pagina non trovata
      </h2>
      <p className="max-w-md text-sm text-gray-500">
        La pagina che stai cercando non esiste o è stata rimossa.
      </p>
      <Link
        href="/"
        className="rounded-md bg-gray-800 px-5 py-2.5 text-sm text-white hover:bg-gray-700"
      >
        Torna alla home
      </Link>
    </div>
  );
}
