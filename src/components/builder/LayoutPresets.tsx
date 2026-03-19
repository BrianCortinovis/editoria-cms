'use client';

// Stub — Layout presets for the builder
export function LayoutPresets({ open, onClose }: { open?: boolean; onClose: () => void }) {
  if (open === false) return null;
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-sm">Layout Predefiniti</h3>
      <p className="text-xs text-zinc-500">Funzionalità in arrivo</p>
      <button onClick={onClose} className="mt-3 text-xs text-zinc-400 hover:text-zinc-300">Chiudi</button>
    </div>
  );
}
