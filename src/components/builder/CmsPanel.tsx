'use client';

// Content Picker — browse CMS content to insert into blocks
export function CmsPanel({ open, onClose }: { open?: boolean; onClose: () => void }) {
  if (open === false) return null;
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-sm">Contenuti CMS</h3>
      <p className="text-xs text-zinc-500">Seleziona articoli, categorie o media da inserire nei blocchi</p>
      <button onClick={onClose} className="mt-3 text-xs text-zinc-400 hover:text-zinc-300">Chiudi</button>
    </div>
  );
}
