"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import TiptapEditor from "./TiptapEditor";
import AIPanel from "./AIPanel";
import slugify from "slugify";
import toast from "react-hot-toast";
import {
  Save,
  Send,
  CheckCircle,
  Globe,
  Archive,
  ArrowLeft,
  Loader2,
  Star,
  Zap,
  Lock,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { ArticleStatus } from "@/types/database";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface ArticleEditorProps {
  articleId?: string;
}

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  const router = useRouter();
  const { currentTenant, currentRole, user } = useAuthStore();
  const isNew = !articleId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!articleId);

  // Article fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [slugManual, setSlugManual] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && isNew) {
      setSlug(
        slugify(title, { lower: true, strict: true, locale: "it" })
      );
    }
  }, [title, slugManual, isNew]);

  // Load categories and tags
  useEffect(() => {
    if (!currentTenant) return;
    const supabase = createClient();

    supabase
      .from("categories")
      .select("id, name, color")
      .eq("tenant_id", currentTenant.id)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });

    supabase
      .from("tags")
      .select("id, name, slug")
      .eq("tenant_id", currentTenant.id)
      .order("name")
      .then(({ data }) => {
        if (data) setTags(data);
      });
  }, [currentTenant]);

  // Load article if editing
  useEffect(() => {
    if (!articleId || !currentTenant) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("articles")
        .select("*, article_tags(tag_id)")
        .eq("id", articleId!)
        .single();

      if (data) {
        setTitle(data.title);
        setSubtitle(data.subtitle ?? "");
        setSlug(data.slug);
        setSummary(data.summary ?? "");
        setBody(data.body);
        setCoverImageUrl(data.cover_image_url ?? "");
        setCategoryId(data.category_id ?? "");
        setStatus(data.status);
        setIsFeatured(data.is_featured);
        setIsBreaking(data.is_breaking);
        setIsPremium(data.is_premium);
        setMetaTitle(data.meta_title ?? "");
        setMetaDescription(data.meta_description ?? "");
        setScheduledAt(data.scheduled_at ?? "");
        setSelectedTags(
          (data.article_tags as { tag_id: string }[]).map((t) => t.tag_id)
        );
        setSlugManual(true);
      }
      setLoading(false);
    }

    load();
  }, [articleId, currentTenant]);

  const handleSave = useCallback(
    async (newStatus?: ArticleStatus) => {
      if (!currentTenant || !user) return;
      if (!title.trim()) {
        toast.error("Il titolo è obbligatorio");
        return;
      }

      setSaving(true);
      const supabase = createClient();
      const finalStatus = newStatus ?? status;

      const articleData = {
        tenant_id: currentTenant.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: slug || slugify(title, { lower: true, strict: true, locale: "it" }),
        summary: summary.trim() || null,
        body,
        cover_image_url: coverImageUrl || null,
        category_id: categoryId || null,
        author_id: user.id,
        status: finalStatus,
        is_featured: isFeatured,
        is_breaking: isBreaking,
        is_premium: isPremium,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        og_image_url: coverImageUrl || null,
        published_at:
          finalStatus === "published" ? new Date().toISOString() : null,
        scheduled_at: scheduledAt || null,
      };

      let savedId = articleId;

      if (isNew) {
        const { data, error } = await supabase
          .from("articles")
          .insert(articleData)
          .select("id")
          .single();

        if (error) {
          toast.error("Errore nel salvataggio: " + error.message);
          setSaving(false);
          return;
        }
        savedId = data.id;
      } else {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", articleId);

        if (error) {
          toast.error("Errore nel salvataggio: " + error.message);
          setSaving(false);
          return;
        }

        // Save revision
        await supabase.from("article_revisions").insert({
          article_id: articleId,
          title,
          body,
          changed_by: user.id,
        });
      }

      // Update tags
      if (savedId) {
        await supabase
          .from("article_tags")
          .delete()
          .eq("article_id", savedId);

        if (selectedTags.length > 0) {
          await supabase.from("article_tags").insert(
            selectedTags.map((tagId) => ({
              article_id: savedId!,
              tag_id: tagId,
            }))
          );
        }
      }

      setSaving(false);
      toast.success(
        isNew ? "Articolo creato!" : "Articolo aggiornato!"
      );

      if (isNew && savedId) {
        router.push(`/dashboard/articoli/${savedId}`);
      }
    },
    [
      currentTenant, user, title, subtitle, slug, summary, body,
      coverImageUrl, categoryId, status, isFeatured, isBreaking,
      isPremium, metaTitle, metaDescription, scheduledAt,
      selectedTags, articleId, isNew, router,
    ]
  );

  const canApprove = currentRole === "super_admin" || currentRole === "chief_editor";
  const canPublish = canApprove;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={() => router.push("/dashboard/articoli")}
          className="flex items-center gap-1.5 text-sm transition"
          style={{ color: "var(--c-text-2)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-text-0)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-2)"}
        >
          <ArrowLeft className="w-4 h-4" />
          Articoli
        </button>

        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ border: "1px solid var(--c-border)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salva bozza
          </button>

          {/* Send for review */}
          {status === "draft" && (
            <button
              onClick={() => handleSave("in_review")}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Invia in revisione
            </button>
          )}

          {/* Approve */}
          {status === "in_review" && canApprove && (
            <button
              onClick={() => handleSave("approved")}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
            >
              <CheckCircle className="w-4 h-4" /> Approva
            </button>
          )}

          {/* Publish */}
          {(status === "approved" || status === "draft") && canPublish && (
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
            >
              <Globe className="w-4 h-4" /> Pubblica
            </button>
          )}

          {/* Archive */}
          {status === "published" && canPublish && (
            <button
              onClick={() => handleSave("archived")}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ border: "1px solid var(--c-danger)", color: "var(--c-danger)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Archive className="w-4 h-4" /> Archivia
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo dell'articolo"
            className="w-full text-3xl font-bold font-serif border-0 bg-transparent focus:outline-none placeholder-gray-300/50"
          />

          {/* Subtitle */}
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Sottotitolo (opzionale)"
            className="w-full text-lg border-0 bg-transparent focus:outline-none placeholder-gray-300/50"
            style={{ color: "var(--c-text-2)" }}
          />

          {/* Summary */}
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Sommario / Lead dell'articolo..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ border: "1px solid var(--c-border)" }}
          />

          {/* Cover Image */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-1)" }}>
            {coverImageUrl ? (
              <div className="relative">
                <img
                  src={coverImageUrl}
                  alt="Copertina"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setCoverImageUrl("")}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center py-8 cursor-pointer transition"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <ImageIcon className="w-8 h-8 mb-2" style={{ color: "var(--c-text-3)" }} />
                <span className="text-sm" style={{ color: "var(--c-text-3)" }}>
                  Aggiungi immagine di copertina
                </span>
                <input
                  type="text"
                  placeholder="URL immagine..."
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="mt-2 px-3 py-1.5 rounded text-xs w-64 focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </label>
            )}
          </div>

          {/* Body Editor */}
          <TiptapEditor content={body} onChange={setBody} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--c-text-0)" }}>Stato</h3>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={
                {
                  draft: { background: "var(--c-bg-2)", color: "var(--c-text-2)" },
                  in_review: { background: "rgba(var(--c-warning-rgb, 234,179,8), 0.15)", color: "var(--c-warning)" },
                  approved: { background: "var(--c-accent-soft)", color: "var(--c-accent)" },
                  published: { background: "rgba(var(--c-success-rgb, 16,185,129), 0.15)", color: "var(--c-success)" },
                  archived: { background: "rgba(var(--c-danger-rgb, 239,68,68), 0.15)", color: "var(--c-danger)" },
                }[status]
              }
            >
              {
                {
                  draft: "Bozza",
                  in_review: "In Revisione",
                  approved: "Approvato",
                  published: "Pubblicato",
                  archived: "Archiviato",
                }[status]
              }
            </span>
          </div>

          {/* Slug */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Slug URL</h3>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          {/* Category */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Categoria</h3>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <option value="">Nessuna categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Tag</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}
                  >
                    {tag.name}
                    <button
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.filter((id) => id !== tagId)
                        )
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && !selectedTags.includes(val)) {
                  setSelectedTags((prev) => [...prev, val]);
                }
                e.target.value = "";
              }}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <option value="">Aggiungi tag...</option>
              {tags
                .filter((t) => !selectedTags.includes(t.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Flags */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Opzioni</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm" style={{ color: "var(--c-text-1)" }}>In Evidenza</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-sm" style={{ color: "var(--c-text-1)" }}>Breaking News</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <Lock className="w-4 h-4 text-purple-500" />
              <span className="text-sm" style={{ color: "var(--c-text-1)" }}>Contenuto Premium</span>
            </label>
          </div>

          {/* Schedule */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>
              Pubblicazione programmata
            </h3>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          {/* SEO */}
          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--c-text-0)" }}>SEO</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Titolo per i motori di ricerca"}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>
                  {(metaTitle || title).length}/60
                </p>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>
                  Meta Description
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={summary || "Descrizione per i motori di ricerca"}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 resize-none"
                  style={{ border: "1px solid var(--c-border)" }}
                />
                <p className="text-[11px] mt-1" style={{ color: "var(--c-text-3)" }}>
                  {(metaDescription || summary).length}/160
                </p>
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <AIPanel
            title={title}
            body={body}
            summary={summary}
            onApplyMetaTitle={setMetaTitle}
            onApplyMetaDescription={setMetaDescription}
            onApplyTitle={setTitle}
            onApplySummary={setSummary}
          />
        </div>
      </div>
    </div>
  );
}
