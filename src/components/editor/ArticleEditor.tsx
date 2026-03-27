"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store";
import { loadArticleCategoryIds, syncArticleCategoryAssignments } from "@/lib/articles/taxonomy";
import { normalizeEditorialAutomationConfig, resolveEditorialAutomationRule } from "@/lib/editorial/automation";
import type { PlacementDisplayMode } from "@/lib/editorial/placements";
import { useFieldContextStore } from "@/lib/stores/field-context-store";
import { requestPublishTrigger } from "@/lib/publish/client";
import TiptapEditor from "./TiptapEditor";
import AIPanel from "./AIPanel";
import AIFieldHelper from "@/components/ai/AIFieldHelper";
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

interface AvailableSlot {
  id: string;
  slot_key: string;
  label: string;
  placement_duration_hours: number | null;
}

interface SiteConfigThemeRow {
  theme: Record<string, unknown> | null;
}

interface ArticleEditorProps {
  articleId?: string;
}

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  const router = useRouter();
  const { currentTenant, currentRole, user } = useAuthStore();
  const { registerFieldSetter, unregisterFieldSetter } = useFieldContextStore();
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
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [status, setStatus] = useState<ArticleStatus>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Register field setters for AI to use
  useEffect(() => {
    registerFieldSetter("title", setTitle);
    registerFieldSetter("subtitle", setSubtitle);
    registerFieldSetter("summary", setSummary);
    registerFieldSetter("body", setBody);
    registerFieldSetter("metaTitle", setMetaTitle);
    registerFieldSetter("metaDescription", setMetaDescription);
    registerFieldSetter("slug", setSlug);

    return () => {
      unregisterFieldSetter("title");
      unregisterFieldSetter("subtitle");
      unregisterFieldSetter("summary");
      unregisterFieldSetter("body");
      unregisterFieldSetter("metaTitle");
      unregisterFieldSetter("metaDescription");
      unregisterFieldSetter("slug");
    };
  }, [registerFieldSetter, unregisterFieldSetter]);

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [siteTheme, setSiteTheme] = useState<Record<string, unknown> | null>(null);
  const [slotId, setSlotId] = useState("");
  const [slotDisplayMode, setSlotDisplayMode] = useState<PlacementDisplayMode>("duplicate");
  const [slotAssignmentExpiresAt, setSlotAssignmentExpiresAt] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  // Load categories, tags, and available slots
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

    // Load assignable slots (manual or mixed mode) for articles
    supabase
      .from("layout_slots")
      .select("id, slot_key, label, placement_duration_hours, layout_templates!inner(tenant_id)")
      .eq("layout_templates.tenant_id", currentTenant.id)
      .eq("content_type", "articles")
      .in("assignment_mode", ["manual", "mixed"])
      .order("slot_key")
      .then(({ data }) => {
        if (data) setAvailableSlots(data as unknown as AvailableSlot[]);
      });

    supabase
      .from("site_config")
      .select("theme")
      .eq("tenant_id", currentTenant.id)
      .maybeSingle()
      .then(({ data }) => {
        setSiteTheme((data as SiteConfigThemeRow | null)?.theme || null);
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
          const categoryIds = await loadArticleCategoryIds(supabase, articleId!, data.category_id ?? null);
        setSelectedCategoryIds(categoryIds);
        setStatus(data.status);
        setIsFeatured(data.is_featured);
        setIsBreaking(data.is_breaking);
        setIsPremium(data.is_premium);
        setMetaTitle(data.meta_title ?? "");
        setMetaDescription(data.meta_description ?? "");
        setScheduledAt(data.scheduled_at ?? "");
        setPublishedAt(data.published_at ?? null);
        setSelectedTags(
          (data.article_tags as { tag_id: string }[]).map((t) => t.tag_id)
        );
        setSlugManual(true);

        // Load existing slot assignment
        const assignmentResponse = await fetch(`/api/v1/assignments/articles/${articleId}`);
        if (assignmentResponse.ok) {
          const assignment = await assignmentResponse.json();
          if (assignment?.slot_id) {
            setSlotId(assignment.slot_id);
            setSlotDisplayMode(assignment.display_mode === "exclusive" ? "exclusive" : "duplicate");
            setSlotAssignmentExpiresAt(typeof assignment.expires_at === "string" ? assignment.expires_at : null);
          } else {
            setSlotId("");
            setSlotDisplayMode("duplicate");
            setSlotAssignmentExpiresAt(null);
          }
        }
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
      const currentStatus = status;
      const finalStatus = newStatus ?? currentStatus;
      const nextPublishedAt =
        finalStatus === "published"
          ? currentStatus === "published"
            ? publishedAt || new Date().toISOString()
            : new Date().toISOString()
          : null;
      const nextScheduledAt = finalStatus === "published" ? null : scheduledAt || null;
      try {
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
          published_at: nextPublishedAt,
          scheduled_at: nextScheduledAt,
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
          const normalizedCategoryIds = [...new Set([categoryId, ...selectedCategoryIds].filter(Boolean))];

          try {
            await syncArticleCategoryAssignments(supabase, savedId, normalizedCategoryIds);
          } catch (categoryError) {
            console.warn("Article categories sync failed:", categoryError);
          }

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

          // Update editorial placement via API so expiry rules stay centralized
          const placementResponse = await fetch(`/api/v1/assignments/articles/${savedId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slot_id: slotId || null,
              display_mode: slotDisplayMode,
              category_ids: normalizedCategoryIds,
              tag_ids: selectedTags,
            }),
          });

          if (!placementResponse.ok) {
            const placementPayload = await placementResponse.json().catch(() => null);
            throw new Error(placementPayload?.error || "Errore aggiornamento placement editoriale");
          }

          const placementPayload = await placementResponse.json().catch(() => null);
          const resolvedSlotId =
            typeof placementPayload?.resolved_slot_id === "string" ? placementPayload.resolved_slot_id : slotId || "";
          const resolvedDisplayMode =
            placementPayload?.resolved_display_mode === "exclusive" ? "exclusive" : slotDisplayMode;
          setSlotId(resolvedSlotId);
          setSlotDisplayMode(resolvedDisplayMode);
          setSlotAssignmentExpiresAt(
            typeof placementPayload?.expires_at === "string" ? placementPayload.expires_at : null
          );
          if (!resolvedSlotId) {
            setSlotAssignmentExpiresAt(null);
          }

          try {
            await requestPublishTrigger(currentTenant.id, [
              { type: "article", articleId: savedId },
              { type: "homepage" },
              ...normalizedCategoryIds.map((id) => ({ type: "category" as const, categoryId: id })),
            ]);
          } catch (publishError) {
            const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
            toast.error(`Articolo salvato, ma il publish non e' stato aggiornato: ${publishMessage}`);
          }
        }

        setStatus(finalStatus);
        setPublishedAt(nextPublishedAt);
        setScheduledAt(nextScheduledAt || "");
        toast.success(
          isNew ? "Articolo creato!" : "Articolo aggiornato!"
        );

        if (isNew && savedId) {
          router.push(`/dashboard/articoli/${savedId}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Errore imprevisto durante il salvataggio";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [
      currentTenant, user, title, subtitle, slug, summary, body,
      coverImageUrl, categoryId, status, isFeatured, isBreaking,
      isPremium, metaTitle, metaDescription, scheduledAt, publishedAt,
      selectedCategoryIds, selectedTags, slotId, slotDisplayMode, articleId, isNew, router,
    ]
  );

  const canApprove = currentRole === "admin" || currentRole === "chief_editor";
  const canPublish = canApprove;
  const saveCurrentLabel =
    status === "draft"
      ? "Salva bozza"
      : status === "in_review"
        ? "Salva revisione"
        : status === "approved"
          ? "Salva approvazione"
          : status === "published"
            ? "Salva articolo"
            : "Salva archivio";

  const handlePrimaryCategoryChange = (nextCategoryId: string) => {
    setCategoryId(nextCategoryId);
    setSelectedCategoryIds((prev) => {
      const remaining = prev.filter((id) => id !== nextCategoryId);
      return nextCategoryId ? [nextCategoryId, ...remaining] : remaining;
    });
  };

  const handleAddSecondaryCategory = (nextCategoryId: string) => {
    if (!nextCategoryId) {
      return;
    }

    setSelectedCategoryIds((prev) => {
      if (prev.includes(nextCategoryId)) {
        return prev;
      }

      return categoryId ? [categoryId, ...prev.filter((id) => id !== categoryId), nextCategoryId] : [...prev, nextCategoryId];
    });
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.filter((id) => id !== categoryToRemove);

      if (categoryToRemove === categoryId) {
        setCategoryId(next[0] || "");
      }

      return next;
    });
  };

  const selectedPlacementSlot = availableSlots.find((slot) => slot.id === slotId) || null;
  const editorialAutomation = normalizeEditorialAutomationConfig(
    ((siteTheme as Record<string, unknown> | null)?.editorialAutomation || null)
  );
  const pendingAutomaticPlacementRule =
    [...new Set([categoryId, ...selectedCategoryIds].filter(Boolean))].some((selectedCategoryId) => {
      const rule = editorialAutomation.categoryRules?.[selectedCategoryId];
      return Boolean(rule && rule.spotlightTagIds.some((tagId) => selectedTags.includes(tagId)) && !rule.homepageSlotId);
    });
  const automaticPlacementRule = resolveEditorialAutomationRule({
    categoryIds: [...new Set([categoryId, ...selectedCategoryIds].filter(Boolean))],
    tagIds: selectedTags,
    config: editorialAutomation,
  });
  const automaticPlacementSlot =
    automaticPlacementRule?.homepageSlotId
      ? availableSlots.find((slot) => slot.id === automaticPlacementRule.homepageSlotId) || null
      : null;
  const placementPreviewExpiresAt =
    slotAssignmentExpiresAt ||
    (slotId && selectedPlacementSlot?.placement_duration_hours
      ? new Date(Date.now() + selectedPlacementSlot.placement_duration_hours * 60 * 60 * 1000).toISOString()
      : null);

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
            onClick={() => handleSave()}
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
            {saveCurrentLabel}
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
          <div className="relative group">
            <div className="absolute right-1 top-2 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <AIFieldHelper fieldName="Titolo articolo" fieldValue={title} context={body?.slice(0, 300)} onGenerate={setTitle} />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!slugManual && isNew) {
                  setSlug(slugify(nextTitle, { lower: true, strict: true, locale: "it" }));
                }
              }}
              placeholder="Titolo dell'articolo"
              className="w-full text-3xl font-bold font-serif border-0 bg-transparent focus:outline-none pr-10"
              style={{ color: "var(--c-text-0)" }}
            />
          </div>

          {/* Subtitle */}
          <div className="relative group">
            <div className="absolute right-1 top-1 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <AIFieldHelper fieldName="Sottotitolo" fieldValue={subtitle} context={title} onGenerate={setSubtitle} />
            </div>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Sottotitolo (opzionale)"
              className="w-full text-lg border-0 bg-transparent focus:outline-none pr-10"
              style={{ color: "var(--c-text-2)" }}
            />
          </div>

          {/* Summary */}
          <div className="relative group">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <AIFieldHelper fieldName="Sommario / Lead" fieldValue={summary} context={`${title}\n${body?.slice(0, 500)}`} onGenerate={setSummary} />
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Sommario / Lead dell'articolo..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none resize-none pr-10"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          {/* Cover Image */}
          <div className="rounded-lg overflow-hidden group" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg-1)" }}>
            {coverImageUrl ? (
              <div className="relative">
                <img src={coverImageUrl} alt="Copertina" className="w-full h-48 object-cover" />
                <button onClick={() => setCoverImageUrl("")}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AIFieldHelper fieldName="URL immagine copertina" fieldValue={coverImageUrl} context={title} onGenerate={setCoverImageUrl} />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AIFieldHelper fieldName="URL immagine copertina" fieldValue="" context={`Titolo: ${title}. Suggerisci un URL di immagine Unsplash o Pexels gratuita pertinente.`} onGenerate={setCoverImageUrl} />
                </div>
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer transition"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-bg-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <ImageIcon className="w-8 h-8 mb-2" style={{ color: "var(--c-text-3)" }} />
                  <span className="text-sm" style={{ color: "var(--c-text-3)" }}>Aggiungi immagine di copertina</span>
                  <input type="text" placeholder="URL immagine..." value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="mt-2 px-3 py-1.5 rounded text-xs w-64 focus:outline-none focus:ring-1"
                    style={{ border: "1px solid var(--c-border)" }} />
                </label>
              </div>
            )}
          </div>

          {/* Body Editor */}
          <div className="relative group">
            <TiptapEditor content={body} onChange={setBody} />
            <div className="flex justify-end px-3 py-2" style={{ borderTop: "1px solid var(--c-border)" }}>
              <AIFieldHelper
                fieldName="Corpo dell'articolo"
                fieldValue={body?.slice(0, 200) || ""}
                context={`Titolo: ${title}\nSottotitolo: ${subtitle}\nSommario: ${summary}`}
                onGenerate={(v) => setBody(body + "\n" + v)}
              />
            </div>
          </div>
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
          <div className="rounded-lg p-4 group" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Slug URL</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AIFieldHelper fieldName="Slug URL" fieldValue={slug} context={title} onGenerate={(v) => { setSlugManual(true); setSlug(v); }} />
              </div>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ border: "1px solid var(--c-border)" }}
            />
          </div>

          {/* Category */}
          <div className="rounded-lg p-4 group" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Categorie</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AIFieldHelper
                  fieldName="Categoria primaria articolo"
                  fieldValue={categories.find(c => c.id === categoryId)?.name || "nessuna"}
                  context={`Titolo: ${title}\nSommario: ${summary}\nCategorie disponibili: ${categories.map(c => c.name).join(", ")}\nCategorie già selezionate: ${selectedCategoryIds.map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "nessuna"}`}
                  onGenerate={(suggestion) => {
                    const match = categories.find(c => c.name.toLowerCase() === suggestion.toLowerCase().trim());
                    if (match) handlePrimaryCategoryChange(match.id);
                    else toast.success(`Suggerimento IA: "${suggestion}" — selezionala manualmente se esiste`);
                  }}
                />
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--c-text-3)" }}>La categoria primaria è quella usata come principale nelle card e negli elenchi. Puoi aggiungere categorie secondarie come in WordPress.</p>
            <select
              value={categoryId}
              onChange={(e) => handlePrimaryCategoryChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <option value="">Nessuna categoria primaria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Categorie associate</p>
              {selectedCategoryIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryIds.map((selectedId) => {
                    const category = categories.find((cat) => cat.id === selectedId);
                    if (!category) {
                      return null;
                    }

                    const isPrimaryCategory = selectedId === categoryId;
                    return (
                      <span
                        key={selectedId}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: isPrimaryCategory ? "var(--c-accent-soft)" : "var(--c-bg-2)",
                          color: isPrimaryCategory ? "var(--c-accent)" : "var(--c-text-1)",
                        }}
                      >
                        {category.name}
                        {isPrimaryCategory && <span>Primaria</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(selectedId)}
                          className="opacity-70 hover:opacity-100"
                          aria-label={`Rimuovi categoria ${category.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--c-text-3)" }}>Nessuna categoria selezionata.</p>
              )}

              <select
                defaultValue=""
                onChange={(e) => {
                  handleAddSecondaryCategory(e.target.value);
                  e.target.value = "";
                }}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
              >
                <option value="">Aggiungi categoria secondaria</option>
                {categories
                  .filter((cat) => !selectedCategoryIds.includes(cat.id))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Slot Assignment */}
          {availableSlots.length > 0 && (
            <div className="rounded-lg p-4 group" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--c-text-0)" }}>Placement editoriale</h3>
              <p className="text-xs mb-3" style={{ color: "var(--c-text-3)" }}>
                Usa slot come “Primo piano” o “Evidenza” con regole centralizzate. La durata si prende dallo slot, non dal singolo articolo.
              </p>
              <select
                value={slotId}
                onChange={(e) => {
                  setSlotId(e.target.value);
                  setSlotAssignmentExpiresAt(null);
                  if (!e.target.value) {
                    setSlotDisplayMode("duplicate");
                  }
                }}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
              >
                <option value="">Nessun placement</option>
                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
              {slotId && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Comportamento durante il placement</label>
                    <select
                      value={slotDisplayMode}
                      onChange={(e) => setSlotDisplayMode(e.target.value as PlacementDisplayMode)}
                      className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                      style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                    >
                      <option value="duplicate">Duplica: resta anche nelle categorie</option>
                      <option value="exclusive">Solo placement: finché attivo sparisce dalle categorie</option>
                    </select>
                  </div>

                  <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                    <p>
                      {selectedPlacementSlot?.placement_duration_hours
                        ? `Rotazione automatica: ${selectedPlacementSlot.placement_duration_hours} ore.`
                        : "Questo placement non ha scadenza automatica."}
                    </p>
                    <p className="mt-1">
                      {slotDisplayMode === "exclusive"
                        ? "Modalita esclusiva: il pezzo resta solo nel placement finché è attivo, poi torna visibile nelle categorie già assegnate."
                        : "Modalita duplicata: il pezzo appare sia nel placement sia nelle categorie già assegnate."}
                    </p>
                    {placementPreviewExpiresAt && (
                      <p className="mt-1" style={{ color: "var(--c-accent)" }}>
                        Scadenza prevista: {new Date(placementPreviewExpiresAt).toLocaleString("it-IT")}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!slotId && automaticPlacementSlot && (
                <div className="mt-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
                  <p>
                    Regola automatica attiva: con i tag selezionati questo articolo andra` in <strong>{automaticPlacementSlot.label}</strong>.
                  </p>
                  <p className="mt-1">
                    Modalita`: {automaticPlacementRule?.displayMode === "exclusive" ? "solo placement temporaneo" : "duplica tra homepage e categoria"}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="rounded-lg p-4 group" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Tag</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <AIFieldHelper
                  fieldName="Tag articolo"
                  fieldValue={selectedTags.map(id => tags.find(t => t.id === id)?.name).filter(Boolean).join(", ")}
                  context={`Titolo: ${title}\nSommario: ${summary}\nTag disponibili: ${tags.map(t => t.name).join(", ")}`}
                  onGenerate={(suggestion) => {
                    toast.success(`Tag suggeriti dall'IA: ${suggestion}`);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <span key={tagId} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {tag.name}
                    <button onClick={() => setSelectedTags((prev) => prev.filter((id) => id !== tagId))} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
            <select
              onChange={(e) => { const val = e.target.value; if (val && !selectedTags.includes(val)) setSelectedTags((prev) => [...prev, val]); e.target.value = ""; }}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
            >
              <option value="">Aggiungi tag...</option>
              {tags.filter((t) => !selectedTags.includes(t.id)).map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
            {automaticPlacementSlot && (
              <p className="text-[11px] mt-2" style={{ color: "var(--c-accent)" }}>
                Il tag selezionato attivera` l’invio automatico in homepage nello slot “{automaticPlacementSlot.label}”.
              </p>
            )}
            {!automaticPlacementSlot && pendingAutomaticPlacementRule && (
              <p className="text-[11px] mt-2" style={{ color: "var(--c-text-3)" }}>
                Esiste una regola editoriale per questi tag, ma non ha ancora uno slot homepage collegato. La logica e` pronta e diventera` operativa quando assegnerai lo slot dal CMS.
              </p>
            )}
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
              <div className="relative group">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Meta Title</label>
                  <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <AIFieldHelper fieldName="Meta Title SEO" fieldValue={metaTitle} context={`Titolo: ${title}\nSommario: ${summary}`} onGenerate={setMetaTitle} />
                  </div>
                </div>
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
              <div className="relative group">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Meta Description</label>
                  <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <AIFieldHelper fieldName="Meta Description SEO" fieldValue={metaDescription} context={`Titolo: ${title}\nSommario: ${summary}\nCorpo: ${body?.slice(0, 300)}`} onGenerate={setMetaDescription} />
                  </div>
                </div>
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
