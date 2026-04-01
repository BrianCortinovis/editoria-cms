"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
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
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded transition disabled:opacity-30"
      style={active
        ? { background: "var(--c-accent)", color: "#fff" }
        : { color: "var(--c-text-2)" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--c-bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-6 mx-1" style={{ background: "var(--c-border)" }} />;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Inizia a scrivere il tuo articolo...",
}: TiptapEditorProps) {
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
        class: "tiptap prose prose-sm max-w-none p-4 focus:outline-none min-h-[300px]",
      },
    },
  });

  // Upload image to R2 via CMS API
  const handleImageUpload = useCallback(async (file: File) => {
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
        editor.chain().focus().setImage({ src: data.media.url, alt: file.name }).run();
        toast.success("Immagine inserita");
      }
    } catch { toast.error("Errore upload immagine"); }
    finally { setUploading(false); }
  }, [currentTenant, editor]);

  // Handle file input change
  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleImageUpload(file);
    e.target.value = "";
  }, [handleImageUpload]);

  // Insert image from URL
  const insertImageUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL dell'immagine:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  // Insert video
  const insertVideo = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL del video (YouTube o Vimeo):");
    if (url) {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      } else {
        // Generic iframe for Vimeo and other providers
        editor.chain().focus().insertContent(
          `<div data-type="video-embed" style="width:100%;aspect-ratio:16/9;margin:16px 0;"><iframe src="${url}" style="width:100%;height:100%;border:none;border-radius:8px;" allowfullscreen></iframe></div>`
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
        const styleMap: Record<string, string> = {
          full: "display:block;width:100%;margin:16px 0;",
          center: "display:block;max-width:80%;margin:16px auto;",
          left: "float:left;max-width:50%;margin:0 16px 8px 0;",
          right: "float:right;max-width:50%;margin:0 0 8px 16px;",
        };
        const attrs = { ...node.attrs, style: styleMap[align], "data-align": align };
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, attrs);
        editor.view.dispatch(tr);
      }
    });
  }, [editor]);

  if (!editor) return null;

  // Check if image is selected for bubble menu
  const isImageSelected = editor.isActive("image");

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFileSelect} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg-2)" }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Grassetto">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Corsivo">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sottolineato">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barrato">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titolo 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titolo 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titolo 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista puntata">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerata">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citazione">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Codice">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separatore">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
          <Link2 className="w-4 h-4" />
        </ToolbarButton>

        {/* Media buttons */}
        <ToolbarButton onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Carica immagine">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </ToolbarButton>
        <ToolbarButton onClick={insertImageUrl} title="Immagine da URL">
          <ImagePlus className="w-4 h-4" style={{ opacity: 0.5 }} />
        </ToolbarButton>
        <ToolbarButton onClick={insertVideo} title="Video (YouTube/Vimeo)">
          <Video className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertHtml} title="HTML embed">
          <FileCode className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annulla">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Ripristina">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

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
        .tiptap [data-type="html-embed"] { margin: 16px 0; padding: 8px; border: 1px dashed var(--c-border); border-radius: 8px; }
        .tiptap .ProseMirror-selectednode { outline: 2px solid var(--c-accent); border-radius: 8px; }
        .tiptap img.ProseMirror-selectednode { outline-offset: 2px; }
        .tiptap::after { content: ""; display: table; clear: both; }
      `}</style>
    </div>
  );
}
