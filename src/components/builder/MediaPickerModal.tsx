"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Search, ImageIcon } from "lucide-react";

interface MediaPickerModalProps {
  tenantId: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaPickerModal({ tenantId, onSelect, onClose }: MediaPickerModalProps) {
  const [media, setMedia] = useState<Array<{ id: string; url: string; original_filename: string; mime_type: string; thumbnail_url: string | null }>>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ tenant_id: tenantId });
      if (search) params.set("search", search);
      const res = await fetch(`/api/cms/media?${params}`);
      const data = await res.json();
      setMedia(data.media || []);
      setLoading(false);
    };
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [tenantId, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--c-bg-1)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Media Library</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-2)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cerca..."
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--c-bg-0)", border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
              />
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-black/10">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--c-text-2)" }}>Caricamento...</p>
          ) : media.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon size={32} className="mx-auto mb-2" style={{ color: "var(--c-text-2)" }} />
              <p className="text-sm" style={{ color: "var(--c-text-2)" }}>Nessun media trovato</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {media.filter(m => m.mime_type?.startsWith("image/")).map(m => (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m.url); onClose(); }}
                  className="group relative aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-blue-500 transition"
                  style={{ border: "1px solid var(--c-border)" }}
                >
                  <Image
                    src={m.thumbnail_url || m.url}
                    alt={m.original_filename}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{m.original_filename}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
