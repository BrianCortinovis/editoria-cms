"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Image as ImageIcon,
  Film,
  FileText,
  Loader2,
  Grid3X3,
  List,
  X,
  FolderOpen,
} from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  folder: string | null;
  created_at: string;
}

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const ALLOWED_MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "pdf"]);

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getMediaIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  return FileText;
}

export default function MediaPage() {
  const { currentTenant, currentRole, user } = useAuthStore();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();

    let query = supabase
      .from("media")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("original_filename", `%${search}%`);
    }

    const { data } = await query.limit(100);
    if (data) setMedia(data);
    setLoading(false);
  }, [currentTenant, search]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !currentTenant || !user) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type) || !ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
        toast.error(`Tipo file non consentito: ${file.name}`);
        continue;
      }

      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        toast.error(`${file.name} supera il limite di 50MB`);
        continue;
      }

      if (file.type === "image/svg+xml" || ext === "svg" || ext === "html" || ext === "htm") {
        toast.error(`Formato non consentito per sicurezza: ${file.name}`);
        continue;
      }

      const filename = `${currentTenant.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filename, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error(`Errore upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(filename);

      // Get image dimensions if applicable
      let width: number | null = null;
      let height: number | null = null;

      if (file.type.startsWith("image/")) {
        const img = new window.Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            width = img.naturalWidth;
            height = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = URL.createObjectURL(file);
        });
      }

      // Save to database
      const { error: dbError } = await supabase.from("media").insert({
        tenant_id: currentTenant.id,
        filename,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        width,
        height,
        url: urlData.publicUrl,
        thumbnail_url: file.type.startsWith("image/") ? urlData.publicUrl : null,
        uploaded_by: user.id,
      });

      if (dbError) {
        toast.error(`Errore DB ${file.name}: ${dbError.message}`);
      } else {
        toast.success(`${file.name} caricato`);
      }
    }

    setUploading(false);
    loadMedia();
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Eliminare ${item.original_filename}?`)) return;
    const supabase = createClient();

    // Delete from storage
    await supabase.storage.from("media").remove([item.filename]);

    // Delete from DB
    const { error } = await supabase.from("media").delete().eq("id", item.id);
    if (error) {
      toast.error("Errore nell'eliminazione");
    } else {
      toast.success("File eliminato");
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiato!");
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{media.length} file</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition"
              style={{ border: "1px solid var(--c-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {viewMode === "grid" ? (
                <List className="w-4 h-4" style={{ color: "var(--c-text-2)" }} />
              ) : (
                <Grid3X3 className="w-4 h-4" style={{ color: "var(--c-text-2)" }} />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Carica file
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-3)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca file..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: "1px solid var(--c-border)" }} />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
            </div>
          ) : media.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl py-16 text-center" style={{ borderColor: "var(--c-border)" }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
              <p className="text-sm mb-1" style={{ color: "var(--c-text-3)" }}>Trascina i file qui o clicca &quot;Carica file&quot;</p>
              <p className="text-xs" style={{ color: "var(--c-text-3)" }}>JPG, PNG, WebP, PDF, MP4 — max 50MB</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {media.map((item) => {
                const Icon = getMediaIcon(item.mime_type);
                const isImage = item.mime_type.startsWith("image/");
                return (
                  <div key={item.id} onClick={() => setSelected(item)}
                    className="group relative rounded-lg overflow-hidden cursor-pointer transition hover:shadow-md"
                    style={{
                      background: "var(--c-bg-1)",
                      border: selected?.id === item.id ? "2px solid var(--c-accent)" : "1px solid var(--c-border)",
                    }}>
                    <div className="aspect-square flex items-center justify-center" style={{ background: "var(--c-bg-2)" }}>
                      {isImage ? <img src={item.thumbnail_url || item.url} alt={item.alt_text || item.original_filename} className="w-full h-full object-cover" />
                        : <Icon className="w-10 h-10" style={{ color: "var(--c-text-3)" }} />}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-xs truncate" style={{ color: "var(--c-text-1)" }}>{item.original_filename}</p>
                      <p className="text-[10px]" style={{ color: "var(--c-text-3)" }}>{formatBytes(item.size_bytes)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg divide-y" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)", borderColor: "var(--c-border)" }}>
              {media.map((item) => {
                const Icon = getMediaIcon(item.mime_type);
                return (
                  <div key={item.id} onClick={() => setSelected(item)}
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer transition"
                    style={selected?.id === item.id ? { background: "var(--c-bg-2)" } : undefined}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => { if (selected?.id !== item.id) e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--c-bg-2)" }}>
                      {item.mime_type.startsWith("image/") ? <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                        : <Icon className="w-5 h-5" style={{ color: "var(--c-text-3)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--c-text-0)" }}>{item.original_filename}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                        {formatBytes(item.size_bytes)}{item.width && ` · ${item.width}×${item.height}`}{` · ${new Date(item.created_at).toLocaleDateString("it-IT")}`}
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                      className="w-8 h-8 flex items-center justify-center rounded transition"
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-3)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <Copy className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-72 shrink-0 hidden xl:block">
          <div className="rounded-lg overflow-hidden sticky top-[84px]" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Dettagli</span>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} /></button>
            </div>
            {selected.mime_type.startsWith("image/") && <img src={selected.url} alt="" className="w-full aspect-video object-cover" />}
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Nome file</p>
                <p className="truncate" style={{ color: "var(--c-text-0)" }}>{selected.original_filename}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Tipo</p>
                <p style={{ color: "var(--c-text-1)" }}>{selected.mime_type}</p>
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Dimensione</p>
                <p style={{ color: "var(--c-text-1)" }}>{formatBytes(selected.size_bytes)}</p>
              </div>
              {selected.width && (
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Risoluzione</p>
                  <p style={{ color: "var(--c-text-1)" }}>{selected.width} x {selected.height}px</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Data</p>
                <p style={{ color: "var(--c-text-1)" }}>{new Date(selected.created_at).toLocaleString("it-IT")}</p>
              </div>
              <div className="pt-2 space-y-2">
                <button onClick={() => copyUrl(selected.url)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition"
                  style={{ border: "1px solid var(--c-border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <Copy className="w-4 h-4" /> Copia URL
                </button>
                {(currentRole === "super_admin" || currentRole === "chief_editor") && (
                  <button onClick={() => handleDelete(selected)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 rounded-lg text-sm font-medium transition"
                    style={{ border: "1px solid var(--c-danger)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <Trash2 className="w-4 h-4" /> Elimina
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
