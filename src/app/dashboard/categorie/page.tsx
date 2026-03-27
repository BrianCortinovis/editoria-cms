"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { normalizeEditorialAutomationConfig, type EditorialCategoryAutomationRule } from "@/lib/editorial/automation";
import type { PlacementDisplayMode } from "@/lib/editorial/placements";
import { useAuthStore } from "@/lib/store";
import slugify from "slugify";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FolderOpen,
  GripVertical,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sort_order: number;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

interface HomepageSlot {
  id: string;
  label: string;
  placement_duration_hours: number | null;
}

interface EditorialRuleDraft {
  homepageSlotId: string;
  spotlightTagIds: string[];
  displayMode: PlacementDisplayMode;
}

interface SiteConfigRow {
  theme: Record<string, unknown> | null;
}

function createDefaultRuleDraft(): EditorialRuleDraft {
  return {
    homepageSlotId: "",
    spotlightTagIds: [],
    displayMode: "duplicate",
  };
}

export default function CategoriePage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [homepageSlots, setHomepageSlots] = useState<HomepageSlot[]>([]);
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, EditorialRuleDraft>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [movingCategoryId, setMovingCategoryId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8B0000");

  const loadCategories = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const supabase = createClient();

    const [{ data: categoriesData }, { data: tagsData }, { data: slotsData }, { data: siteConfigData }] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("tenant_id", currentTenant.id)
        .order("sort_order"),
      supabase
        .from("tags")
        .select("id, name, slug")
        .eq("tenant_id", currentTenant.id)
        .order("name"),
      supabase
        .from("layout_slots")
        .select("id, label, placement_duration_hours, layout_templates!inner(tenant_id, page_type)")
        .eq("layout_templates.tenant_id", currentTenant.id)
        .eq("layout_templates.page_type", "homepage")
        .eq("content_type", "articles")
        .in("assignment_mode", ["manual", "mixed"])
        .order("label"),
      supabase
        .from("site_config")
        .select("theme")
        .eq("tenant_id", currentTenant.id)
        .maybeSingle(),
    ]);

    const nextCategories = (categoriesData || []) as Category[];
    const automation = normalizeEditorialAutomationConfig(
      ((siteConfigData as SiteConfigRow | null)?.theme as Record<string, unknown> | null)?.editorialAutomation || null
    );

    setCategories(nextCategories);
    setTags((tagsData || []) as TagItem[]);
    setHomepageSlots((slotsData || []) as HomepageSlot[]);
    setRuleDrafts(
      Object.fromEntries(
        nextCategories.map((category) => {
          const rule = automation.categoryRules?.[category.id];
          return [
            category.id,
            {
              homepageSlotId: rule?.homepageSlotId || "",
              spotlightTagIds: rule?.spotlightTagIds || [],
              displayMode: rule?.displayMode || "duplicate",
            } satisfies EditorialRuleDraft,
          ];
        })
      )
    );
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setColor("#8B0000");
    setEditingId(null);
    setShowNew(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setColor(cat.color);
    setShowNew(false);
  };

  const handleSave = async () => {
    if (!currentTenant || !name.trim()) {
      toast.error("Il nome e` obbligatorio");
      return;
    }

    const supabase = createClient();
    const categorySlug = slug || slugify(name, { lower: true, strict: true, locale: "it" });

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update({ name, slug: categorySlug, description: description || null, color })
        .eq("id", editingId);

      if (error) {
        toast.error(`Errore: ${error.message}`);
        return;
      }

      try {
        await requestPublishTrigger(currentTenant.id, [
          { type: "category", categoryId: editingId },
          { type: "homepage" },
        ]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Categoria salvata, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      toast.success("Categoria aggiornata");
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          tenant_id: currentTenant.id,
          name,
          slug: categorySlug,
          description: description || null,
          color,
          sort_order: categories.length,
        })
        .select("id")
        .single();

      if (error) {
        toast.error(`Errore: ${error.message}`);
        return;
      }

      try {
        await requestPublishTrigger(currentTenant.id, [
          { type: "category", categoryId: data.id },
          { type: "homepage" },
        ]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Categoria creata, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      toast.success("Categoria creata");
    }

    resetForm();
    void loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa categoria?")) return;
    if (!currentTenant) return;
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error(`Errore: ${error.message}`);
      return;
    }

    try {
      await requestPublishTrigger(currentTenant.id, [
        { type: "category", categoryId: id },
        { type: "homepage" },
      ]);
    } catch (publishError) {
      const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
      toast.error(`Categoria rimossa, ma il publish non e' stato aggiornato: ${publishMessage}`);
    }
    toast.success("Categoria eliminata");
    setCategories((prev) => prev.filter((category) => category.id !== id));
  };

  const updateRuleDraft = (categoryId: string, patch: Partial<EditorialRuleDraft>) => {
    setRuleDrafts((current) => ({
      ...current,
      [categoryId]: {
        ...(current[categoryId] || createDefaultRuleDraft()),
        ...patch,
      },
    }));
  };

  const handleMoveCategory = async (categoryId: string, direction: "up" | "down") => {
    if (!currentTenant) return;
    const index = categories.findIndex((category) => category.id === categoryId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= categories.length) {
      return;
    }

    const currentCategory = categories[index];
    const targetCategory = categories[swapIndex];
    const supabase = createClient();
    setMovingCategoryId(categoryId);

    try {
      const [firstUpdate, secondUpdate] = await Promise.all([
        supabase.from("categories").update({ sort_order: targetCategory.sort_order }).eq("id", currentCategory.id),
        supabase.from("categories").update({ sort_order: currentCategory.sort_order }).eq("id", targetCategory.id),
      ]);

      if (firstUpdate.error || secondUpdate.error) {
        throw firstUpdate.error || secondUpdate.error;
      }

      const nextCategories = [...categories];
      nextCategories[index] = { ...targetCategory, sort_order: currentCategory.sort_order };
      nextCategories[swapIndex] = { ...currentCategory, sort_order: targetCategory.sort_order };
      setCategories(nextCategories);

      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "homepage" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Ordine aggiornato, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      toast.success("Ordine categorie aggiornato");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Riordino non riuscito";
      toast.error(message);
    } finally {
      setMovingCategoryId(null);
    }
  };

  const handleSaveRule = async (categoryId: string) => {
    if (!currentTenant) return;
    const supabase = createClient();
    const draft = ruleDrafts[categoryId] || createDefaultRuleDraft();
    setSavingRuleId(categoryId);

    try {
      const { data: siteConfigData, error: siteConfigError } = await supabase
        .from("site_config")
        .select("theme")
        .eq("tenant_id", currentTenant.id)
        .maybeSingle();

      if (siteConfigError) {
        throw siteConfigError;
      }

      const currentTheme = ((siteConfigData as SiteConfigRow | null)?.theme || {}) as Record<string, unknown>;
      const editorialAutomation = normalizeEditorialAutomationConfig(
        (currentTheme.editorialAutomation as Record<string, unknown> | undefined) || null
      );
      const nextCategoryRules = {
        ...(editorialAutomation.categoryRules || {}),
      } as Record<string, EditorialCategoryAutomationRule>;

      if (draft.spotlightTagIds.length === 0) {
        delete nextCategoryRules[categoryId];
      } else {
        nextCategoryRules[categoryId] = {
          homepageSlotId: draft.homepageSlotId || null,
          spotlightTagIds: draft.spotlightTagIds,
          displayMode: draft.displayMode,
        };
      }

      const { error } = await supabase
        .from("site_config")
        .upsert({
          tenant_id: currentTenant.id,
          theme: {
            ...currentTheme,
            editorialAutomation: {
              ...editorialAutomation,
              categoryRules: nextCategoryRules,
            },
          },
        }, { onConflict: "tenant_id" });

      if (error) {
        throw error;
      }

      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "full_rebuild" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Regola salvata, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }

      toast.success("Regola editoriale salvata");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Salvataggio regola non riuscito";
      toast.error(message);
    } finally {
      setSavingRuleId(null);
    }
  };

  const canEdit = ["admin", "chief_editor", "editor"].includes(currentRole ?? "");

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
          {categories.length} categori{categories.length === 1 ? "a" : "e"}
        </p>
        {canEdit && (
          <div className="flex items-center gap-2">
            <AIButton
              actions={[
                {
                  id: "suggerisci_categorie",
                  label: "Suggerisci categorie mancanti",
                  prompt: "Analizza le seguenti categorie di un giornale locale italiano e suggerisci categorie mancanti che potrebbero essere utili per una copertura completa delle notizie. Categorie esistenti: {context}",
                },
              ]}
              contextData={categories.map((category) => category.name).join(", ")}
              onApply={(_actionId, result) => {
                setName(result.split("\n")[0]?.replace(/^[-*\d.)\s]+/, "").trim() || result);
                setShowNew(true);
              }}
            />
            <button
              onClick={() => {
                resetForm();
                setShowNew(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--c-accent)")}
            >
              <Plus className="w-4 h-4" /> Nuova Categoria
            </button>
          </div>
        )}
      </div>

      {(showNew || editingId) && (
        <div className="rounded-lg p-5 mb-6" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              {editingId ? "Modifica Categoria" : "Nuova Categoria"}
            </h3>
            <button onClick={resetForm}>
              <X className="w-4 h-4" style={{ color: "var(--c-text-3)" }} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) {
                    setSlug(slugify(e.target.value, { lower: true, strict: true, locale: "it" }));
                  }
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
                placeholder="Es: Cronaca"
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
                placeholder="cronaca"
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Descrizione</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid var(--c-border)" }}
                placeholder="Descrizione opzionale"
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>Colore</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                  style={{ border: "1px solid var(--c-border)" }}
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                  style={{ border: "1px solid var(--c-border)" }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium rounded-lg transition"
              style={{ color: "var(--c-text-2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition"
              style={{ background: "var(--c-accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--c-accent)")}
            >
              <Check className="w-4 h-4" /> Salva
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: "var(--c-text-3)" }}>Caricamento...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessuna categoria</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {categories.map((category) => {
              const ruleDraft = ruleDrafts[category.id] || createDefaultRuleDraft();
              return (
                <div key={category.id} className="px-5 py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 shrink-0" style={{ color: "var(--c-text-3)" }} />
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--c-text-0)" }}>{category.name}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-3)" }}>/{category.slug}</p>
                    </div>
                    {category.description && (
                      <p className="text-xs hidden lg:block max-w-[220px] truncate" style={{ color: "var(--c-text-3)" }}>
                        {category.description}
                      </p>
                    )}
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleMoveCategory(category.id, "up")}
                          disabled={movingCategoryId === category.id}
                          className="w-8 h-8 flex items-center justify-center rounded transition disabled:opacity-50"
                          style={{ border: "1px solid var(--c-border)", color: "var(--c-text-2)" }}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveCategory(category.id, "down")}
                          disabled={movingCategoryId === category.id}
                          className="w-8 h-8 flex items-center justify-center rounded transition disabled:opacity-50"
                          style={{ border: "1px solid var(--c-border)", color: "var(--c-text-2)" }}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="w-8 h-8 flex items-center justify-center rounded transition"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category.id)}
                          className="w-8 h-8 flex items-center justify-center rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg-2)", border: "1px solid var(--c-border)" }}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-text-2)" }}>
                      <Newspaper className="w-4 h-4" />
                      Regola Homepage
                    </div>
                    <p className="text-xs leading-5" style={{ color: "var(--c-text-3)" }}>
                      Puoi preparare la logica editoriale anche prima di avere homepage e slot definitivi. Se un articolo di <strong>{category.name}</strong> riceve uno dei tag qui sotto, il CMS terra` pronta la regola; appena colleghi uno slot homepage, il placement diventera` operativo.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--c-text-2)" }}>
                          Slot homepage
                        </label>
                        <select
                          value={ruleDraft.homepageSlotId}
                          onChange={(event) => updateRuleDraft(category.id, { homepageSlotId: event.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                          style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                        >
                          <option value="">Slot da decidere piu` avanti</option>
                          {homepageSlots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.label}{slot.placement_duration_hours ? ` · ${slot.placement_duration_hours}h` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--c-text-2)" }}>
                          Modalita`
                        </label>
                        <select
                          value={ruleDraft.displayMode}
                          onChange={(event) => updateRuleDraft(category.id, { displayMode: event.target.value as PlacementDisplayMode })}
                          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                          style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                        >
                          <option value="duplicate">Duplica tra homepage e categoria</option>
                          <option value="exclusive">Solo homepage finche` il placement e` attivo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--c-text-2)" }}>
                          Tag attivatori
                        </label>
                        <select
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!value) return;
                            if (!ruleDraft.spotlightTagIds.includes(value)) {
                              updateRuleDraft(category.id, { spotlightTagIds: [...ruleDraft.spotlightTagIds, value] });
                            }
                            event.target.value = "";
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1"
                          style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}
                        >
                          <option value="">Aggiungi tag...</option>
                          {tags
                            .filter((tag) => !ruleDraft.spotlightTagIds.includes(tag.id))
                            .map((tag) => (
                              <option key={tag.id} value={tag.id}>{tag.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    {homepageSlots.length === 0 && (
                      <p className="text-[11px]" style={{ color: "var(--c-text-3)" }}>
                        Nessuno slot homepage manuale/misto disponibile. Va bene comunque: puoi salvare i tag e la modalita` adesso, poi collegare lo slot quando avrai definito la homepage.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {ruleDraft.spotlightTagIds.length === 0 ? (
                        <span className="text-xs" style={{ color: "var(--c-text-3)" }}>
                          Nessun tag attivatore configurato.
                        </span>
                      ) : (
                        ruleDraft.spotlightTagIds.map((tagId) => {
                          const tag = tags.find((item) => item.id === tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
                            >
                              {tag.name}
                              <button
                                type="button"
                                onClick={() =>
                                  updateRuleDraft(category.id, {
                                    spotlightTagIds: ruleDraft.spotlightTagIds.filter((value) => value !== tagId),
                                  })
                                }
                              >
                                <X className="w-3 h-3" style={{ color: "var(--c-text-3)" }} />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleSaveRule(category.id)}
                          disabled={savingRuleId === category.id}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background: "var(--c-accent)" }}
                        >
                          <Check className="w-4 h-4" />
                          {savingRuleId === category.id ? "Salvataggio..." : "Salva regola"}
                        </button>
                      </div>
                    )}
                    {ruleDraft.spotlightTagIds.length > 0 && !ruleDraft.homepageSlotId && (
                      <p className="text-[11px]" style={{ color: "var(--c-accent)" }}>
                        Regola salvabile anche senza slot: restera` in stato preparato finche` non colleghi uno slot homepage.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
