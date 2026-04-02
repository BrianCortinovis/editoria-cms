"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
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
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

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

type MediaTypeFilter = "all" | "image" | "video" | "document";
type MediaSizeFilter = "all" | "small" | "medium" | "large";
type MediaOrientationFilter = "all" | "landscape" | "portrait" | "square";
type MediaSortFilter = "recent" | "oldest" | "name_asc" | "name_desc" | "size_desc" | "size_asc";

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

function getMediaType(mimeType: string): Exclude<MediaTypeFilter, "all"> {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

function getMediaOrientation(item: MediaItem): Exclude<MediaOrientationFilter, "all"> | null {
  if (!item.width || !item.height) return null;
  if (item.width === item.height) return "square";
  return item.width > item.height ? "landscape" : "portrait";
}

function getMediaSizeBucket(sizeBytes: number): Exclude<MediaSizeFilter, "all"> {
  if (sizeBytes < 1024 * 1024) return "small";
  if (sizeBytes <= 10 * 1024 * 1024) return "medium";
  return "large";
}

export default function MediaPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<MediaSizeFilter>("all");
  const [orientationFilter, setOrientationFilter] = useState<MediaOrientationFilter>("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<MediaSortFilter>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => null);
    return typeof payload?.error === "string" ? payload.error : fallback;
  }, []);

  const loadMedia = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const params = new URLSearchParams({ tenant_id: currentTenant.id });

    const response = await fetch(`/api/cms/media?${params.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Impossibile caricare i media"));
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { media?: MediaItem[] };
    setMedia(Array.isArray(payload.media) ? payload.media : []);
    setLoading(false);
  }, [currentTenant, readErrorMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMedia();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMedia]);

  const folderOptions = useMemo(() => {
    return Array.from(
      new Set(media.map((item) => (item.folder || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "it"));
  }, [media]);

  const filteredMedia = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = media.filter((item) => {
      if (normalizedSearch) {
        const haystack = [
          item.original_filename,
          item.filename,
          item.alt_text || "",
          item.folder || "",
          item.mime_type,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      if (typeFilter !== "all" && getMediaType(item.mime_type) !== typeFilter) return false;
      if (sizeFilter !== "all" && getMediaSizeBucket(item.size_bytes) !== sizeFilter) return false;
      if (orientationFilter !== "all" && getMediaOrientation(item) !== orientationFilter) return false;
      if (folderFilter !== "all" && (item.folder || "") !== folderFilter) return false;

      const createdAt = new Date(item.created_at);
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (createdAt < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (createdAt > to) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.original_filename.localeCompare(b.original_filename, "it");
        case "name_desc":
          return b.original_filename.localeCompare(a.original_filename, "it");
        case "size_asc":
          return a.size_bytes - b.size_bytes;
        case "size_desc":
          return b.size_bytes - a.size_bytes;
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [media, search, typeFilter, sizeFilter, orientationFilter, folderFilter, dateFrom, dateTo, sortBy]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !currentTenant) return;
    setUploading(true);
    let uploadedCount = 0;

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
      const formData = new FormData();
      formData.set("tenant_id", currentTenant.id);
      formData.set("tenant_slug", currentTenant.slug);
      formData.set("file", file);

      const response = await fetch("/api/cms/media/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        toast.error(`Errore upload ${file.name}: ${await readErrorMessage(response, "Upload non riuscito")}`);
      } else {
        uploadedCount += 1;
        toast.success(`${file.name} caricato`);
      }
    }

    setUploading(false);
    if (uploadedCount > 0) {
      await loadMedia();
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Eliminare ${item.original_filename}?`)) return;
    if (!currentTenant) return;

    const response = await fetch(`/api/cms/media/${item.id}?tenant_id=${encodeURIComponent(currentTenant.id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    if (!response.ok) {
      toast.error(await readErrorMessage(response, "Errore nell'eliminazione"));
      return;
    }

    toast.success("File eliminato");
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    if (selected?.id === item.id) setSelected(null);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiato!");
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSizeFilter("all");
    setOrientationFilter("all");
    setFolderFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("recent");
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm" style={{ color: "var(--c-text-2)" }}>{filteredMedia.length} / {media.length} file</p>
            <AIButton
              compact
              actions={[
                {
                  id: "media-audit",
                  label: "Audit media",
                  prompt: "Analizza libreria media, naming, alt text, peso file, formati e rischi editoriali/SEO di questo tenant. Restituisci checklist operativa: {context}",
                },
                {
                  id: "media-policy",
                  label: "Policy media",
                  prompt: "Prepara una policy pratica per redazione e tecnico su upload immagini, video, alt text, copertine e published media layer: {context}",
                },
                {
                  id: "gallery-brief",
                  label: "Brief gallery",
                  prompt: "Spiega come preparare una gallery pubblicabile bene nel CMS con immagini, titoli, alt, ordine e aspetti SEO: {context}",
                },
              ]}
              contextData={JSON.stringify({
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                mediaCount: media.length,
                selected,
                recentMedia: media.slice(0, 12).map((item) => ({
                  filename: item.original_filename,
                  mime: item.mime_type,
                  sizeBytes: item.size_bytes,
                  width: item.width,
                  height: item.height,
                  altText: item.alt_text,
                  folder: item.folder,
                })),
              }, null, 2)}
            />
          </div>
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

        <div className="mb-6 border-y" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex flex-wrap items-end gap-y-3 px-1 py-3 text-sm md:px-0">
            <div className="min-w-[220px] flex-1 px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Cerca
              </label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 shrink-0" style={{ color: "var(--c-text-3)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome file, alt, cartella, mime..."
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: "var(--c-text-0)" }}
                />
              </div>
            </div>

            <div className="min-w-[140px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Tipo
              </label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MediaTypeFilter)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }}>
                <option value="all">Tutti</option>
                <option value="image">Immagini</option>
                <option value="video">Video</option>
                <option value="document">Documenti</option>
              </select>
            </div>

            <div className="min-w-[150px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Dimensione
              </label>
              <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value as MediaSizeFilter)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }}>
                <option value="all">Qualsiasi</option>
                <option value="small">Sotto 1 MB</option>
                <option value="medium">1-10 MB</option>
                <option value="large">Oltre 10 MB</option>
              </select>
            </div>

            <div className="min-w-[140px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Formato
              </label>
              <select value={orientationFilter} onChange={(e) => setOrientationFilter(e.target.value as MediaOrientationFilter)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }}>
                <option value="all">Qualsiasi</option>
                <option value="landscape">Orizzontale</option>
                <option value="portrait">Verticale</option>
                <option value="square">Quadrato</option>
              </select>
            </div>

            <div className="min-w-[150px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Cartella
              </label>
              <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }}>
                <option value="all">Tutte</option>
                {folderOptions.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            </div>

            <div className="min-w-[140px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Dal
              </label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }} />
            </div>

            <div className="min-w-[140px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Al
              </label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }} />
            </div>

            <div className="min-w-[160px] px-3 md:border-r" style={{ borderColor: "var(--c-border)" }}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--c-text-3)" }}>
                Ordina
              </label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as MediaSortFilter)} className="w-full bg-transparent text-sm outline-none" style={{ color: "var(--c-text-0)" }}>
                <option value="recent">Più recenti</option>
                <option value="oldest">Più vecchi</option>
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
                <option value="size_desc">Peso maggiore</option>
                <option value="size_asc">Peso minore</option>
              </select>
            </div>

            <div className="px-3">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--c-accent)" }}
              >
                Pulisci filtri
              </button>
            </div>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl py-16 text-center" style={{ borderColor: "var(--c-border)" }}>
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
              <p className="text-sm mb-1" style={{ color: "var(--c-text-3)" }}>
                {media.length === 0 ? "Trascina i file qui o clicca \"Carica file\"" : "Nessun media trovato con i filtri attuali"}
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                {media.length === 0 ? "JPG, PNG, WebP, PDF, MP4 — max 50MB" : "Prova a cambiare data, tipo, dimensione o ricerca"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredMedia.map((item) => {
                const Icon = getMediaIcon(item.mime_type);
                const isImage = item.mime_type.startsWith("image/");
                return (
                  <div key={item.id} onClick={() => setSelected(item)}
                    className="group relative rounded-lg overflow-hidden cursor-pointer transition hover:shadow-md"
                    style={{
                      background: "var(--c-bg-1)",
                      border: selected?.id === item.id ? "2px solid var(--c-accent)" : "1px solid var(--c-border)",
                    }}>
                    <div className="aspect-square relative flex items-center justify-center" style={{ background: "var(--c-bg-2)" }}>
                      {isImage ? <Image src={item.thumbnail_url || item.url} alt={item.alt_text || item.original_filename} className="w-full h-full object-cover" fill unoptimized />
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
              {filteredMedia.map((item) => {
                const Icon = getMediaIcon(item.mime_type);
                return (
                  <div key={item.id} onClick={() => setSelected(item)}
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer transition"
                    style={selected?.id === item.id ? { background: "var(--c-bg-2)" } : undefined}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                    onMouseLeave={(e) => { if (selected?.id !== item.id) e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-10 h-10 rounded flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--c-bg-2)" }}>
                      {item.mime_type.startsWith("image/") ? <Image src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" width={40} height={40} unoptimized />
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
            {selected.mime_type.startsWith("image/") && <Image src={selected.url} alt="" className="w-full aspect-video object-cover" width={288} height={162} unoptimized />}
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
                {(currentRole === "admin" || currentRole === "chief_editor") && (
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
