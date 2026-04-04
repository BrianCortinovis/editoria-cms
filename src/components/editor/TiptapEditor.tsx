"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImagePlus,
  Undo,
  Redo,
  Code,
  Video,
  FileCode,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  Loader2,
  Minus,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: () => void;
  placeholder?: string;
  toolbarMode?: "compact" | "expanded";
}

export interface TiptapEditorHandle {
  insertHtml: (html: string) => void;
  focus: () => void;
}

type TextBlockStyle = "paragraph" | "h1" | "h2" | "h3";

function imageStyleForAlign(align: "full" | "left" | "right" | "center") {
  const styleMap: Record<"full" | "left" | "right" | "center", string> = {
    full: "display:block;width:100%;margin:16px 0;",
    center: "display:block;max-width:80%;margin:16px auto;",
    left: "float:left;max-width:50%;margin:0 16px 8px 0;",
    right: "float:right;max-width:50%;margin:0 0 8px 16px;",
  };

  return styleMap[align];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildUploadedMediaHtml(url: string, fileName: string, mimeType: string) {
  const safeUrl = escapeHtml(url);
  const safeName = escapeHtml(fileName);

  if (mimeType.startsWith("video/")) {
    return `
      <figure data-type="uploaded-video" style="margin:16px 0;">
        <video controls preload="metadata" style="width:100%;border-radius:8px;" src="${safeUrl}"></video>
        <figcaption style="margin-top:8px;font-size:13px;color:var(--c-text-2);">${safeName}</figcaption>
      </figure>
    `;
  }

  if (mimeType.startsWith("audio/")) {
    return `
      <figure data-type="uploaded-audio" style="margin:16px 0;">
        <audio controls preload="metadata" style="width:100%;" src="${safeUrl}"></audio>
        <figcaption style="margin-top:8px;font-size:13px;color:var(--c-text-2);">${safeName}</figcaption>
      </figure>
    `;
  }

  return `
    <p>
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a>
    </p>
  `;
}

function buildImageHtml(url: string, altText: string, align: "full" | "left" | "right" | "center" = "full") {
  return `<p><img src="${escapeHtml(url)}" alt="${escapeHtml(altText)}" class="editor-image" data-align="${align}" style="${imageStyleForAlign(align)}" /></p>`;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-md border transition disabled:opacity-30 ${
        label ? "h-9 px-3 text-[11px] font-medium whitespace-nowrap sm:text-xs" : "h-9 w-9 shrink-0"
      }`}
      style={active
        ? {
            background: "var(--c-accent-soft)",
            color: "var(--c-accent)",
            borderColor: "color-mix(in srgb, var(--c-accent) 28%, var(--c-border))",
          }
        : {
            background: "var(--c-bg-1)",
            color: "var(--c-text-1)",
            borderColor: "var(--c-border)",
          }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--c-bg-2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--c-bg-1)";
        }
      }}
    >
      {children}
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-7 w-px shrink-0" style={{ background: "var(--c-border)" }} />;
}

function ToolbarSelect({
  value,
  onChange,
  title,
  options,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  title: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      title={title}
      className="h-9 rounded-md border px-3 text-xs font-medium outline-none transition"
      style={{
        background: "var(--c-bg-1)",
        color: "var(--c-text-1)",
        borderColor: "var(--c-border)",
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(function TiptapEditor({
  content,
  onChange,
  placeholder = "Inizia a scrivere il tuo articolo...",
  toolbarMode = "compact",
}, ref) {
  const { currentTenant } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        horizontalRule: {},
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph", "image"],
      }),
      Youtube.configure({
        inline: false,
        nocookie: true,
        HTMLAttributes: {
          class: "editor-video",
          style: "width: 100%; aspect-ratio: 16/9; border-radius: 8px;",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none px-3 py-3 sm:p-4 focus:outline-none min-h-[240px] sm:min-h-[300px]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextContent = content || "";
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [content, editor]);

  const insertUploadedMedia = useCallback((url: string, file: File) => {
    if (!editor) return;

    if (file.type.startsWith("image/")) {
      editor.chain().focus().insertContent(buildImageHtml(url, file.name, "full")).run();
      return;
    }

    editor.chain().focus().insertContent(buildUploadedMediaHtml(url, file.name, file.type)).run();
  }, [editor]);

  // Upload media to R2 via CMS API
  const handleMediaUpload = useCallback(async (file: File) => {
    if (!currentTenant || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenant_id", currentTenant.id);
    formData.append("tenant_slug", currentTenant.slug);
    try {
      const res = await fetch("/api/cms/media/upload", { method: "POST", body: formData, credentials: "same-origin" });
      const data = await res.json().catch(() => null);
      if (!res.ok) { toast.error(data?.error || "Errore upload"); return; }
      if (data?.media?.url) {
        insertUploadedMedia(data.media.url, file);
        toast.success(file.type.startsWith("image/") ? "Media inserito" : "Allegato inserito");
      }
    } catch { toast.error("Errore upload media"); }
    finally { setUploading(false); }
  }, [currentTenant, editor, insertUploadedMedia]);

  // Handle file input change
  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleMediaUpload(file);
    e.target.value = "";
  }, [handleMediaUpload]);

  // Insert image from URL
  const insertImageUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL dell'immagine:");
    if (url) {
      editor.chain().focus().insertContent(buildImageHtml(url, "Immagine articolo", "full")).run();
    }
  }, [editor]);

  // Insert video
  const insertVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL del video (YouTube o Vimeo):");
    if (url) {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      } else if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
        editor.chain().focus().insertContent(buildUploadedMediaHtml(url, "Video", "video/mp4")).run();
      } else {
        editor.chain().focus().insertContent(
          `<div data-type="video-embed" style="width:100%;aspect-ratio:16/9;margin:16px 0;"><iframe src="${url}" style="width:100%;height:100%;border:none;border-radius:8px;" allowfullscreen loading="lazy"></iframe></div>`
        ).run();
      }
    }
  }, [editor]);

  // Insert HTML embed
  const insertHtml = useCallback(() => {
    if (!editor) return;
    const html = window.prompt("Incolla codice HTML/iframe:");
    if (html) {
      editor.chain().focus().insertContent(
        `<div data-type="html-embed" style="margin:16px 0;">${html}</div>`
      ).run();
    }
  }, [editor]);

  // Insert link
  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL del link:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  // Set image alignment via wrapper style
  const setImageAlign = useCallback((align: "full" | "left" | "right" | "center") => {
    if (!editor) return;
    const { state } = editor;
    const { from, to } = state.selection;

    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === "image") {
        const attrs = { ...node.attrs, style: imageStyleForAlign(align), "data-align": align };
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, attrs);
        editor.view.dispatch(tr);
      }
    });
  }, [editor]);

  useImperativeHandle(ref, () => ({
    insertHtml: (html: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(html).run();
    },
    focus: () => {
      editor?.chain().focus().run();
    },
  }), [editor]);

  if (!editor) return null;

  const showExpandedLabels = toolbarMode === "expanded";
  const currentBlockStyle: TextBlockStyle = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const applyBlockStyle = (value: TextBlockStyle) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    const headingLevel = Number(value.slice(1)) as 1 | 2 | 3;
    chain.setHeading({ level: headingLevel }).run();
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/webm,audio/ogg,application/pdf"
        className="hidden"
        onChange={onFileSelect}
      />

      {/* Toolbar */}
      <div style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="flex min-w-max items-center px-2 py-2">
            <ToolbarSelect
              value={currentBlockStyle}
              onChange={(event) => applyBlockStyle(event.target.value as TextBlockStyle)}
              title="Stile del paragrafo"
              options={[
                { value: "paragraph", label: "Paragrafo" },
                { value: "h1", label: "Titolo 1" },
                { value: "h2", label: "Titolo 2" },
                { value: "h3", label: "Titolo 3" },
              ]}
            />

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Grassetto" label={showExpandedLabels ? "Grassetto" : undefined}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Corsivo" label={showExpandedLabels ? "Corsivo" : undefined}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sottolineato" label={showExpandedLabels ? "Sottolineato" : undefined}>
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barrato" label={showExpandedLabels ? "Barrato" : undefined}>
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link" label={showExpandedLabels ? "Link" : undefined}>
              <Link2 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista puntata" label={showExpandedLabels ? "Lista" : undefined}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerata" label={showExpandedLabels ? "Lista num." : undefined}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citazione" label={showExpandedLabels ? "Citazione" : undefined}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Codice" label={showExpandedLabels ? "Codice" : undefined}>
              <Code className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separatore" label={showExpandedLabels ? "Linea" : undefined}>
              <Minus className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Allinea a sinistra" label={showExpandedLabels ? "Sinistra" : undefined}>
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Allinea al centro" label={showExpandedLabels ? "Centro" : undefined}>
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Allinea a destra" label={showExpandedLabels ? "Destra" : undefined}>
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Carica media" label={showExpandedLabels ? (uploading ? "Caricamento..." : "Media") : undefined}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </ToolbarButton>
            <ToolbarButton onClick={insertImageUrl} title="Immagine da URL" label={showExpandedLabels ? "Img URL" : undefined}>
              <ImagePlus className="h-4 w-4" style={{ opacity: 0.7 }} />
            </ToolbarButton>
            <ToolbarButton onClick={insertVideo} title="Video o YouTube" label={showExpandedLabels ? "Video" : undefined}>
              <Video className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={insertHtml} title="Embed HTML" label={showExpandedLabels ? "Embed" : undefined}>
              <FileCode className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annulla" label={showExpandedLabels ? "Undo" : undefined}>
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Ripristina" label={showExpandedLabels ? "Redo" : undefined}>
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {showExpandedLabels ? (
        <div className="px-3 py-2 text-[11px] leading-5 sm:text-xs" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg-1)", color: "var(--c-text-2)" }}>
          Barra classica dell&apos;editor: i comandi sono sempre visibili e separati per gruppi. Per le immagini, dopo l&apos;inserimento puoi selezionarle e usare il menu rapido di allineamento.
        </div>
      ) : null}

      {/* Image alignment bubble menu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e }) => (e as unknown as { isActive: (name: string) => boolean }).isActive("image")}
        >
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-lg" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <ToolbarButton onClick={() => setImageAlign("full")} title="Larghezza piena">
              <Maximize className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setImageAlign("center")} title="Centrata">
              <AlignCenter className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setImageAlign("left")} title="Allinea a sinistra (testo a destra)">
              <AlignLeft className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setImageAlign("right")} title="Allinea a destra (testo a sinistra)">
              <AlignRight className="w-3.5 h-3.5" />
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* CSS for image alignment */}
      <style jsx global>{`
        .tiptap .editor-image { border-radius: 8px; max-width: 100%; height: auto; cursor: pointer; }
        .tiptap .editor-image[data-align="full"] { display: block; width: 100%; margin: 16px 0; }
        .tiptap .editor-image[data-align="center"] { display: block; max-width: 80%; margin: 16px auto; }
        .tiptap .editor-image[data-align="left"] { float: left; max-width: 50%; margin: 0 16px 8px 0; }
        .tiptap .editor-image[data-align="right"] { float: right; max-width: 50%; margin: 0 0 8px 16px; }
        .tiptap .editor-video { margin: 16px 0; }
        .tiptap [data-type="video-embed"] { margin: 16px 0; }
        .tiptap [data-type="uploaded-video"] video { display: block; }
        .tiptap [data-type="uploaded-audio"] audio { display: block; }
        .tiptap [data-type="html-embed"] { margin: 16px 0; padding: 8px; border: 1px dashed var(--c-border); border-radius: 8px; }
        .tiptap .ProseMirror-selectednode { outline: 2px solid var(--c-accent); border-radius: 8px; }
        .tiptap img.ProseMirror-selectednode { outline-offset: 2px; }
        .tiptap::after { content: ""; display: table; clear: both; }
      `}</style>
    </div>
  );
});

export default TiptapEditor;
