"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestPublishTrigger } from "@/lib/publish/client";
import { useAuthStore } from "@/lib/store";
import slugify from "slugify";
import toast from "react-hot-toast";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import AIButton from "@/components/ai/AIButton";

interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export default function TagPage() {
  const { currentTenant, currentRole } = useAuthStore();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");

  const loadTags = useCallback(async () => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("tenant_id", currentTenant.id)
      .order("name");
    if (data) setTags(data);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTags();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTags]);

  const handleAdd = async () => {
    if (!currentTenant || !newTag.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("tags").insert({
      tenant_id: currentTenant.id,
      name: newTag.trim(),
      slug: slugify(newTag.trim(), { lower: true, strict: true, locale: "it" }),
    });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Tag già esistente" : error.message);
    } else {
      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "full_rebuild" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Tag creato, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      toast.success("Tag creato");
      setNewTag("");
      loadTags();
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentTenant) return;
    const supabase = createClient();
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      toast.error("Errore");
    } else {
      try {
        await requestPublishTrigger(currentTenant.id, [{ type: "full_rebuild" }]);
      } catch (publishError) {
        const publishMessage = publishError instanceof Error ? publishError.message : "Publish non aggiornato";
        toast.error(`Tag eliminato, ma il publish non e' stato aggiornato: ${publishMessage}`);
      }
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const canEdit = ["admin", "chief_editor", "editor"].includes(currentRole ?? "");

  return (
    <div className="max-w-2xl">
      {/* Add tag */}
      {canEdit && (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nuovo tag..."
            className="flex-1 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ border: "1px solid var(--c-border)" }}
          />
          <button
            onClick={handleAdd}
            disabled={!newTag.trim()}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            style={{ background: "var(--c-accent)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-accent-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--c-accent)"}
          >
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
          <AIButton
            compact
            actions={[
              {
                id: "tag-strategy",
                label: "Strategia tag",
                prompt: "Analizza i tag esistenti del CMS e suggerisci pulizia tassonomica, tag mancanti, unificazioni e uso corretto per SEO e redazione: {context}",
              },
            ]}
            contextData={JSON.stringify(
              {
                tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
                tags,
                draftTag: newTag,
              },
              null,
              2,
            )}
          />
        </div>
      )}

      {/* Tags */}
      {loading ? (
        <p className="text-sm text-center py-12" style={{ color: "var(--c-text-3)" }}>Caricamento...</p>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <TagIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-text-3)" }} />
          <p className="text-sm" style={{ color: "var(--c-text-3)" }}>Nessun tag</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm group transition"
              style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)", color: "var(--c-text-1)" }}
            >
              <TagIcon className="w-3.5 h-3.5" style={{ color: "var(--c-text-3)" }} />
              {tag.name}
              {canEdit && (
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
